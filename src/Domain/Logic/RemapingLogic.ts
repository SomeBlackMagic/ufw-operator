import {inject, injectable} from "tsyringe";
import EventDispatcher, {DispatchableEvent} from "../../Kernel/EventDispatcher";
import console from "console";
import SeverityRemaperWasAdded from "../Events/SeverityRemaperWasAdded";
import SeverityRemaperEventProcessed from "../Events/SeverityRemaperEventProcessed";
import SeverityRemaperWasModified from "../Events/SeverityRemaperWasModified";
import {PrometheusAlertEntity} from "../Entity/PrometheusAlertEntity";

@injectable()
export default class RemapingLogic {

    private map: Map<string, string>;

    public constructor(
        @inject(EventDispatcher) private eventBus: EventDispatcher
    ) {
        this.eventBus.addEventListener('SeverityRemaperWasAdded', this.catchSeverityRemaperWasAdded.bind(this))
        this.eventBus.addEventListener('SeverityRemaperWasModified', this.catchSeverityRemaperWasModified.bind(this))
    }
    public async processRemap(message: PrometheusAlertEntity[]) {
        return message.map((item) => {
            if (this.map.has(item.labels.alertname)) {
                item.labels.severity  = this.map.get(item.labels.alertname)
                return item
            }
            return item
        });
    }

    private catchSeverityRemaperWasAdded(event: SeverityRemaperWasAdded) {
        let mapping = [];
        event.object.spec.map.forEach((item) => {
            mapping.push([item.alertName, item.destinationSeverity]);
        });

        this.map = new Map<string, string>(mapping);

        this.eventBus.dispatchEvent(new SeverityRemaperEventProcessed(event.object.metadata.name, {
            type: 'Ready',
            status: 'Loaded to app',
            lastTransitionTime: new Date().toString(),
            reason: 'SeverityRemaperEventProcessed',
            message: 'Config loaded to app',
        }))
    }

    private catchSeverityRemaperWasModified(event: SeverityRemaperWasModified) {
        let mapping = [];
        event.newObject.spec.map.forEach((item) => {
            mapping.push([item.alertName, item.destinationSeverity]);
        });

        this.map = new Map<string, string>(mapping);

        this.eventBus.dispatchEvent(new SeverityRemaperEventProcessed(event.newObject.metadata.name, {
            type: 'Ready',
            status: 'Config updated',
            lastTransitionTime: new Date().toString(),
            reason: 'SeverityRemaperEventProcessed',
            message: 'Map in application was updated',
        }))
    }


}