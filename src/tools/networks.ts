import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE } from "../client.js";

export function registerNetworkTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "network_list",
    {
      description:
        "List networks available to the project, both public internet networks and the project's own. For the private network product that spans datacenters, see privatenetwork_list.",
      annotations: READ,
    },
    () => run(glesys.network.list()),
  );

  server.registerTool(
    "network_details",
    {
      description: "Get details about a network.",
      inputSchema: { networkid: z.string().describe("Network ID from network_list") },
      annotations: READ,
    },
    (args) => run(glesys.network.details(args)),
  );

  server.registerTool(
    "network_create",
    {
      description:
        "Create a network in one datacenter. Servers connect to it with networkadapter_create. For a private network spanning datacenters, use privatenetwork_create instead.",
      inputSchema: {
        datacenter: z.string().describe("Datacenter, e.g. Falkenberg or Stockholm"),
        description: z.string().describe("Description of the network"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.network.create(args)),
  );

  server.registerTool(
    "network_edit",
    {
      description: "Change the description of a network.",
      inputSchema: {
        networkid: z.string().describe("Network ID from network_list"),
        description: z.string().optional().describe("The new description"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.network.edit(args)),
  );

  server.registerTool(
    "network_delete",
    {
      description: "Delete a network. Detach all network adapters from it first.",
      inputSchema: { networkid: z.string().describe("Network ID from network_list") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.network.delete(args)),
  );
}
