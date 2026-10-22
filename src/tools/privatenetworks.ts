import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DESTRUCTIVE, type Glesys, READ, run, UPDATE, WRITE, yesno } from "../client.js";

export function registerPrivateNetworkTools(server: McpServer, glesys: Glesys): void {
  server.registerTool(
    "privatenetwork_list",
    {
      description: "List private networks on the project.",
      annotations: READ,
    },
    () => run(glesys.privateNetwork.list()),
  );

  server.registerTool(
    "privatenetwork_details",
    {
      description: "Get details about a private network.",
      inputSchema: { privatenetworkid: z.string().describe("Private network ID") },
      annotations: READ,
    },
    (args) => run(glesys.privateNetwork.details(args)),
  );

  server.registerTool(
    "privatenetwork_create",
    {
      description:
        "Create a private network. A private network spans datacenters; servers connect to it through segments (see privatenetwork_create_segment).",
      inputSchema: { name: z.string().min(1).max(128).describe("Name of the private network") },
      annotations: WRITE,
    },
    (args) => run(glesys.privateNetwork.create(args)),
  );

  server.registerTool(
    "privatenetwork_edit",
    {
      description: "Rename a private network.",
      inputSchema: {
        privatenetworkid: z.string().describe("Private network ID"),
        name: z.string().min(1).max(128).optional().describe("New name"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.privateNetwork.edit(args)),
  );

  server.registerTool(
    "privatenetwork_delete",
    {
      description:
        "Delete a private network. The API returns an error if it still has segments in use.",
      inputSchema: { privatenetworkid: z.string().describe("Private network ID") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.privateNetwork.delete(args)),
  );

  server.registerTool(
    "privatenetwork_list_segments",
    {
      description: "List the segments of a private network.",
      inputSchema: { privatenetworkid: z.string().describe("Private network ID") },
      annotations: READ,
    },
    (args) => run(glesys.privateNetwork.listSegments(args)),
  );

  server.registerTool(
    "privatenetwork_create_segment",
    {
      description:
        "Create a segment in a private network. A segment lives in one datacenter on one platform; servers in that datacenter attach to it with networkadapter_create, passing the segment ID as networkid.",
      inputSchema: {
        privatenetworkid: z.string().describe("Private network ID, e.g. pn-123ab"),
        name: z.string().min(1).max(32).describe("Name of the segment"),
        ipv4subnet: z.string().describe("IPv4 subnet in CIDR notation, e.g. 10.0.0.0/24"),
        platform: z.enum(["kvm", "vmware"]).describe("Platform (lowercase)"),
        datacenter: z
          .enum(["dc-fbg1", "dc-sto1", "dc-oul1"])
          .describe("Datacenter: Falkenberg, Stockholm or Oulu"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.privateNetwork.createSegment(args)),
  );

  server.registerTool(
    "privatenetwork_edit_segment",
    {
      description:
        "Rename a private network segment or change whether it is routable. Routable segments are billed per segment; call privatenetwork_estimated_cost first to see the price.",
      inputSchema: {
        id: z.string().describe("Segment ID from privatenetwork_list_segments"),
        name: z.string().min(1).max(32).optional().describe("New name"),
        routable: z
          .boolean()
          .optional()
          .describe("Whether the segment is routable; current state is in privatenetwork_list_segments"),
      },
      annotations: UPDATE,
    },
    ({ id, name, routable }) =>
      run(glesys.privateNetwork.editSegment({ id, name, routable: yesno(routable) })),
  );

  server.registerTool(
    "privatenetwork_delete_segment",
    {
      description:
        "Delete a private network segment. The API returns an error if servers are still attached.",
      inputSchema: { id: z.string().describe("Segment ID from privatenetwork_list_segments") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.privateNetwork.deleteSegment(args)),
  );

  server.registerTool(
    "privatenetwork_estimated_cost",
    {
      description:
        "Estimate the cost for an existing private network (pass privatenetworkid) or a new one (omit it), optionally with a different routable segment count. Returns current, estimated and diff.",
      inputSchema: {
        privatenetworkid: z.string().optional().describe("Private network ID, e.g. pn-123ab"),
        routablesegments: z
          .number()
          .int()
          .min(0)
          .max(100)
          .optional()
          .describe("Number of routable segments to price"),
      },
      annotations: READ,
    },
    (args) => run(glesys.privateNetwork.estimatedCost(args)),
  );
}
