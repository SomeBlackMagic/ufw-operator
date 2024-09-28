import {Core} from "../App";
import {ConfigFactory} from "@Config/app-config";
import {WebServer} from "./WebServer";
import {Probe} from "./Probe";
import HttpKernelConfigInterface from "./ConfigInterface";
import "reflect-metadata";
import {container} from "tsyringe";
import * as console from "console";
import BaseApiController from "./BaseApiController";
import {KernelInterface} from "../KernelInterface";

export default class HttpKernel implements KernelInterface {

    protected config: HttpKernelConfigInterface
    public constructor() {
        this.config = ConfigFactory.getHttpKernelConfig()
    }

    public boot(): Promise<boolean> {
        return (async () => {

            const http = new WebServer(this.config.webServer);
            http.init();
            container.register('WebServer', {useValue: http});


            if( this.config.webServer.probe.enabled === true ) {
                const httpProbe =  new Probe();
                await httpProbe.init()
                container.register('WebServerProbe', {useValue: httpProbe});
            }

            const instance = container.resolveAll<BaseApiController>('ApiControllerInterface');
            instance.forEach((item) => {
                http.registerRoutes(item.registerRoutes())
            })
            this.setStopListener();

            return true



        })();
    }

    public async run(): Promise<number> {

        await container.resolve<WebServer>('WebServer').start()
        // Core.info('Run app:');
        // setTimeout(() => {
        //     console.log('!123')
        // }, 11000);
        return Promise.resolve(0);
        (async () => {
            // Core.info('Init services');
            // await Promise.all([...inputs, ...outputs].map((item: BaseModule<any>) => {return item.init(); })).catch((error) => {
            //     Core.error('Can not init App:');
            //     throw error;
            // });
            // Core.info('System initialized');
            // await Core.app().getService<Probe>('probe').run();
            // await Core.app().getService<WebServer>('http').start();
            // Core.info('Run services');
            // await Promise.all([...inputs, ...outputs].map((item: BaseModule<any>) => {return item.run(); })).catch((error) => {
            //     Core.error('Can not start App', error);
            //     process.exit(1);
            // });

        })();



        return 0;
    }

    public setStopListener() {
        Core.app().setExitHandler((data: {code:string}) => {
            Core.info('PCNTL signal received. Closing connection server.', [data.code]);
            (async () => {
                // await Promise.all([...inputs, ...outputs].map((item: BaseModule<any>) => {return item.stop(); })).catch((error) => {
                //     Core.error('Can not stop services', error);
                //     process.exitCode = 1;
                // });
                container.resolve<WebServer>('WebServer').stop();
                Core.info('System gracefully stopped');
                // @ts-ignore
                await process.flushLogs();
            })();
        });
        Core.app().subscribeOnProcessExit();
    }

}