// /!\ WARNING :  THIS FILE IS AUTOGENERATED FROM A KUBERNETES CUSTOM RESOURCE DEFINITION FILE. DO NOT CHANGE IT, use crd-client-generator-ts to update it.
import { CustomObjectsApi } from "@kubernetes/client-node/dist/gen/api/customObjectsApi";
export type Result<T> = T | { error: any };

export type V1alpha1SeverityRemaper = {
  apiVersion: string;
  kind: string;
  metadata: {
    name?: string;
    namespace?: string;
    annotations?: {};
    labels?: {};
    resourceVersion?: string;
    generation?: number;
    deletionTimestamp?: string;
    deletionGracePeriodSeconds?: string;
    creationTimestamp?: string;
  };
  spec: { map?: Array<{ alertName?: string; destinationSeverity?: string }> };
  status: {
    conditions?: Array<{
      type?: string;
      status?: string;
      lastTransitionTime?: string;
      reason?: string;
      message?: string;
    }>;
  };
};
export type V1alpha1SeverityRemapersList = {
  body: { items: V1alpha1SeverityRemaper[] };
};

export class V1alpha1SeverityRemaperClient {
  public constructor(private customObjects: CustomObjectsApi) {}
  public async getV1alpha1SeverityRemapersList(): Promise<
    Result<V1alpha1SeverityRemapersList>
  > {
    try {
      return await this.customObjects
        .listClusterCustomObject(
          "prometheus-alerting-middleware.io",
          "v1alpha1",
          "severityremapers"
        )
        .then((res) => {
          return res.body;
        })
        .catch((data) => {
          return data;
        });
    } catch (error) {
      return { error };
    }
  }

  public async getV1alpha1SeverityRemaper(
    V1alpha1SeverityRemaperName: string
  ): Promise<Result<V1alpha1SeverityRemaper>> {
    try {
      return await this.customObjects
        .getClusterCustomObject(
          "prometheus-alerting-middleware.io",
          "v1alpha1",
          "severityremapers",
          V1alpha1SeverityRemaperName
        )
        .then((res) => {
          return res.body;
        })
        .catch((data) => {
          return data;
        });
    } catch (error) {
      return { error };
    }
  }

  public async deleteV1alpha1SeverityRemaper(
    V1alpha1SeverityRemaperName: string
  ) {
    try {
      return await this.customObjects
        .deleteClusterCustomObject(
          "prometheus-alerting-middleware.io",
          "v1alpha1",
          "severityremapers",
          V1alpha1SeverityRemaperName
        )
        .then((res) => {
          return res.body;
        })
        .catch((data) => {
          return data;
        });
    } catch (error) {
      return { error };
    }
  }

  public async createV1alpha1SeverityRemaper(
    body: V1alpha1SeverityRemaper
  ): Promise<Result<V1alpha1SeverityRemaper>> {
    try {
      return await this.customObjects
        .createClusterCustomObject(
          "prometheus-alerting-middleware.io",
          "v1alpha1",
          "severityremapers",
          body
        )
        .then((res) => {
          return res.body;
        })
        .catch((data) => {
          return data;
        });
    } catch (error) {
      return { error };
    }
  }

  public async patchV1alpha1SeverityRemaper(
    V1alpha1SeverityRemaperName: string,
    body: Partial<V1alpha1SeverityRemaper>
  ): Promise<Result<V1alpha1SeverityRemaper>> {
    try {
      return await this.customObjects
        .patchClusterCustomObject(
          "prometheus-alerting-middleware.io",
          "v1alpha1",
          "severityremapers",
          V1alpha1SeverityRemaperName,
          body
        )
        .then((res) => {
          return res.body;
        })
        .catch((data) => {
          return data;
        });
    } catch (error) {
      return { error };
    }
  }
}
