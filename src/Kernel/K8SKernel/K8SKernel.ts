import {container} from "tsyringe";

import {KernelInterface} from "../KernelInterface";
import * as k8s from "@kubernetes/client-node";
import BaseK8SController from "./BaseController";
import console from "console";
import * as process from "process";
import {Core} from "../App";

export default class K8SKernel implements KernelInterface {
    private kubeConfig: k8s.KubeConfig;
    private kubeApi: k8s.AppsV1Api;
    private kubeApiCustomObjects: k8s.CustomObjectsApi;

    private controllers = [];

    public async boot(): Promise<any> {
        this.kubeConfig = new k8s.KubeConfig();
        this.kubeConfig.loadFromDefault();


        this.kubeApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
        this.kubeApiCustomObjects = this.kubeConfig.makeApiClient(k8s.CustomObjectsApi);

        container.register('K8SKernel.kubeConfig', {useValue: this.kubeConfig});
        container.register('K8SKernel.kubeApi', {useValue: this.kubeApi});
        container.register('K8SKernel.kubeApiCustomObjects', {useValue: this.kubeApiCustomObjects});

        this.controllers = container.resolveAll<BaseK8SController>('BaseK8SController')
        await Promise.all(
                this.controllers.map((item: BaseK8SController) => {
                return item.init()
            })
        )

    }

    public async run(): Promise<any> {
        await this.kubeApi.getAPIResources().catch((err) => {
            Core.error('Can not connect to k8s cluster', err,'K8SKernel');
            process.exit(1);
        })

        await Promise.all(
            this.controllers.map((item: BaseK8SController) => {
                return item.run()
            })
        )
    }
}