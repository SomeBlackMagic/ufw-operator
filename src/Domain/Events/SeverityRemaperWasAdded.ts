import {DispatchableEvent} from "../../Kernel/EventDispatcher";
import {V1alpha1SeverityRemaper} from "../Entity/prometheus-alerting-middleware.io_severityremapers.generated";

export default class SeverityRemaperWasAdded extends DispatchableEvent {
    public constructor(private _object:V1alpha1SeverityRemaper) {
        super('SeverityRemaperWasAdded');
    }

    get object(): V1alpha1SeverityRemaper {
        return this._object;
    }
}