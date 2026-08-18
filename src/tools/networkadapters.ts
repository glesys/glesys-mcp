import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE } from "../client.js";

export function registerNetworkAdapterTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "server_networkadapters",
    {
      description:
        "List the network adapters of a server, including which network or private network segment each is connected to.",
      inputSchema: { serverid: z.string().describe("Server ID, e.g. kvm123456") },
      annotations: READ,
    },
    (args) => run(glesys.server.networkAdapters(args)),
  );

  server.registerTool(
    "networkadapter_create",
    {
      description:
        "Add a network adapter to a server. This is how a server connects to a private network: pass the segment ID from privatenetwork_list_segments as networkid. On KVM, networkid is required. On VMware it is optional and defaults to the public network.",
      inputSchema: {
        serverid: z.string().describe("Server ID"),
        networkid: z
          .string()
          .optional()
          .describe(
            "Private network segment ID (from privatenetwork_list_segments) or VLAN network ID. Required on KVM",
          ),
        bandwidth: z.number().optional().describe("Bandwidth in Mbps"),
        name: z.string().max(64).optional().describe("Adapter name (KVM only)"),
        adaptertype: z
          .enum(["VMXNET 3", "E1000", "E1000e", "PCNet32"])
          .optional()
          .describe("Adapter type (VMware only, default VMXNET 3)"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.networkAdapter.create(args)),
  );

  server.registerTool(
    "networkadapter_details",
    {
      description: "Get details about a network adapter.",
      inputSchema: {
        networkadapterid: z.string().describe("Network adapter ID from server_networkadapters"),
      },
      annotations: READ,
    },
    (args) => run(glesys.networkAdapter.details(args)),
  );

  server.registerTool(
    "networkadapter_edit",
    {
      description:
        "Change a network adapter. On KVM only the name can be changed; bandwidth and networkid are silently ignored, so delete and recreate the adapter to move it or change its bandwidth. On VMware, bandwidth and networkid can be changed; valid bandwidth values depend on the connected network.",
      inputSchema: {
        networkadapterid: z.string().describe("Network adapter ID from server_networkadapters"),
        bandwidth: z.number().int().optional().describe("Bandwidth in Mbps (VMware only)"),
        networkid: z
          .string()
          .optional()
          .describe("Network or private network segment ID to move to (VMware only)"),
        name: z.string().max(64).optional().describe("Adapter name (KVM only)"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.networkAdapter.edit(args)),
  );

  server.registerTool(
    "networkadapter_delete",
    {
      description: "Delete a network adapter. The server loses connectivity through it.",
      inputSchema: {
        networkadapterid: z.string().describe("Network adapter ID from server_networkadapters"),
      },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.networkAdapter.delete(args)),
  );
}
