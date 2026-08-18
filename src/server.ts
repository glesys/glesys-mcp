import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { registerDatabaseTools } from "./tools/databases.js";
import { registerDnsTools } from "./tools/dns.js";
import { registerObjectStorageTools } from "./tools/objectstorage.js";
import { registerPrivateNetworkTools } from "./tools/privatenetworks.js";
import { registerServerTools, registerSshKeyTools } from "./tools/servers.js";

export function buildServer(glesys: GleSYSAPI): McpServer {
  const server = new McpServer({ name: "glesys", version: "0.1.0" });

  registerServerTools(server, glesys);
  registerSshKeyTools(server, glesys);
  registerPrivateNetworkTools(server, glesys);
  registerDnsTools(server, glesys);
  registerObjectStorageTools(server, glesys);
  registerDatabaseTools(server, glesys);

  return server;
}
