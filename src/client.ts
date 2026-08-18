import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { GleSYSAPI, type GlesysResponse } from "glesys-api";

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

  return { glesys: new GleSYSAPI({ apiUser: project, apiKey }), project };
}

export async function run(call: Promise<GlesysResponse>): Promise<CallToolResult> {
  try {
    const { body } = await call;
    const { status, debug, ...payload } = body.response;

    return { content: [{ type: "text", text: JSON.stringify(payload) }] };
  } catch (error) {
    const response = (error as { response?: { body?: unknown; statusCode?: number } } & Error)
      .response;
    const body = response?.body as GlesysResponse["body"] | string | undefined;
    const status = typeof body === "object" ? body?.response?.status : undefined;
    const text = status
      ? `Glesys API error ${status.code}: ${status.text}`
      : typeof body === "string" && body
        ? `Glesys API error ${response?.statusCode}: ${body.slice(0, 500)}`
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
