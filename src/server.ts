import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { registerDatabaseTools } from "./tools/databases.js";
import { registerDnsTools } from "./tools/dns.js";
import { registerFileStorageTools } from "./tools/filestorage.js";
import { registerIpTools } from "./tools/ip.js";
import { registerNetworkAdapterTools } from "./tools/networkadapters.js";
import { registerObjectStorageTools } from "./tools/objectstorage.js";
import { registerPrivateNetworkTools } from "./tools/privatenetworks.js";
import { registerServerTools, registerSshKeyTools } from "./tools/servers.js";

export function buildServer(glesys: GleSYSAPI): McpServer {
  const server = new McpServer(
    { name: "glesys", version: "0.1.0" },
    {
      instructions:
        "Tools for managing Glesys cloud infrastructure. Each tool maps 1:1 to a Glesys API function (server_create calls POST /server/create); the full API is documented at https://github.com/glesys/api-docs/wiki/API-Documentation and product documentation lives at https://docs.glesys.com (also as https://docs.glesys.com/llms-full.txt). "
        + "Many arguments only accept specific values — fetch them first (server_allowedarguments, server_templates, database_listplans) instead of guessing. "
        + "A 403 on every call means the API key lacks function permissions or the caller's IP is not an allowed host; both are configured in the Glesys Control Panel.",
    },
  );

  registerServerTools(server, glesys);
  registerSshKeyTools(server, glesys);
  registerIpTools(server, glesys);
  registerNetworkAdapterTools(server, glesys);
  registerPrivateNetworkTools(server, glesys);
  registerDnsTools(server, glesys);
  registerObjectStorageTools(server, glesys);
  registerFileStorageTools(server, glesys);
  registerDatabaseTools(server, glesys);

  return server;
}
