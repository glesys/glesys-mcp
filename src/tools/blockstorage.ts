import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE } from "../client.js";

const volumeid = z.string().describe("Volume ID (bsv-...) from blockstorage_list_volumes");

export function registerBlockStorageTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "blockstorage_list_volumes",
    {
      description: "List block storage volumes on the project.",
      annotations: READ,
    },
    () => run(glesys.blockStorage.list()),
  );

  server.registerTool(
    "blockstorage_volume_details",
    {
      description: "Get details about a block storage volume, including size, status, data center, WWN and attached server.",
      inputSchema: { volumeid },
      annotations: READ,
    },
    (args) => run(glesys.blockStorage.details(args)),
  );

  server.registerTool(
    "blockstorage_list_tiers",
    {
      description:
        "List block storage tiers with their slug, size limits and IOPS. Call before blockstorage_create_volume.",
      annotations: READ,
    },
    () => run(glesys.blockStorage.listTiers()),
  );

  server.registerTool(
    "blockstorage_create_volume",
    {
      description:
        "Create a block storage volume. Costs money: billing starts immediately. "
        + "Attach it to a KVM server in the same data center with blockstorage_attach_volume. "
        + "Creation is asynchronous: wait until blockstorage_volume_details shows status READY before attaching.",
      inputSchema: {
        datacenter: z
          .string()
          .describe("Data center key. Block Storage is currently only offered in dc-fbg1 (Falkenberg)"),
        tier: z.string().describe("Tier slug from blockstorage_list_tiers, e.g. balanced"),
        name: z.string().min(1).max(255).describe("Volume name"),
        sizeingib: z
          .number()
          .int()
          .min(1)
          .describe("Size in GiB, within the tier's min and max from blockstorage_list_tiers"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.blockStorage.create(args)),
  );

  server.registerTool(
    "blockstorage_edit_volume",
    {
      description: "Rename a block storage volume.",
      inputSchema: { volumeid, name: z.string().min(1).max(255).describe("New volume name") },
      annotations: UPDATE,
    },
    (args) => run(glesys.blockStorage.edit(args)),
  );

  server.registerTool(
    "blockstorage_resize_volume",
    {
      description:
        "Grow a block storage volume. Volumes can only grow, and must be attached to a server. Increases the monthly cost.",
      inputSchema: {
        volumeid,
        sizeingib: z
          .number()
          .int()
          .min(1)
          .describe("New size in GiB, larger than the current size and within the tier's max"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.blockStorage.resize(args)),
  );

  server.registerTool(
    "blockstorage_attach_volume",
    {
      description: "Attach a block storage volume to a KVM server in the same data center. A volume can be attached to one server at a time.",
      inputSchema: {
        volumeid,
        serverid: z.string().describe("KVM server ID from server_list, e.g. kvm123456"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.blockStorage.attach(args)),
  );

  server.registerTool(
    "blockstorage_detach_volume",
    {
      description: "Detach a block storage volume from its server. Unmount it inside the server first to avoid data loss.",
      inputSchema: { volumeid },
      annotations: UPDATE,
    },
    (args) => run(glesys.blockStorage.detach(args)),
  );

  server.registerTool(
    "blockstorage_delete_volume",
    {
      description:
        "Delete a block storage volume. The volume must be detached and not still creating. All data on it is permanently destroyed. Irreversible.",
      inputSchema: { volumeid },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.blockStorage.delete(args)),
  );
}
