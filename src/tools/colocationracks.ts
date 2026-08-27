import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { READ, run } from "../client.js";

export function registerColocationRackTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "colocationrack_list",
    {
      description: "List colocation racks on the project with their services.",
      annotations: READ,
    },
    () => run(glesys.colocationRack.list()),
  );
}
