export class CommandHandlerInterface<T> {
    messageType: ClassConstructor<T>
}

export type ClassConstructor<TReturn> = new (...args: any[]) => TReturn