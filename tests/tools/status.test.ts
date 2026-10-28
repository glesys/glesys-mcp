import { describe, expect, it, vi } from "vitest";
import { capturingGlesys, connectedClient } from "../testing.js";

const fetchMock = vi.fn(async () => Response.json({ page: { state: "operational" } }));

vi.stubGlobal("fetch", fetchMock);

describe("status tools", () => {
  it("returns the status page payload", async () => {
    const { glesys } = capturingGlesys();
    const client = await connectedClient(glesys);
    const call = () =>
      client.callTool({ name: "glesys_status", arguments: {} }) as Promise<{
        isError?: boolean;
        content: { text: string }[];
      }>;

    const result = await call();

    expect(fetchMock).toHaveBeenCalledWith("https://www.glesys-status.com/api/v1/status", {
      signal: expect.any(AbortSignal),
    });

    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual({ page: { state: "operational" } });

    fetchMock.mockResolvedValueOnce(new Response("down", { status: 503, statusText: "Service Unavailable" }));

    const unavailable = await call();

    expect(unavailable.isError).toBe(true);
    expect(unavailable.content[0].text).toBe("Request failed: Unexpected response from https://www.glesys-status.com/api/v1/status: 503 Service Unavailable: down");

    fetchMock.mockResolvedValueOnce(new Response("<html>maintenance</html>", { status: 200, statusText: "OK" }));

    expect((await call()).content[0].text).toBe("Request failed: Unexpected response from https://www.glesys-status.com/api/v1/status: 200 OK: <html>maintenance</html>");

    fetchMock.mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND"));

    expect((await call()).content[0].text).toBe("Request failed: getaddrinfo ENOTFOUND");
  });
});
