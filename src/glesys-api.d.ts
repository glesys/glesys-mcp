declare module "glesys-api" {
  export interface GlesysStatus {
    code: number;
    text: string;
    timestamp: string;
  }

  export interface GlesysResponse {
    body: {
      response: {
        status: GlesysStatus;
        [payload: string]: unknown;
      };
    };
  }

  export type ApiCall = (data?: Record<string, unknown>) => Promise<GlesysResponse>;

  export class GleSYSAPI {
    constructor(options: { apiUser: string; apiKey: string });

    server: {
      list: ApiCall;
      details: ApiCall;
      create: ApiCall;
      edit: ApiCall;
      destroy: ApiCall;
      start: ApiCall;
      stop: ApiCall;
      templates: ApiCall;
      listPlans: ApiCall;
      allowedArguments: ApiCall;
    };

    sshKey: {
      list: ApiCall;
      add: ApiCall;
      remove: ApiCall;
    };

    privateNetwork: {
      list: ApiCall;
      details: ApiCall;
      create: ApiCall;
      edit: ApiCall;
      delete: ApiCall;
      listSegments: ApiCall;
      createSegment: ApiCall;
      editSegment: ApiCall;
      deleteSegment: ApiCall;
      estimatedCost: ApiCall;
    };

    domain: {
      list: ApiCall;
      details: ApiCall;
      add: ApiCall;
      delete: ApiCall;
      listRecords: ApiCall;
      addRecord: ApiCall;
      updateRecord: ApiCall;
      deleteRecord: ApiCall;
      available: ApiCall;
      priceList: ApiCall;
      register: ApiCall;
      transfer: ApiCall;
    };

    objectStorage: {
      listInstances: ApiCall;
      instanceDetails: ApiCall;
      createInstance: ApiCall;
      editInstance: ApiCall;
      deleteInstance: ApiCall;
      createCredential: ApiCall;
      deleteCredential: ApiCall;
    };

    database: {
      list: ApiCall;
      details: ApiCall;
      listPlans: ApiCall;
      create: ApiCall;
      delete: ApiCall;
      connectionDetails: ApiCall;
      updateAllowList: ApiCall;
    };
  }
}
