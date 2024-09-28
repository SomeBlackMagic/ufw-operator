
import {container, injectable} from "tsyringe";
import BaseApiController, {ApiControllerInterface} from "../../Kernel/HttpKernel/BaseApiController";
import Router from "koa-router";
import {Context} from 'koa';
import {Core} from "../../Kernel/App";
import ProcessAlertsCommand from "../../Application/Comman/ProcessAlertsCommand";
import {PrometheusAlertEntity} from "../../Domain/Entity/PrometheusAlertEntity";
import {TacticianCommandBus} from "../../Kernel/Tactician/CommandBus";
import * as fs from "fs";

@injectable()
export default class PrometheusApiController extends BaseApiController implements ApiControllerInterface {
    public registerRoutes(): Router {
        let router = new Router({prefix: '/api/v2/'});
        router
            .post('alerts', this.alerts.bind(this));
        return router;
    }

    /**
     *
     * @param {Application.Context} ctx
     * @returns {Promise<void>}
     * @private
     */
    private async alerts(ctx: Context): Promise<void> {
        let bus = Core.app().get<TacticianCommandBus>('command-bus')

        const response = await bus.handle(new ProcessAlertsCommand(ctx.state.id, ctx.request.body as PrometheusAlertEntity[]))

        ctx.status = 500;
        ctx.body = response;
    }


}

container.register('ApiControllerInterface', PrometheusApiController)