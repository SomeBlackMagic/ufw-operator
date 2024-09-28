import { BaseCommand } from './BaseCommand';
import {Core} from '../App';

const {
    CommandBus,
    CommandHandlerMiddleware,
    ClassNameExtractor,
    InMemoryLocator,
    HandleInflector,
    LoggerMiddleware
} = require('simple-command-bus');

export class TacticianCommandBus implements CommandBusInterface {

    private commandBus;

    public constructor(handlers: object, middlewares: object[]) {
        // Handler middleware
        let commandHandlerMiddleware = new CommandHandlerMiddleware(
            new ClassNameExtractor(),
            new InMemoryLocator(handlers),
            new HandleInflector(),
        );

        this.commandBus = new CommandBus([
            ...middlewares,
            new LoggerMiddleware({
                log: (text, command: BaseCommand, returnValue) => {
                    Core.info(text + '-> ' + command.$name, [command.$uuid, returnValue], 'CommandBus' );
                }

            }),
            commandHandlerMiddleware
        ]);
    }

    public handle<TResult>(command: BaseCommand): TResult {
        return this.commandBus.handle(command);
    }
}


export interface CommandBusInterface {
    handle<TResult>(command: BaseCommand): TResult;
}