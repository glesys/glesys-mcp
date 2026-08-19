import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import got from "got";
import { READ } from "../client.js";

export function registerStatusTools(server: McpServer): void {
  server.registerTool(
    "glesys_status",
    {
      description:
        "Get the current operational status of the Glesys platform from the public status page. Check this when API calls fail unexpectedly or a service seems down.",
      annotations: READ,
    },
    async () => {
      try {
        const { body } = await got("https://www.glesys-status.com/api/v1/status", {
          responseType: "json",
        });

        return { content: [{ type: "text" as const, text: JSON.stringify(body) }] };
      } catch (error) {
        const text = `Request failed: ${error instanceof Error ? error.message : String(error)}`;

        return { content: [{ type: "text" as const, text }], isError: true };
      }
    },
  );
}
