import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient } from "../testing.js";

describe("vpn tools", () => {
  it("prefixes the username with the project key when missing", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "vpn_create_user",
      arguments: { username: "alice", password: "Sup3r#secret" },
    });

    expect(calls.at(-1)).toEqual({ username: "cl12345_alice", password: "Sup3r#secret" });

    await client.callTool({
      name: "vpn_delete_user",
      arguments: { username: "cl12345_alice" },
    });

    expect(calls.at(-1)).toEqual({ username: "cl12345_alice" });

    await client.callTool({
      name: "vpn_edit_user",
      arguments: { username: "alice", enabled: false },
    });

    expect(calls.at(-1)).toEqual({ username: "cl12345_alice", enabled: false });
  });
});
