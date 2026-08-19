import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient, listAllTools } from "../testing.js";

describe("server tools", () => {
  it("requires keepip on server_destroy", async () => {
    const tools = await listAllTools();
    const destroy = tools.find((t) => t.name === "server_destroy");

    expect(destroy?.inputSchema.required).toContain("keepip");
  });

  it("maps keepip to yes/no on server_destroy", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "server_destroy",
      arguments: { serverid: "kvm123456", keepip: false },
    });

    expect(calls.at(-1)).toEqual({ serverid: "kvm123456", keepip: "no" });
  });

  it("joins sshkeyids into a comma-separated string on server_create", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "server_create",
      arguments: {
        datacenter: "Falkenberg",
        platform: "VMware",
        hostname: "web01",
        templatename: "tpl-1",
        sshkeyids: [1, 2],
      },
    });

    expect(calls.at(-1)).toMatchObject({ sshkeyids: "1,2" });
  });

  it("maps enabled to yes/no on the backup tools", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "server_backup",
      arguments: { serverid: "wps123456", enabled: false },
    });

    expect(calls.at(-1)).toEqual({ serverid: "wps123456", enabled: "no" });

    await client.callTool({
      name: "server_estimated_backup_cost",
      arguments: { serverid: "wps123456", enabled: true },
    });

    expect(calls.at(-1)).toEqual({ serverid: "wps123456", enabled: "yes" });
  });

  it("maps includestate to yes on server_details", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "server_details",
      arguments: { serverid: "kvm123456", includestate: true },
    });

    expect(calls.at(-1)).toEqual({ serverid: "kvm123456", includestate: "yes" });
  });
});
