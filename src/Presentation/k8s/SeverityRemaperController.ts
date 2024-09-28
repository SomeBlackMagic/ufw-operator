import * as k8s from "@kubernetes/client-node";
import {
    V1alpha1SeverityRemaper
} from "../../Domain/Entity/prometheus-alerting-middleware.io_severityremapers.generated";
import console from "console";
import {container, inject, injectable} from "tsyringe";
import BaseK8SController from "../../Kernel/K8SKernel/BaseController";
import {Core} from "../../Kernel/App";
import EventDispatcher from "../../Kernel/EventDispatcher";
import SeverityRemaperWasAdded from "../../Domain/Events/SeverityRemaperWasAdded";
import SeverityRemaperEventProcessed from "../../Domain/Events/SeverityRemaperEventProcessed";
import SeverityRemaperWasModified from "../../Domain/Events/SeverityRemaperWasModified";
import SeverityRemaperWasDeleted from "../../Domain/Events/SeverityRemaperWasDeleted";
import * as process from "process";

const CRD_GROUP = "prometheus-alerting-middleware.io";
const CRD_VERSION = "v1alpha1";
const CRD_PLURAL = "severityremapers";

@injectable()
export default class SeverityRemaperController implements BaseK8SController {
    private watcher: k8s.Watch;

    private reconcileScheduled = false;

    private loadedResources: V1alpha1SeverityRemaper[] = []

    private eventBus: EventDispatcher;

    private kubeApiCustomObjects: k8s.CustomObjectsApi;

    public constructor(
        @inject(EventDispatcher) eventBus: EventDispatcher
    ) {
        this.eventBus = eventBus;
    }

    public init(): Promise<any> {
        this.eventBus.addEventListener('SeverityRemaperEventProcessed', this.updateStatus.bind(this))
        return Promise.resolve()
    }



    public async run(): Promise<any> {
        this.kubeApiCustomObjects = container.resolve<k8s.CustomObjectsApi>('K8SKernel.kubeApiCustomObjects');

        this.watcher = new k8s.Watch(container.resolve<k8s.KubeConfig>('K8SKernel.kubeConfig'));
        await this.watchResource()
    }

    private async watchResource() {
        Core.info(`Start watching ${CRD_GROUP}/${CRD_VERSION}/${CRD_PLURAL}`, [], 'k8s.SeverityRemaperController');
        return this.watcher.watch(
            `/apis/${CRD_GROUP}/${CRD_VERSION}/${CRD_PLURAL}`,
            {},
            this.onEvent.bind(this),
            this.onDone.bind(this),
        )
    }

    private async onEvent(phase: string, apiObj: V1alpha1SeverityRemaper) {
         Core.info('Received event in phase', {phase}, 'k8s.SeverityRemaperController');

        if (phase == "ADDED") {
            await this.handleAddResource(apiObj)
            // scheduleReconcile(apiObj);
            this.loadedResources.push(apiObj);
        } else if (phase == "MODIFIED") {
            try {
                let matched: object | V1alpha1SeverityRemaper = {}
                this.loadedResources.forEach((item: V1alpha1SeverityRemaper) => {
                    if(
                        apiObj.metadata.name === item.metadata.name &&
                        apiObj.metadata.generation === item.metadata.generation
                    ) {
                        matched=item
                    }
                })

                // @ts-ignore
                if(JSON.stringify(matched) !== '{}' && JSON.stringify(apiObj.spec) === JSON.stringify(matched.spec)) {
                    Core.debug('This object already apply. Skipped', [], 'k8s.SeverityRemaperController')
                    return;
                }

                // @ts-ignore
                this.scheduleReconcile(matched, apiObj);
            } catch (err) {
                // log(err);
            }
        } else if (phase == "DELETED") {
            await this.handleDeleteResource(apiObj)
            this.loadedResources.filter(function(item, idx) {
                    return apiObj.metadata.name === item.metadata.name &&
                        apiObj.metadata.generation === item.metadata.generation;
                });
            // await deleteResource(apiObj);
        } else {
            Core.emergency(`k8s: Unknown event type: ${phase} for ${CRD_GROUP}/${CRD_VERSION}/${CRD_PLURAL} `)
        }
    }


    private onDone(err: any) {
        console.log(err);
        process.exit(1)
        // this.watchResource();
    }

    private scheduleReconcile(oldObject: V1alpha1SeverityRemaper, newObject: V1alpha1SeverityRemaper) {
        if (!this.reconcileScheduled) {
            setTimeout(this.handleModifyResource.bind(this), 1000, oldObject, newObject);
            this.reconcileScheduled = true;
        }
    }


    private async handleAddResource(obj: V1alpha1SeverityRemaper) {
        this.eventBus.dispatchEvent(new SeverityRemaperWasAdded(obj))

    }
    private async handleModifyResource(oldObject: V1alpha1SeverityRemaper, newObject: V1alpha1SeverityRemaper) {
        this.eventBus.dispatchEvent(new SeverityRemaperWasModified(oldObject, newObject))
    }

    private async handleDeleteResource(obj: V1alpha1SeverityRemaper) {
        this.eventBus.dispatchEvent(new SeverityRemaperWasDeleted(obj))
    }

    public async updateStatus(event: SeverityRemaperEventProcessed) {
        let obj = await this.kubeApiCustomObjects.getClusterCustomObject(
            CRD_GROUP,
            CRD_VERSION,
            CRD_PLURAL,
            event.resourceName
        )

        // @ts-ignore
        let entity:V1alpha1SeverityRemaper = obj.body
        if(!entity.status) {
            entity.status = {
                conditions: [
                    event.status
                ]
            }
        }
        entity.status.conditions = entity.status.conditions.map((item => {
            // @ts-ignore
            if (item.type === event.status.type) {
                return event.status
            }
            return item;
        }));
        try {
            await this.kubeApiCustomObjects.replaceClusterCustomObjectStatus(
                CRD_GROUP,
                CRD_VERSION,
                CRD_PLURAL,
                event.resourceName,
                entity

            )
        } catch (e) {
            console.error(e.body);
            throw e
        }

    }
}

container.register('BaseK8SController', SeverityRemaperController)
