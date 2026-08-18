import { GleSYSAPI } from "glesys-api";
import { describe, expect, it } from "vitest";

// The glesys-api package ships no types; src/glesys-api.d.ts is a hand-written
// mirror, so verify every declared method actually exists in the package.
const declaredMethods: Record<string, string[]> = {
  server: [
    "list",
    "details",
    "create",
    "edit",
    "destroy",
    "start",
    "stop",
    "templates",
    "listPlans",
    "allowedArguments",
    "estimatedCost",
    "previewCloudConfig",
    "networkAdapters",
  ],
  serverDisk: ["limits", "estimatedCost", "create", "reconfigure", "updateName", "delete"],
  sshKey: ["list", "add", "remove"],
  networkAdapter: ["create", "details", "edit", "delete"],
  ip: [
    "listOwn",
    "listFree",
    "details",
    "take",
    "release",
    "add",
    "remove",
    "setPTR",
    "resetPTR",
    "estimatedCost",
  ],
  privateNetwork: [
    "list",
    "details",
    "create",
    "edit",
    "delete",
    "listSegments",
    "createSegment",
    "editSegment",
    "deleteSegment",
    "estimatedCost",
  ],
  domain: [
    "list",
    "details",
    "add",
    "delete",
    "listRecords",
    "addRecord",
    "updateRecord",
    "deleteRecord",
    "available",
    "priceList",
    "register",
    "transfer",
  ],
  objectStorage: [
    "listInstances",
    "instanceDetails",
    "createInstance",
    "editInstance",
    "deleteInstance",
    "createCredential",
    "deleteCredential",
  ],
  loadBalancer: [
    "list",
    "details",
    "create",
    "edit",
    "destroy",
    "addBackEnd",
    "editBackEnd",
    "removeBackEnd",
    "addTarget",
    "editTarget",
    "enableTarget",
    "disableTarget",
    "removeTarget",
    "addFrontEnd",
    "editFrontEnd",
    "removeFrontEnd",
    "listCertificate",
    "addCertificate",
    "removeCertificate",
    "errors",
    "addToBlocklist",
    "removeFromBlocklist",
  ],
  fileStorage: [
    "listVolumes",
    "volumeDetails",
    "listPlans",
    "createVolume",
    "editVolume",
    "resourceUsage",
    "deleteVolume",
  ],
  database: [
    "list",
    "details",
    "listPlans",
    "create",
    "delete",
    "connectionDetails",
    "updateAllowList",
  ],
};

describe("glesys-api type shim", () => {
  it("declares only methods that exist in the package", () => {
    const glesys = new GleSYSAPI({ apiUser: "x", apiKey: "y" }) as unknown as Record<
      string,
      Record<string, unknown>
    >;

    for (const [module, names] of Object.entries(declaredMethods)) {
      for (const name of names) {
        expect(typeof glesys[module][name], `${module}.${name}`).toBe("function");
      }
    }
  });
});
