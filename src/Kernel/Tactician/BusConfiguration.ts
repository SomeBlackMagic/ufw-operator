import {CommandBusInterface, TacticianCommandBus} from "./CommandBus";
import {BaseHandler} from "./BaseHandler";
import console from "console";
import {container} from "tsyringe";
import {BaseCommand} from "./BaseCommand";
import {CommandHandlerInterface} from "./CommandHandlerInterface";

export default class BusConfiguration {

    private handlers: object = {}

    private middlewares: [] = [];
    public withHandler(handler: any): BusConfiguration {

        this.handlers[handler.name] = new handler()
        return this;
    }
    public withHandlerFromDI(): BusConfiguration {
        const handlers  = container.resolveAll<CommandHandlerInterface<any>>('CommandHandlerInterface')
        handlers.map((handlerItem) => {
            // @ts-ignore
            this.handlers[handlerItem.constructor.name] = handlerItem;
        });

        return this;
    }

    public build(): CommandBusInterface {
        return new TacticianCommandBus(this.handlers, this.middlewares);
    }
}