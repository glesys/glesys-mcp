import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { READ, request, run } from "../client.js";

export function registerStatusTools(server: McpServer): void {
  server.registerTool(
    "glesys_status",
    {
      description:
        "Get the current operational status of the Glesys platform from the public status page. Check this when API calls fail unexpectedly or a service seems down.",
      annotations: READ,
    },
    () => run(request("https://www.glesys-status.com/api/v1/status")),
  );
}
