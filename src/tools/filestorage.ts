import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE, yesno } from "../client.js";

export function registerFileStorageTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "filestorage_list_volumes",
    {
      description: "List file storage volumes on the project.",
      annotations: READ,
    },
    () => run(glesys.fileStorage.listVolumes()),
  );

  server.registerTool(
    "filestorage_volume_details",
    {
      description: "Get details about a file storage volume.",
      inputSchema: { volumeid: z.string().describe("Volume ID from filestorage_list_volumes") },
      annotations: READ,
    },
    (args) => run(glesys.fileStorage.volumeDetails(args)),
  );

  server.registerTool(
    "filestorage_list_plans",
    {
      description:
        "List available file storage plans with their planid. Pass volumeid to see the plans an existing volume can change to. Call before filestorage_create_volume.",
      inputSchema: { volumeid: z.string().optional() },
      annotations: READ,
    },
    (args) => run(glesys.fileStorage.listPlans(args)),
  );

  server.registerTool(
    "filestorage_create_volume",
    {
      description:
        "Create a file storage volume. Use a planid from filestorage_list_plans. Billing starts immediately. Access is closed until an accesslist is set with filestorage_edit_volume.",
      inputSchema: {
        datacenter: z.enum(["Falkenberg", "Stockholm"]),
        planid: z.string().describe("Plan ID from filestorage_list_plans"),
        name: z.string().optional(),
        autopromotion: z
          .boolean()
          .optional()
          .describe("Automatically move to a larger plan when the volume runs full. Default true"),
      },
      annotations: WRITE,
    },
    ({ autopromotion, ...args }) =>
      run(
        glesys.fileStorage.createVolume({
          ...args,
          autopromotion: yesno(autopromotion),
        }),
      ),
  );

  server.registerTool(
    "filestorage_edit_volume",
    {
      description:
        "Edit a file storage volume: rename it, change its plan, toggle autopromotion, or replace which servers may mount it.",
      inputSchema: {
        volumeid: z.string().describe("Volume ID from filestorage_list_volumes"),
        accesslist: z
          .array(z.string())
          .optional()
          .describe(
            "Complete list of server IDs allowed to mount the volume; replaces the current list",
          ),
        planid: z.string().optional().describe("New plan ID from filestorage_list_plans"),
        name: z.string().optional(),
        autopromotion: z
          .boolean()
          .optional()
          .describe("Automatically move to a larger plan when the volume runs full"),
      },
      annotations: UPDATE,
    },
    ({ accesslist, autopromotion, ...args }) =>
      run(
        glesys.fileStorage.editVolume({
          ...args,
          accesslist: accesslist?.join(","),
          autopromotion: yesno(autopromotion),
        }),
      ),
  );

  server.registerTool(
    "filestorage_resource_usage",
    {
      description: "Get resource usage (used and total space) for a file storage volume.",
      inputSchema: { volumeid: z.string().describe("Volume ID from filestorage_list_volumes") },
      annotations: READ,
    },
    (args) => run(glesys.fileStorage.resourceUsage(args)),
  );

  server.registerTool(
    "filestorage_delete_volume",
    {
      description:
        "Delete a file storage volume. All stored files are permanently destroyed. Irreversible.",
      inputSchema: { volumeid: z.string().describe("Volume ID from filestorage_list_volumes") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.fileStorage.deleteVolume(args)),
  );
}
