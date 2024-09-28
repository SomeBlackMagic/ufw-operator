import { env, envBoolean, envEnum, envNumber } from '../Kernel/Helpers/functions';
import {ConsoleTarget} from '@elementary-lab/logger/src/Targets/ConsoleTarget';
import {SentryTarget} from '@elementary-lab/logger/src/Targets/SentryTarget';
import {LogLevel} from '@elementary-lab/logger/src/Types';
import {AppInfo, CoreConfigInterface} from '../Kernel/App';
import HttpKernelConfigInterface from "../Kernel/HttpKernel/ConfigInterface";
import * as process from "process";
import PrometheusApiController from "../Presentation/Api/PrometheusApiController";
import ProcessAlertsHandler from "../Application/Comman/ProcessAlertsHandler";
import SeverityRemaperController from "../Presentation/k8s/SeverityRemaperController";
import RemapingLogic from "../Domain/Logic/RemapingLogic";

export class ConfigFactory {
    public static diClassLoader() {
        return [
            ProcessAlertsHandler,
            SeverityRemaperController,
            RemapingLogic
        ]
    }
    public static getBase(): AppInfo {
        return {
            id: 'Prometheus Alerting Middleware',
            version: env('APP_VERSION'),
            environment: env('APP_ENV'),
        };
    }

    public static getHttpKernelConfig(): HttpKernelConfigInterface {
        return {
            webServer: {
                host: '*',
                port: 3001,
                timeout: 300,
                metrics: {
                    enabled: true,
                    collectDefaultMetrics: false,
                    prefix: ''
                },
                probe: {
                    enabled: true
                },
                controllers: [
                    PrometheusApiController.name
                ]
            },
        }
    }

    public static getCore(): CoreConfigInterface {

        return {
            log: {
                // @ts-ignore
                flushBySignals: [ 'exit' ],
                flushByCountInterval: 10,
                flushByTimeInterval: 1000,
                traceLevel: 3,
                targets: [
                    new ConsoleTarget({
                        enabled: true,
                        levels: [ LogLevel.INFO, LogLevel.ERROR, LogLevel.NOTICE, LogLevel.DEBUG, LogLevel.WARNING, LogLevel.EMERGENCY]
                    }),
                    new SentryTarget({
                        enabled: envBoolean('APP_SENTRY_ENABLED', false),
                        dsn: env('APP_SENTRY_DSN', 'https://fake@fake.local/123'),
                        release: ConfigFactory.getBase().version,
                        environment: ConfigFactory.getBase().environment,
                        levels: [LogLevel.EMERGENCY, LogLevel.ERROR, LogLevel.WARNING]
                    })
                ]
            }
        };
    }


    public static getServices(): ServicesConfigInterface {
        return {
            alertManagerUrl: env('APP_ALERTMANAGER_URL', 'http://localhost/'),
        };
    }
}

interface ServicesConfigInterface {
    alertManagerUrl: string
}
