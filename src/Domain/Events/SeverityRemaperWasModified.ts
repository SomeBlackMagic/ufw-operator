import {DispatchableEvent} from "../../Kernel/EventDispatcher";
import {V1alpha1SeverityRemaper} from "../Entity/prometheus-alerting-middleware.io_severityremapers.generated";
import SeverityRemaperWasAdded from "./SeverityRemaperWasAdded";

export default class SeverityRemaperWasModified extends DispatchableEvent {
    public constructor(
        private _oldObject:V1alpha1SeverityRemaper,
        private _newObject:V1alpha1SeverityRemaper
    ) {
        super('SeverityRemaperWasModified');
    }


    get oldObject(): V1alpha1SeverityRemaper {
        return this._oldObject;
    }

    get newObject(): V1alpha1SeverityRemaper {
        return this._newObject;
    }
}