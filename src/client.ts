import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { GleSYSAPI, type GlesysResponse } from "glesys-api";
import got from "got";

import { version } from "./version.js";

export function createClient(): { glesys: GleSYSAPI; project: string } {
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

  const glesys = new GleSYSAPI({ apiUser: project, apiKey });
  const token = Buffer.from(`${project}:${apiKey}`).toString("base64");

  glesys.request.request = (uri, options) =>
    got(new URL(uri, "https://api.glesys.com"), {
      headers: {
        "Authorization": `Basic ${token}`,
        "User-Agent": `glesys-mcp/${version} (+https://github.com/glesys/glesys-mcp)`,
      },
      responseType: "json",
      ...options,
    }) as unknown as Promise<GlesysResponse>;

  return { glesys, project };
}

export async function run(call: Promise<GlesysResponse>): Promise<CallToolResult> {
  try {
    const { body } = await call;
    const { status, debug, ...payload } = body.response;

    return { content: [{ type: "text", text: JSON.stringify(payload) }] };
  } catch (error) {
    const body = (error as { response?: { body?: GlesysResponse["body"] } }).response?.body;
    const status = body?.response?.status;
    const text = status
      ? `Glesys API error ${status.code}: ${status.text}`
      : `Request failed: ${error instanceof Error ? error.message : String(error)}`;

    return { content: [{ type: "text", text }], isError: true };
  }
}

export function yesno(value: boolean | undefined): "yes" | "no" | undefined {
  return value === undefined ? undefined : value ? "yes" : "no";
}

export const READ: ToolAnnotations = { readOnlyHint: true, idempotentHint: true };
export const WRITE: ToolAnnotations = { destructiveHint: false, idempotentHint: false };
export const UPDATE: ToolAnnotations = { destructiveHint: false, idempotentHint: true };
export const DESTRUCTIVE: ToolAnnotations = { destructiveHint: true, idempotentHint: true };
