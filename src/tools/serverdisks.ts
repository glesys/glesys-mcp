import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE } from "../client.js";

export function registerServerDiskTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "serverdisk_limits",
    {
      description:
        "Get the disk limits for a VMware server: allowed sizes and how many additional gold/silver disks can be added. Call before serverdisk_create or serverdisk_reconfigure.",
      inputSchema: { serverid: z.string().describe("VMware server ID, e.g. wps123456") },
      annotations: READ,
    },
    (args) => run(glesys.serverDisk.limits(args)),
  );

  server.registerTool(
    "serverdisk_estimatedcost",
    {
      description:
        "Estimate the cost of adding or growing additional disks on a VMware server.",
      inputSchema: {
        serverid: z.string().describe("VMware server ID"),
        additionalgolddiskingibdelta: z
          .number()
          .int()
          .optional()
          .describe("GiB of gold disk to add to the estimate"),
        additionalsilverdiskingibdelta: z
          .number()
          .int()
          .optional()
          .describe("GiB of silver disk to add to the estimate"),
      },
      annotations: READ,
    },
    (args) => run(glesys.serverDisk.estimatedCost(args)),
  );

  server.registerTool(
    "serverdisk_create",
    {
      description:
        "Add an additional disk to a VMware server (not supported on KVM; grow the server's disk with server_edit instead). Check serverdisk_limits first for allowed sizes. Billing starts immediately.",
      inputSchema: {
        serverid: z.string().describe("VMware server ID, e.g. wps123456"),
        name: z.string().describe("Disk name"),
        sizeingib: z.number().int().describe("Disk size in GiB, within serverdisk_limits"),
        type: z.enum(["gold", "silver"]).optional().describe("Storage tier, default gold"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.serverDisk.create(args)),
  );

  server.registerTool(
    "serverdisk_reconfigure",
    {
      description:
        "Grow an additional VMware disk. Disks can only grow, never shrink; the new size must be larger than the current one and within serverdisk_limits. The partition must be resized manually inside the guest afterwards.",
      inputSchema: {
        id: z.string().describe("Disk ID from server_details"),
        sizeingib: z.number().int().describe("New size in GiB, larger than the current size"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.serverDisk.reconfigure(args)),
  );

  server.registerTool(
    "serverdisk_updatename",
    {
      description: "Rename an additional VMware disk.",
      inputSchema: {
        id: z.string().describe("Disk ID from server_details"),
        name: z.string().describe("New disk name"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.serverDisk.updateName(args)),
  );

  server.registerTool(
    "serverdisk_delete",
    {
      description:
        "Delete an additional VMware disk. All data on the disk is permanently destroyed. Irreversible.",
      inputSchema: { id: z.string().describe("Disk ID from server_details") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.serverDisk.delete(args)),
  );
}
