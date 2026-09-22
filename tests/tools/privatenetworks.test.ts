import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient, listAllTools } from "../testing.js";

describe("private network tools", () => {
  it("only requires id on privatenetwork_edit_segment", async () => {
    const tools = await listAllTools();
    const edit = tools.find((t) => t.name === "privatenetwork_edit_segment");

    expect(edit?.inputSchema.required).toEqual(["id"]);
  });

  it("maps routable to yes/no on privatenetwork_edit_segment", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "privatenetwork_edit_segment",
      arguments: { id: "seg-1", routable: true },
    });

    expect(calls.at(-1)).toEqual({ id: "seg-1", routable: "yes" });
  });

  it("leaves routable unset when it is not given", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "privatenetwork_edit_segment",
      arguments: { id: "seg-1", name: "fbg-kvm" },
    });

    expect(calls.at(-1)).toEqual({ id: "seg-1", name: "fbg-kvm" });
  });
});
