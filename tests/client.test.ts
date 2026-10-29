import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient, glesysProxy, run } from "../src/client.js";

const ok = {
  response: {
    status: { code: 200, text: "OK", timestamp: "now" },
    debug: { input: [] },
    disk: { id: "d1" },
  },
};
const fetchMock = vi.fn(async () => Response.json(ok));

vi.stubGlobal("fetch", fetchMock);

describe("createClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    fetchMock.mockClear();
  });

  it.each([
    ["cl12345", ""],
    ["", "secret"],
    ["cl12345", "${GLESYS_API_KEY}"],
    ["${GLESYS_PROJECT_KEY}", "secret"],
  ])("exits with guidance when credentials are missing (project %j, key %j)", (project, key) => {
    vi.stubEnv("GLESYS_PROJECT_KEY", project);
    vi.stubEnv("GLESYS_API_KEY", key);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    expect(() => createClient()).toThrow("exit");
    expect(exit).toHaveBeenCalledWith(1);
    expect(error.mock.calls[0][0]).toContain("GLESYS_PROJECT_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts JSON to the lowercased API path with basic auth, a user agent and a timeout", async () => {
    vi.stubEnv("GLESYS_PROJECT_KEY", "cl12345");
    vi.stubEnv("GLESYS_API_KEY", "secret");

    const timeout = vi.spyOn(AbortSignal, "timeout");
    const { glesys, project } = createClient();

    expect(project).toBe("cl12345");
    expect(await glesys.serverDisk.updateName({ diskid: "d1", name: "data" })).toEqual({ disk: { id: "d1" } });
    await glesys.server.list();

    const [[url, init], [, emptyInit]] = fetchMock.mock.calls as unknown as [URL, RequestInit][];
    const headers = init.headers as Record<string, string>;

    expect(url.href).toBe("https://api.glesys.com/serverdisk/updatename");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ diskid: "d1", name: "data" }));
    expect(emptyInit.body).toBe("{}");
    expect(timeout).toHaveBeenCalledWith(60_000);
    expect(init.signal).toBe(timeout.mock.results[0].value);
    expect(headers.Accept).toBe("application/json");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["User-Agent"]).toMatch(/^glesys-mcp\/\d+\.\d+\.\d+$/);
    expect(headers.Authorization).toBe(`Basic ${Buffer.from("cl12345:secret").toString("base64")}`);
  });

  it("rejects API errors and responses without an envelope with a readable message", async () => {
    vi.stubEnv("GLESYS_PROJECT_KEY", "cl12345");
    vi.stubEnv("GLESYS_API_KEY", "secret");

    const { glesys } = createClient();
    const denied = { response: { status: { code: 403, text: "Not allowed", timestamp: "now" } } };

    fetchMock.mockResolvedValueOnce(Response.json(denied, { status: 403 }));
    await expect(glesys.server.list()).rejects.toThrow(new Error("Glesys API error 403: Not allowed"));

    const broken = { response: { status: { code: 500, text: "Internal error", timestamp: "now" } } };

    fetchMock.mockResolvedValueOnce(Response.json(broken, { status: 500 }));
    await expect(glesys.server.list()).rejects.toThrow(new Error("Glesys API error 500: Internal error"));

    fetchMock.mockResolvedValueOnce(
      new Response("This service is currently in maintenance.", {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );

    await expect(glesys.server.list()).rejects.toThrow(new Error(
      "Request failed: Unexpected response from https://api.glesys.com/server/list: 503 Service Unavailable: "
      + "This service is currently in maintenance.",
    ));

    fetchMock.mockResolvedValueOnce(new Response(`<html>${"x".repeat(500)}</html>`, { status: 502 }));
    await expect(glesys.server.list()).rejects.toThrow(new Error(
      `Request failed: Unexpected response from https://api.glesys.com/server/list: 502: <html>${"x".repeat(194)}`,
    ));

    fetchMock.mockResolvedValueOnce(
      Response.json({ message: "rate limited" }, { status: 429, statusText: "Too Many Requests" }),
    );

    await expect(glesys.server.list()).rejects.toThrow(new Error(
      "Request failed: Unexpected response from https://api.glesys.com/server/list: 429 Too Many Requests: "
      + "{\"message\":\"rate limited\"}",
    ));

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 504, statusText: "Gateway Timeout" }));
    await expect(glesys.server.list()).rejects.toThrow(new Error(
      "Request failed: Unexpected response from https://api.glesys.com/server/list: 504 Gateway Timeout",
    ));
  });

  it("reports timeouts and network failures, preferring the cause fetch wraps them in", async () => {
    vi.stubEnv("GLESYS_PROJECT_KEY", "cl12345");
    vi.stubEnv("GLESYS_API_KEY", "secret");

    const { glesys } = createClient();

    fetchMock.mockRejectedValueOnce(new DOMException("aborted", "TimeoutError"));
    await expect(glesys.server.list()).rejects.toThrow(
      new Error(
        "Request failed: no response within 60 s. The request may still have completed; check before retrying.",
      ),
    );

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed", { cause: new Error("connect ECONNREFUSED") }));
    await expect(glesys.server.list()).rejects.toThrow(new Error("Request failed: connect ECONNREFUSED"));

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(glesys.server.list()).rejects.toThrow(new Error("Request failed: fetch failed"));

    fetchMock.mockRejectedValueOnce("boom");
    await expect(glesys.server.list()).rejects.toThrow(new Error("Request failed: boom"));
  });
});

describe("glesysProxy", () => {
  it("does not turn probes for then, toJSON or symbols into API calls", async () => {
    const call = vi.fn();
    const glesys = glesysProxy(call);

    expect(await glesys.server.list).toBeTypeOf("function");
    expect(JSON.stringify({ glesys: glesys.server })).toBe("{\"glesys\":{}}");
    expect(String(glesys.server)).toBe("[object Object]");
    expect((glesys as unknown as { then: unknown }).then).toBeUndefined();
    expect(call).not.toHaveBeenCalled();
  });
});

describe("run", () => {
  it("returns the payload as JSON text", async () => {
    const result = await run(Promise.resolve({ servers: [{ serverid: "kvm123456" }] }));

    expect(result.isError).toBeUndefined();
    expect(JSON.parse((result.content[0] as { text: string }).text)).toEqual({
      servers: [{ serverid: "kvm123456" }],
    });
  });

  it("returns the error message as an error result", async () => {
    const failed = await run(Promise.reject(new Error("Glesys API error 404: Not Found")));
    const thrownString = await run(Promise.reject("boom"));

    expect(failed.isError).toBe(true);
    expect((failed.content[0] as { text: string }).text).toBe("Glesys API error 404: Not Found");
    expect((thrownString.content[0] as { text: string }).text).toBe("boom");
  });
});
