import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type Glesys, READ, run } from "../client.js";

export function registerColocationRackTools(server: McpServer, glesys: Glesys): void {
  server.registerTool(
    "colocationrack_list",
    {
      description: "List colocation racks on the project with their services.",
      annotations: READ,
    },
    () => run(glesys.colocationRack.list()),
  );
}
