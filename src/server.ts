import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Glesys } from "./client.js";
import { registerArchiveTools } from "./tools/archive.js";
import { registerBlockStorageTools } from "./tools/blockstorage.js";
import { registerColocationRackTools } from "./tools/colocationracks.js";
import { registerDatabaseTools } from "./tools/databases.js";
import { registerDnsTools } from "./tools/dns.js";
import { registerEmailTools } from "./tools/email.js";
import { registerFileStorageTools } from "./tools/filestorage.js";
import { registerIpTools } from "./tools/ip.js";
import { registerLoadBalancerTools } from "./tools/loadbalancers.js";
import { registerNetworkAdapterTools } from "./tools/networkadapters.js";
import { registerNetworkTools } from "./tools/networks.js";
import { registerObjectStorageTools } from "./tools/objectstorage.js";
import { registerPrivateNetworkTools } from "./tools/privatenetworks.js";
import { registerRemoteHandsTools } from "./tools/remotehands.js";
import { registerServerDiskTools } from "./tools/serverdisks.js";
import { registerServerTools, registerSshKeyTools } from "./tools/servers.js";
import { registerShipmentTools } from "./tools/shipments.js";
import { registerStatusTools } from "./tools/status.js";
import { registerVpnTools } from "./tools/vpn.js";
import { version } from "./version.js";

export function buildServer(glesys: Glesys, project: string): McpServer {
  const destructive = process.env.GLESYS_ENABLE_DESTRUCTIVE === "true";
  const server = new McpServer(
    { name: "glesys", version },
    {
      instructions:
        "Tools for managing Glesys cloud infrastructure. Each tool maps 1:1 to a Glesys API function (server_create calls POST /server/create); the full API is documented at https://github.com/glesys/api-docs/wiki/API-Documentation and product documentation lives at https://docs.glesys.com (also as https://docs.glesys.com/llms-full.txt). "
        + "Many arguments only accept specific values — fetch them first (server_allowedarguments, server_templates, database_listplans) instead of guessing. "
        + "A 403 on every call means the API key lacks function permissions or the caller's IP is not an allowed host; both are configured in the Glesys Control Panel. "
        + "If the API itself misbehaves, check glesys_status for ongoing incidents and maintenance. "
        + "If the user manages a resource with the Glesys Terraform provider, do not change it with these tools; update the Terraform config instead."
        + (destructive
          ? ""
          : " Destructive tools (delete/destroy/remove/release, and dns_generate_auth_code) are disabled. The user can enable them by setting GLESYS_ENABLE_DESTRUCTIVE=true in the MCP server environment and restarting the server."),
    },
  );

  if (!destructive) {
    const registerTool = server.registerTool.bind(server) as (...args: unknown[]) => unknown;

    server.registerTool = ((
      name: string,
      config: { annotations?: { destructiveHint?: boolean } },
      callback: unknown,
    ) =>
      config.annotations?.destructiveHint === true
        ? undefined
        : registerTool(name, config, callback)) as McpServer["registerTool"];
  }

  registerServerTools(server, glesys);
  registerServerDiskTools(server, glesys);
  registerSshKeyTools(server, glesys);
  registerIpTools(server, glesys);
  registerNetworkAdapterTools(server, glesys);
  registerNetworkTools(server, glesys);
  registerPrivateNetworkTools(server, glesys);
  registerLoadBalancerTools(server, glesys);
  registerDnsTools(server, glesys);
  registerEmailTools(server, glesys);
  registerObjectStorageTools(server, glesys);
  registerFileStorageTools(server, glesys);
  registerBlockStorageTools(server, glesys);
  registerArchiveTools(server, glesys);
  registerDatabaseTools(server, glesys);
  registerVpnTools(server, glesys, project);
  registerColocationRackTools(server, glesys);
  registerRemoteHandsTools(server, glesys);
  registerShipmentTools(server, glesys);
  registerStatusTools(server);

  return server;
}
