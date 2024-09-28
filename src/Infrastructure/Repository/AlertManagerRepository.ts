import {PrometheusAlertEntity} from "../../Domain/Entity/PrometheusAlertEntity";
import {Axios, AxiosRequestConfig} from "axios";
import {injectable} from "tsyringe";

@injectable()
export default class AlertManagerRepository {

    private client: Axios

    public configure(client?: Axios, config?: AxiosRequestConfig ) {
        if(!client) {
            this.client = new Axios(config);
        } else {
            this.client = client;
        }


    }

    public async sentAlerts(alerts: PrometheusAlertEntity[]) {
        return await this.client.post('/api/v2/alerts', JSON.stringify(alerts), {
            headers: {
                "Content-Type": 'application/json'
            }
        })
        .then((res) => {
            return res.data
        })
        .catch((err) => {
            return { err: err}
        })
    }
}