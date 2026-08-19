import got from "got";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient, run } from "../src/client.js";

vi.mock("got", () => ({
  default: vi.fn().mockResolvedValue({
    body: { response: { status: { code: 200, text: "OK", timestamp: "now" } } },
  }),
}));

describe("createClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("exits with guidance when credentials are missing", () => {
    vi.stubEnv("GLESYS_PROJECT_KEY", "");
    vi.stubEnv("GLESYS_API_KEY", "");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    expect(() => createClient()).toThrow("exit");
    expect(exit).toHaveBeenCalledWith(1);
    expect(error.mock.calls[0][0]).toContain("GLESYS_PROJECT_KEY");
  });

  it("returns a client and the project key when credentials are set", () => {
    vi.stubEnv("GLESYS_PROJECT_KEY", "cl12345");
    vi.stubEnv("GLESYS_API_KEY", "secret");

    const { glesys, project } = createClient();

    expect(project).toBe("cl12345");
    expect(glesys.server).toBeDefined();
  });

  it("sends a glesys-mcp user agent with basic auth", async () => {
    vi.stubEnv("GLESYS_PROJECT_KEY", "cl12345");
    vi.stubEnv("GLESYS_API_KEY", "secret");

    const { glesys } = createClient();
    await glesys.request.request("/server/list", { method: "POST" });

    const [url, options] = vi.mocked(got).mock.calls.at(-1) as [
      URL,
      { headers: Record<string, string>; method: string },
    ];

    expect(url.href).toBe("https://api.glesys.com/server/list");
    expect(options.headers["User-Agent"]).toBe(
      "glesys-mcp (+https://github.com/glesys/glesys-mcp)",
    );

    expect(options.headers.Authorization).toBe(
      `Basic ${Buffer.from("cl12345:secret").toString("base64")}`,
    );

    expect(options.method).toBe("POST");
  });
});

describe("run", () => {
  it("unwraps the response envelope and drops status/debug", async () => {
    const result = await run(
      Promise.resolve({
        body: {
          response: {
            status: { code: 200, text: "OK", timestamp: "now" },
            debug: { input: [] },
            servers: [{ serverid: "kvm123456" }],
          },
        },
      }),
    );

    expect(result.isError).toBeUndefined();
    expect(JSON.parse((result.content[0] as { text: string }).text)).toEqual({
      servers: [{ serverid: "kvm123456" }],
    });
  });

  it("formats Glesys API errors with code and text", async () => {
    const error = Object.assign(new Error("Request failed with status code 400"), {
      response: {
        body: {
          response: {
            status: {
              code: 400,
              text: "Invalid disksize. Allowed: 5, 10, 20",
              timestamp: "now",
            },
          },
        },
      },
    });

    const result = await run(Promise.reject(error));

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toBe(
      "Glesys API error 400: Invalid disksize. Allowed: 5, 10, 20",
    );
  });

  it("falls back to the raw body when the error has no envelope", async () => {
    const error = Object.assign(new Error("Response code 503 (Service Unavailable)"), {
      response: { statusCode: 503, body: "This service is currently in maintenance." },
    });

    const result = await run(Promise.reject(error));

    expect((result.content[0] as { text: string }).text).toBe(
      "Glesys API error 503: This service is currently in maintenance.",
    );
  });

  it("falls back to the raw error message for non-API failures", async () => {
    const result = await run(Promise.reject(new Error("connect ECONNREFUSED")));

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toBe(
      "Request failed: connect ECONNREFUSED",
    );

    const nonError = await run(Promise.reject("boom"));

    expect((nonError.content[0] as { text: string }).text).toBe("Request failed: boom");
  });
});
