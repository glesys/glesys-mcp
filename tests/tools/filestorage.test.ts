import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient } from "../testing.js";

describe("filestorage tools", () => {
  it("maps autopromotion to yes/no on create", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "filestorage_create_volume",
      arguments: { datacenter: "Falkenberg", planid: "plan-1", autopromotion: false },
    });

    expect(calls.at(-1)).toEqual({
      datacenter: "Falkenberg",
      planid: "plan-1",
      autopromotion: "no",
    });

    await client.callTool({
      name: "filestorage_create_volume",
      arguments: { datacenter: "Stockholm", planid: "plan-1", autopromotion: true },
    });

    expect(calls.at(-1)).toEqual({
      datacenter: "Stockholm",
      planid: "plan-1",
      autopromotion: "yes",
    });

    await client.callTool({
      name: "filestorage_create_volume",
      arguments: { datacenter: "Falkenberg", planid: "plan-1" },
    });

    expect(calls.at(-1)).toEqual({
      datacenter: "Falkenberg",
      planid: "plan-1",
      autopromotion: undefined,
    });
  });

  it("joins the accesslist and maps autopromotion on edit", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "filestorage_edit_volume",
      arguments: {
        volumeid: "vol-1",
        accesslist: ["kvm123456", "kvm654321"],
        autopromotion: true,
      },
    });

    expect(calls.at(-1)).toEqual({
      volumeid: "vol-1",
      accesslist: "kvm123456,kvm654321",
      autopromotion: "yes",
    });

    await client.callTool({
      name: "filestorage_edit_volume",
      arguments: { volumeid: "vol-1", name: "renamed", autopromotion: false },
    });

    expect(calls.at(-1)).toEqual({
      volumeid: "vol-1",
      name: "renamed",
      accesslist: undefined,
      autopromotion: "no",
    });
  });
});
