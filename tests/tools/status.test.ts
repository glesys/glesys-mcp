import got from "got";
import { describe, expect, it, vi } from "vitest";
import { capturingGlesys, connectedClient } from "../testing.js";

vi.mock("got", () => ({
  default: vi.fn().mockResolvedValue({ body: { page: { state: "operational" } } }),
}));

describe("status tools", () => {
  it("returns the status page payload", async () => {
    const { glesys } = capturingGlesys();
    const client = await connectedClient(glesys);

    const result = (await client.callTool({ name: "glesys_status", arguments: {} })) as {
      isError?: boolean;
      content: { text: string }[];
    };

    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual({ page: { state: "operational" } });

    vi.mocked(got).mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND"));

    const failed = (await client.callTool({ name: "glesys_status", arguments: {} })) as {
      isError?: boolean;
      content: { text: string }[];
    };

    expect(failed.isError).toBe(true);
    expect(failed.content[0].text).toBe("Request failed: getaddrinfo ENOTFOUND");

    vi.mocked(got).mockRejectedValueOnce("boom");

    const nonError = (await client.callTool({ name: "glesys_status", arguments: {} })) as {
      content: { text: string }[];
    };

    expect(nonError.content[0].text).toBe("Request failed: boom");
  });
});
