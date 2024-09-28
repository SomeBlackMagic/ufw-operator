
import {BaseCommand} from "../../Kernel/Tactician/BaseCommand";
import {PrometheusAlertEntity} from "../../Domain/Entity/PrometheusAlertEntity";

export default class ProcessAlertsCommand extends BaseCommand {

    /**
     * A unique name that identifies the message. This should be done in namespace style syntax,
     * ie: organisation/domain/command-name
     */
    public readonly $name = 'ProcessAlertsCommand'

    /**
     * The contract version of this message. This can be incremented if this message changes the
     * number of properties etc to maintain backwards compatibility
     */
    public readonly $version = 1

    public readonly $uuid: string

    /**
     * Create a charge on a credit card
     * @param eventList
     */

    private readonly _eventList: PrometheusAlertEntity[]
    public constructor(uuid: string, eventList: PrometheusAlertEntity[]) {
        super();
        this.$uuid = uuid
        this._eventList = eventList;
    }


    public get eventList(): PrometheusAlertEntity[] {
        return this._eventList;
    }
}