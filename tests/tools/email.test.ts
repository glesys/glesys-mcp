import { describe, expect, it } from "vitest";
import { capturingGlesys, connectedClient } from "../testing.js";

describe("email tools", () => {
  it("joins alias destinations into a comma-separated string", async () => {
    const { glesys, calls } = capturingGlesys();
    const client = await connectedClient(glesys);

    await client.callTool({
      name: "email_createalias",
      arguments: { emailalias: "sales@example.com", goto: ["a@example.com", "b@example.com"] },
    });

    expect(calls.at(-1)).toEqual({
      emailalias: "sales@example.com",
      goto: "a@example.com,b@example.com",
    });

    await client.callTool({
      name: "email_editalias",
      arguments: { emailalias: "sales@example.com", goto: ["c@example.com"] },
    });

    expect(calls.at(-1)).toEqual({ emailalias: "sales@example.com", goto: "c@example.com" });
  });
});
