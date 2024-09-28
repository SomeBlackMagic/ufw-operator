export interface PrometheusAlertEntity {
    annotations: {
        description: string,
        summary: string,
    }
    endsAt: string,
    startsAt: string,
    generatorURL: string,
    labels: {
        alertname: string
        instance: string
        job: string
        monitor: string
        severity: string
    },
}