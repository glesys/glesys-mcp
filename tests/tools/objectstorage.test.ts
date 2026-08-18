import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient } from "../testing.js";

describe("objectstorage tools", () => {
  it("maps createinitialbucket to yes/no on create", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "objectstorage_create_instance",
      arguments: { datacenter: "dc-sto1", createinitialbucket: true },
    });

    expect(calls.at(-1)).toEqual({ datacenter: "dc-sto1", createinitialbucket: "yes" });

    await client.callTool({
      name: "objectstorage_create_instance",
      arguments: { datacenter: "dc-fbg1", createinitialbucket: false },
    });

    expect(calls.at(-1)).toEqual({ datacenter: "dc-fbg1", createinitialbucket: "no" });

    await client.callTool({
      name: "objectstorage_create_instance",
      arguments: { datacenter: "dc-fbg1" },
    });

    expect(calls.at(-1)).toEqual({ datacenter: "dc-fbg1", createinitialbucket: undefined });
  });
});
