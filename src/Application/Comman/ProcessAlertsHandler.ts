import ProcessAlertsCommand from "./ProcessAlertsCommand";
import {BaseHandler} from "../../Kernel/Tactician/BaseHandler";
import {container, inject, injectable} from "tsyringe";
import {ClassConstructor, CommandHandlerInterface} from "../../Kernel/Tactician/CommandHandlerInterface";
import RemapingLogic from "../../Domain/Logic/RemapingLogic";
import AlertManagerRepository from "../../Infrastructure/Repository/AlertManagerRepository";
import {ConfigFactory} from "@Config/app-config";

@injectable()
export default class ProcessAlertsHandler
    extends BaseHandler<ProcessAlertsCommand>
    implements CommandHandlerInterface<ProcessAlertsCommand>
{


    public constructor(
        @inject(RemapingLogic) private remapingLogic: RemapingLogic,
        @inject(AlertManagerRepository) private alertManagerRepository: AlertManagerRepository
    ) {
        super();
    }

    messageType: ClassConstructor<ProcessAlertsCommand>;

    public async handle(message: ProcessAlertsCommand) {


        const newAlertsMap = await this.remapingLogic.processRemap(message.eventList);
        this.alertManagerRepository.configure(null, {
            baseURL: ConfigFactory.getServices().alertManagerUrl
        })
        const res =  await this.alertManagerRepository.sentAlerts(newAlertsMap);
        return res

    }
}
container.register('CommandHandlerInterface', ProcessAlertsHandler)