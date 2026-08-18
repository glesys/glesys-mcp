import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient } from "../testing.js";

describe("ip tools", () => {
  it("maps release to yes/no on ip_remove_from_server", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "ip_remove_from_server",
      arguments: { ipaddress: "192.0.2.1", release: true },
    });

    expect(calls.at(-1)).toEqual({ ipaddress: "192.0.2.1", release: "yes" });

    await client.callTool({
      name: "ip_remove_from_server",
      arguments: { ipaddress: "192.0.2.1", release: false },
    });

    expect(calls.at(-1)).toEqual({ ipaddress: "192.0.2.1", release: "no" });

    await client.callTool({
      name: "ip_remove_from_server",
      arguments: { ipaddress: "192.0.2.1" },
    });

    expect(calls.at(-1)).toEqual({ ipaddress: "192.0.2.1", release: undefined });
  });

  it("appends a trailing dot to the PTR data when missing", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "ip_set_ptr",
      arguments: { ipaddress: "192.0.2.1", data: "mail.example.com" },
    });

    expect(calls.at(-1)).toEqual({ ipaddress: "192.0.2.1", data: "mail.example.com." });

    await client.callTool({
      name: "ip_set_ptr",
      arguments: { ipaddress: "192.0.2.1", data: "mail.example.com." },
    });

    expect(calls.at(-1)).toEqual({ ipaddress: "192.0.2.1", data: "mail.example.com." });
  });
});
