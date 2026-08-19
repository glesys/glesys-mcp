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

    request: {
      request(uri: string, options: Record<string, unknown>): Promise<GlesysResponse>;
    };

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
      estimatedCost: ApiCall;
      previewCloudConfig: ApiCall;
      networkAdapters: ApiCall;
      status: ApiCall;
      backup: ApiCall;
      estimatedBackupCost: ApiCall;
      listBackups: ApiCall;
      createManualBackup: ApiCall;
      deleteManualBackup: ApiCall;
      createFromBackup: ApiCall;
    };

    network: {
      list: ApiCall;
      details: ApiCall;
      create: ApiCall;
      edit: ApiCall;
      delete: ApiCall;
    };

    networkAdapter: {
      create: ApiCall;
      details: ApiCall;
      edit: ApiCall;
      delete: ApiCall;
    };

    email: {
      overview: ApiCall;
      list: ApiCall;
      quota: ApiCall;
      costs: ApiCall;
      createAccount: ApiCall;
      editAccount: ApiCall;
      resetPassword: ApiCall;
      createAlias: ApiCall;
      editAlias: ApiCall;
      delete: ApiCall;
    };

    archive: {
      list: ApiCall;
      details: ApiCall;
      allowedArguments: ApiCall;
      create: ApiCall;
      resize: ApiCall;
      changePassword: ApiCall;
      changeDescription: ApiCall;
      delete: ApiCall;
    };

    serverDisk: {
      limits: ApiCall;
      estimatedCost: ApiCall;
      create: ApiCall;
      reconfigure: ApiCall;
      updateName: ApiCall;
      delete: ApiCall;
    };

    loadBalancer: {
      list: ApiCall;
      details: ApiCall;
      create: ApiCall;
      edit: ApiCall;
      destroy: ApiCall;
      addBackEnd: ApiCall;
      editBackEnd: ApiCall;
      removeBackEnd: ApiCall;
      addTarget: ApiCall;
      editTarget: ApiCall;
      enableTarget: ApiCall;
      disableTarget: ApiCall;
      removeTarget: ApiCall;
      addFrontEnd: ApiCall;
      editFrontEnd: ApiCall;
      removeFrontEnd: ApiCall;
      listCertificate: ApiCall;
      addCertificate: ApiCall;
      removeCertificate: ApiCall;
      errors: ApiCall;
      addToBlocklist: ApiCall;
      removeFromBlocklist: ApiCall;
    };

    fileStorage: {
      listVolumes: ApiCall;
      volumeDetails: ApiCall;
      listPlans: ApiCall;
      createVolume: ApiCall;
      editVolume: ApiCall;
      resourceUsage: ApiCall;
      deleteVolume: ApiCall;
    };

    ip: {
      listOwn: ApiCall;
      listFree: ApiCall;
      details: ApiCall;
      take: ApiCall;
      release: ApiCall;
      add: ApiCall;
      remove: ApiCall;
      setPTR: ApiCall;
      resetPTR: ApiCall;
      estimatedCost: ApiCall;
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
      createDatabase: ApiCall;
      deleteDatabase: ApiCall;
      createUser: ApiCall;
      deleteUser: ApiCall;
      resetUserPassword: ApiCall;
      setUserPermissions: ApiCall;
      estimatedCost: ApiCall;
    };
  }
}
