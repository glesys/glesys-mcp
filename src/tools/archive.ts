import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DESTRUCTIVE, type Glesys, READ, run, UPDATE, WRITE } from "../client.js";

const usernameSchema = z.string().describe("Archive username from archive_list");

export function registerArchiveTools(server: McpServer, glesys: Glesys): void {
  server.registerTool(
    "archive_list",
    {
      description: "List archives on the project. Archives are keyed by username.",
      annotations: READ,
    },
    () => run(glesys.archive.list()),
  );

  server.registerTool(
    "archive_details",
    {
      description: "Get details about an archive.",
      inputSchema: { username: usernameSchema },
      annotations: READ,
    },
    (args) => run(glesys.archive.details(args)),
  );

  server.registerTool(
    "archive_allowedarguments",
    {
      description:
        "List the allowed sizes for archives. Call before archive_create or archive_resize.",
      annotations: READ,
    },
    () => run(glesys.archive.allowedArguments()),
  );

  server.registerTool(
    "archive_create",
    {
      description:
        "Create an archive: extra space for long-time storage, accessed over FTP/FTPS/CIFS with the given username and password. Sizes are enum-constrained; check archive_allowedarguments first. Billing starts immediately.",
      inputSchema: {
        username: z
          .string()
          .regex(/^[A-Za-z0-9]+$/)
          .describe("Username for the new archive; letters and digits only"),
        password: z
          .string()
          .regex(/^[A-Za-z0-9]+$/)
          .min(8)
          .describe("Password for the archive; min 8 chars, letters and digits only. Treat as secret"),
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
        "Resize an archive. Archives can only grow, never shrink; the new size must be an allowed value from archive_allowedarguments.",
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
      description: "Change the password for an archive.",
      inputSchema: {
        username: usernameSchema,
        password: z
          .string()
          .regex(/^[A-Za-z0-9]+$/)
          .min(8)
          .describe("New password; min 8 chars, letters and digits only. Treat as secret"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.archive.changePassword(args)),
  );

  server.registerTool(
    "archive_changedescription",
    {
      description: "Change the description of an archive.",
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
        "Delete an archive. All files in it are permanently destroyed. Irreversible.",
      inputSchema: { username: usernameSchema },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.archive.delete(args)),
  );
}
