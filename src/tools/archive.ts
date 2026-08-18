import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE } from "../client.js";

const usernameSchema = z.string().describe("Archive username from archive_list");

export function registerArchiveTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "archive_list",
    {
      description: "List archive storage volumes on the project. Volumes are keyed by username.",
      annotations: READ,
    },
    () => run(glesys.archive.list()),
  );

  server.registerTool(
    "archive_details",
    {
      description: "Get details about an archive storage volume.",
      inputSchema: { username: usernameSchema },
      annotations: READ,
    },
    (args) => run(glesys.archive.details(args)),
  );

  server.registerTool(
    "archive_allowedarguments",
    {
      description:
        "List the allowed sizes for archive storage volumes. Call before archive_create or archive_resize.",
      annotations: READ,
    },
    () => run(glesys.archive.allowedArguments()),
  );

  server.registerTool(
    "archive_create",
    {
      description:
        "Create an archive storage volume, accessed over FTP/FTPS/CIFS with the given username and password. Sizes are enum-constrained; check archive_allowedarguments first. Billing starts immediately.",
      inputSchema: {
        username: z.string().describe("Username for the new volume"),
        password: z
          .string()
          .regex(/^[A-Za-z0-9]+$/)
          .describe("Password for the volume; letters and digits only. Treat as secret"),
        size: z.number().int().describe("Size in GB (allowed values only)"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.archive.create(args)),
  );

  server.registerTool(
    "archive_resize",
    {
      description:
        "Resize an archive storage volume. Volumes can only grow, never shrink; the new size must be an allowed value from archive_allowedarguments.",
      inputSchema: {
        username: usernameSchema,
        size: z.number().int().describe("New size in GB, larger than the current size"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.archive.resize(args)),
  );

  server.registerTool(
    "archive_changepassword",
    {
      description: "Change the password for an archive storage volume.",
      inputSchema: {
        username: usernameSchema,
        password: z
          .string()
          .regex(/^[A-Za-z0-9]+$/)
          .describe("New password; letters and digits only. Treat as secret"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.archive.changePassword(args)),
  );

  server.registerTool(
    "archive_changedescription",
    {
      description: "Change the description of an archive storage volume.",
      inputSchema: {
        username: usernameSchema,
        description: z.string().max(100).describe("The new description"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.archive.changeDescription(args)),
  );

  server.registerTool(
    "archive_delete",
    {
      description:
        "Delete an archive storage volume. All files on the volume are permanently destroyed. Irreversible.",
      inputSchema: { username: usernameSchema },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.archive.delete(args)),
  );
}
