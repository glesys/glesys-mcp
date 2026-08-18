import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient, listAllTools } from "./testing.js";

describe("buildServer", () => {
  it("gives the client instructions pointing at the API documentation", async () => {
    const { glesys } = capturingGlesys();
    const client = await connectedClient(glesys);

    expect(client.getInstructions()).toContain("github.com/glesys/api-docs");
  });

  it("registers every tool with a description and annotations", async () => {
    const tools = await listAllTools();

    expect(tools.length).toBe(124);

    for (const tool of tools) {
      expect(tool.description, tool.name).toBeTruthy();
      expect(tool.annotations, tool.name).toBeDefined();
    }
  });

  it("marks tools destructive if and only if their name says so", async () => {
    const tools = await listAllTools();
    const destructiveName = /_(delete|destroy|remove|release)(_|$)/;

    for (const tool of tools) {
      expect(tool.annotations?.destructiveHint === true, tool.name).toBe(
        destructiveName.test(tool.name),
      );
    }
  });

  it("never marks list/details/cost tools as writable", async () => {
    const tools = await listAllTools();
    const readOnlyName = /_(list|details|templates|listplans|pricelist|check|estimated)/;

    for (const tool of tools.filter((t) => readOnlyName.test(t.name))) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
    }
  });

  it("calls every tool without error against a fake client", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);
    const { tools } = await client.listTools();

    const sampleArgs: Record<string, unknown> = {
      serverid: "kvm123456",
      keepip: true,
      datacenter: "dc-sto1",
      platform: "KVM",
      hostname: "web01",
      templatename: "tpl-1",
      sshkey: "ssh-ed25519 AAAA",
      sshkeyids: "1",
      description: "test",
      name: "test",
      privatenetworkid: "pn-123",
      ipv4subnet: "192.0.2.0/24",
      id: "seg-1",
      domainname: "example.com",
      host: "www",
      type: "A",
      data: "192.0.2.1",
      recordid: 1,
      search: "example.com",
      email: "a@example.com",
      firstname: "Anna",
      lastname: "Berg",
      nationalid: "12345",
      address: "Street 1",
      city: "Town",
      zipcode: "12345",
      country: "SE",
      phonenumber: "+46701234567",
      authcode: "authcode1",
      instanceid: "os-ab123",
      credentialid: "cred-1",
      plankey: "plan",
      engine: "mysql",
      engineversion: "8",
      datacenterkey: "dc-sto1",
      allowlist: ["192.0.2.0/24"],
      ipaddress: "192.0.2.1",
      ipversion: 4,
      cloudconfig: "#cloud-config",
      networkadapterid: "na-123ab",
      networkid: "vlan123456",
      volumeid: "vol-123ab",
      planid: "plan-1",
      loadbalancerid: "lb123456",
      backendname: "web",
      frontendname: "http-in",
      targetname: "web01",
      port: 443,
      weight: 100,
      certificatename: "cert1",
      certificate: "YmFzZTY0",
      prefix: "192.0.2.0/24",
      sizeingib: 100,
      username: "archiveuser",
      password: "Passw0rd1",
      size: 100,
      emailaccount: "info@example.com",
      email: "info@example.com",
      emailalias: "sales@example.com",
      goto: ["info@example.com"],
    };

    const overrides: Record<string, Record<string, unknown>> = {
      privatenetwork_create_segment: { platform: "kvm" },
      filestorage_create_volume: { datacenter: "Falkenberg" },
      loadbalancer_create: { datacenter: "Falkenberg" },
      network_create: { datacenter: "Falkenberg" },
    };

    for (const tool of tools) {
      const required = (tool.inputSchema.required ?? []) as string[];
      const args = {
        ...Object.fromEntries(required.map((key) => [key, sampleArgs[key]])),
        ...overrides[tool.name],
      };
      const result = (await client.callTool({ name: tool.name, arguments: args })) as {
        isError?: boolean;
        content: { text: string }[];
      };

      expect(result.isError, `${tool.name}: ${result.content[0]?.text}`).toBeUndefined();
    }

    expect(calls.length).toBeGreaterThanOrEqual(tools.length);
  });
});
