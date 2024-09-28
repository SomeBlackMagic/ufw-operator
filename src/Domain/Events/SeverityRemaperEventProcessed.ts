import {DispatchableEvent} from "../../Kernel/EventDispatcher";

export default class SeverityRemaperEventProcessed extends DispatchableEvent {
    public constructor(private _resourceName:string, private _status: object) {
        super('SeverityRemaperEventProcessed');
    }


    get resourceName(): string {
        return this._resourceName;
    }

    get status(): object {
        return this._status;
    }
}