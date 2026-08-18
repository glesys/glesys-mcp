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
