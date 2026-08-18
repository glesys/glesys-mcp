import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient } from "../testing.js";

describe("loadbalancer tools", () => {
  it("maps stickysession to yes/no on add and edit backend", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "loadbalancer_add_backend",
      arguments: { loadbalancerid: "lb123456", name: "web", stickysession: true },
    });

    expect(calls.at(-1)).toEqual({ loadbalancerid: "lb123456", name: "web", stickysession: "yes" });

    await client.callTool({
      name: "loadbalancer_add_backend",
      arguments: { loadbalancerid: "lb123456", name: "web", stickysession: false },
    });

    expect(calls.at(-1)).toEqual({ loadbalancerid: "lb123456", name: "web", stickysession: "no" });

    await client.callTool({
      name: "loadbalancer_edit_backend",
      arguments: { loadbalancerid: "lb123456", backendname: "web", stickysession: true },
    });

    expect(calls.at(-1)).toEqual({
      loadbalancerid: "lb123456",
      backendname: "web",
      stickysession: "yes",
    });

    await client.callTool({
      name: "loadbalancer_edit_backend",
      arguments: { loadbalancerid: "lb123456", backendname: "web", stickysession: false },
    });

    expect(calls.at(-1)).toEqual({
      loadbalancerid: "lb123456",
      backendname: "web",
      stickysession: "no",
    });

    await client.callTool({
      name: "loadbalancer_edit_backend",
      arguments: { loadbalancerid: "lb123456", backendname: "web", mode: "http" },
    });

    expect(calls.at(-1)).toEqual({
      loadbalancerid: "lb123456",
      backendname: "web",
      mode: "http",
      stickysession: undefined,
    });
  });
});
