import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

import { version } from "./version.js";

const TIMEOUT_MS = 60_000;

type Args = Record<string, unknown>;

interface Envelope {
  response: {
    status: { code: number; text: string; timestamp: string };
    [payload: string]: unknown;
  };
}

export type Glesys = Record<string, Record<string, (args?: Args) => Promise<unknown>>>;

export function createClient(): { glesys: Glesys; project: string } {
  const project = process.env.GLESYS_PROJECT_KEY;
  const apiKey = process.env.GLESYS_API_KEY;

  if (!project || !apiKey) {
    console.error(
      "Missing credentials. Set GLESYS_PROJECT_KEY (e.g. cl12345) and GLESYS_API_KEY.\n"
      + "Create an API key in the Glesys Control Panel and allow the functions "
      + "and source IP addresses you intend to use.",
    );

    process.exit(1);
  }

  const headers = {
    "Accept": "application/json",
    "Authorization": `Basic ${Buffer.from(`${project}:${apiKey}`).toString("base64")}`,
    "Content-Type": "application/json",
    "User-Agent": `glesys-mcp/${version}`,
  };

  const post = (path: string, args: Args) =>
    request(new URL(path, "https://api.glesys.com"), {
      method: "POST",
      headers,
      body: JSON.stringify(args),
    });

  return { glesys: glesysProxy(post), project };
}

// glesys.<module>.<method>(args) calls POST /<module>/<method>, lowercased.
export function glesysProxy(post: (path: string, args: Args) => Promise<unknown>): Glesys {
  const proxy = <T>(value: (name: string) => T) => new Proxy({} as Record<string, T>, {
    get: (target, key) => isEndpointName(key) ? value(key) : Reflect.get(target, key),
  });

  return proxy((module) => proxy((method) => (args: Args = {}) =>
    post(`/${module}/${method}`.toLowerCase(), args)));
}

function isEndpointName(key: string | symbol): key is string {
  return typeof key === "string" && key !== "then" && key !== "toJSON" && !(key in Object.prototype);
}

export async function request(url: URL | string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  let text: string;

  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    text = await response.text();
  } catch (error) {
    throw networkError(error);
  }

  const json = parseJson(text) as Partial<Envelope> | undefined;

  if (json?.response?.status) {
    const { status, debug, ...payload } = json.response;

    if (status.code >= 400) {
      throw apiError(status);
    }

    return payload;
  }

  if (!response.ok || json === undefined) {
    throw responseError(url, response, text);
  }

  return json;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function apiError(status: { code: number; text: string }): Error {
  return new Error(`Glesys API error ${status.code}: ${status.text}`);
}

function networkError(error: unknown): Error {
  if (error instanceof Error && error.name === "TimeoutError") {
    return new Error(
      `Request failed: no response within ${TIMEOUT_MS / 1000} s. `
      + "The request may still have completed; check before retrying.",
    );
  }

  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;

  return new Error(`Request failed: ${cause instanceof Error ? cause.message : String(cause)}`);
}

function responseError(url: URL | string, response: Response, text: string): Error {
  const status = `${response.status} ${response.statusText}`.trim();
  const detail = text.trim().slice(0, 200);

  return new Error(
    `Request failed: Unexpected response from ${url}: ${status}${detail ? `: ${detail}` : ""}`,
  );
}

export function run(call: Promise<unknown>): Promise<CallToolResult> {
  return call.then(
    (payload) => ({ content: [{ type: "text", text: JSON.stringify(payload) }] }),
    (error) => ({
      content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
      isError: true,
    }),
  );
}

export function yesno(value: boolean | undefined): "yes" | "no" | undefined {
  return value === undefined ? undefined : value ? "yes" : "no";
}

export const READ: ToolAnnotations = { readOnlyHint: true, idempotentHint: true };
export const WRITE: ToolAnnotations = { destructiveHint: false, idempotentHint: false };
export const UPDATE: ToolAnnotations = { destructiveHint: false, idempotentHint: true };
export const DESTRUCTIVE: ToolAnnotations = { destructiveHint: true, idempotentHint: true };
