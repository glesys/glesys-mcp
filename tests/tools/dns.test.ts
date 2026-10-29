import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient } from "../testing.js";

describe("dns tools", () => {
  it("maps createrecords to yes/no on dns_add_domain", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "dns_add_domain",
      arguments: { domainname: "example.com", createrecords: false },
    });

    expect(calls.at(-1)).toEqual({ domainname: "example.com", createrecords: "no" });

    await client.callTool({
      name: "dns_add_domain",
      arguments: { domainname: "example.com", createrecords: true },
    });

    expect(calls.at(-1)).toEqual({ domainname: "example.com", createrecords: "yes" });

    await client.callTool({ name: "dns_add_domain", arguments: { domainname: "example.com" } });

    expect(calls.at(-1)).toEqual({ domainname: "example.com", createrecords: undefined });
  });

  it("lowercases and punycodes domain names", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "dns_domain_details",
      arguments: { domainname: "Example.COM" },
    });

    expect(calls.at(-1)).toEqual({ domainname: "example.com" });

    await client.callTool({
      name: "dns_list_records",
      arguments: { domainname: "räksmörgås.se" },
    });

    expect(calls.at(-1)).toEqual({ domainname: "xn--rksmrgs-5wao1o.se" });

    await client.callTool({
      name: "dns_domain_details",
      arguments: { domainname: "Not A Domain" },
    });

    expect(calls.at(-1)).toEqual({ domainname: "not a domain" });
  });

  it("rejects domain names with a path instead of truncating them", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    const result = await client.callTool({
      name: "dns_domain_details",
      arguments: { domainname: "example.com/x" },
    });

    expect(result.isError).toBe(true);
    expect(calls).toEqual([]);
  });

  it("appends trailing dots and maps autorenew on the zone extras", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "dns_edit_domain",
      arguments: {
        domainname: "Example.com",
        ttl: 300,
        primarynameserver: "ns1.example.com",
        responsibleperson: "hostmaster.example.com.",
      },
    });

    expect(calls.at(-1)).toEqual({
      domainname: "example.com",
      ttl: 300,
      primarynameserver: "ns1.example.com.",
      responsibleperson: "hostmaster.example.com.",
    });

    await client.callTool({
      name: "dns_set_autorenew",
      arguments: { domainname: "example.com", autorenew: false },
    });

    expect(calls.at(-1)).toEqual({ domainname: "example.com", autorenew: "no" });
  });

  it("maps forcedeleteemail to yes/no on dns_delete_domain", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "dns_delete_domain",
      arguments: { domainname: "example.com", forcedeleteemail: true },
    });

    expect(calls.at(-1)).toEqual({ domainname: "example.com", forcedeleteemail: "yes" });

    await client.callTool({
      name: "dns_delete_domain",
      arguments: { domainname: "example.com", forcedeleteemail: false },
    });

    expect(calls.at(-1)).toEqual({ domainname: "example.com", forcedeleteemail: "no" });

    await client.callTool({
      name: "dns_delete_domain",
      arguments: { domainname: "example.com" },
    });

    expect(calls.at(-1)).toEqual({ domainname: "example.com", forcedeleteemail: undefined });
  });
});
