import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE, yesno } from "../client.js";

const ipversionSchema = z.union([z.literal(4), z.literal(6)]).describe("IP version, 4 or 6");

export function registerIpTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "ip_list_own",
    {
      description:
        "List IP addresses reserved on the project, with which server (if any) each is assigned to.",
      inputSchema: {
        used: z.boolean().optional().describe("Only used (true) or only unused (false) addresses"),
        ipversion: ipversionSchema.optional(),
        datacenter: z.string().optional(),
        platform: z.string().optional(),
      },
      annotations: READ,
    },
    (args) => run(glesys.ip.listOwn(args)),
  );

  server.registerTool(
    "ip_list_free",
    {
      description: "List free IP addresses available to reserve in a datacenter.",
      inputSchema: {
        ipversion: ipversionSchema,
        datacenter: z.string().describe("Datacenter, e.g. Falkenberg"),
        platform: z.string().describe("Platform, e.g. KVM"),
      },
      annotations: READ,
    },
    (args) => run(glesys.ip.listFree(args)),
  );

  server.registerTool(
    "ip_details",
    {
      description:
        "Get details about an IP address: datacenter, platform, PTR record, cost and assignment.",
      inputSchema: { ipaddress: z.string().describe("The IP address") },
      annotations: READ,
    },
    (args) => run(glesys.ip.details(args)),
  );

  server.registerTool(
    "ip_take",
    {
      description:
        "Reserve a free IP address on the project. Billing starts immediately. Pick an address from ip_list_free.",
      inputSchema: { ipaddress: z.string().describe("A free IP address from ip_list_free") },
      annotations: WRITE,
    },
    (args) => run(glesys.ip.take(args)),
  );

  server.registerTool(
    "ip_release",
    {
      description:
        "Release a reserved IP address back to the pool. The address must not be assigned to a server, and there is no guarantee of getting the same address back later.",
      inputSchema: { ipaddress: z.string().describe("The IP address to release") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.ip.release(args)),
  );

  server.registerTool(
    "ip_add_to_server",
    {
      description:
        "Assign a reserved IP address to a server. The address, server and platform must be in the same datacenter.",
      inputSchema: {
        ipaddress: z.string().describe("A reserved IP address from ip_list_own"),
        serverid: z.string().describe("Server ID, e.g. kvm123456"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.ip.add(args)),
  );

  server.registerTool(
    "ip_remove_from_server",
    {
      description:
        "Remove an IP address from its server. The address stays reserved on the project unless release is set, in which case it goes back to the pool.",
      inputSchema: {
        ipaddress: z.string().describe("The IP address"),
        release: z.boolean().optional().describe("Also release the address back to the pool"),
      },
      annotations: DESTRUCTIVE,
    },
    ({ ipaddress, release }) =>
      run(
        glesys.ip.remove({
          ipaddress,
          release: yesno(release),
        }),
      ),
  );

  server.registerTool(
    "ip_set_ptr",
    {
      description:
        "Set the PTR (reverse DNS) record for an IP address. Needed for mail servers among other things.",
      inputSchema: {
        ipaddress: z.string().describe("The IP address"),
        data: z.string().describe("PTR hostname, e.g. mail.example.com (trailing dot optional)"),
      },
      annotations: UPDATE,
    },
    ({ ipaddress, data }) =>
      run(glesys.ip.setPTR({ ipaddress, data: data.endsWith(".") ? data : `${data}.` })),
  );

  server.registerTool(
    "ip_reset_ptr",
    {
      description: "Reset the PTR (reverse DNS) record for an IP address to the Glesys default.",
      inputSchema: { ipaddress: z.string().describe("The IP address") },
      annotations: UPDATE,
    },
    (args) => run(glesys.ip.resetPTR(args)),
  );

  server.registerTool(
    "ip_estimated_cost",
    {
      description: "Get the cost per reserved IP address on the project.",
      annotations: READ,
    },
    () => run(glesys.ip.estimatedCost()),
  );
}
