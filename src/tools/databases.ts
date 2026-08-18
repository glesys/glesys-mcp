import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE } from "../client.js";

export function registerDatabaseTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "database_list",
    {
      description: "List managed database instances on the project.",
      annotations: READ,
    },
    () => run(glesys.database.list()),
  );

  server.registerTool(
    "database_details",
    {
      description: "Get details about a managed database instance.",
      inputSchema: { id: z.string().describe("Database instance ID, e.g. db-abc123") },
      annotations: READ,
    },
    (args) => run(glesys.database.details(args)),
  );

  server.registerTool(
    "database_listplans",
    {
      description:
        "List available database plans: valid combinations of plankey, engine, engineversion and datacenterkey with pricing. Call this before database_create.",
      annotations: READ,
    },
    () => run(glesys.database.listPlans()),
  );

  server.registerTool(
    "database_create",
    {
      description:
        "Create a managed database instance. Use plankey/engine/engineversion/datacenterkey values from database_listplans. Unless the user has already specified them, fetch the plans first and ask the user to pick engine, plan and datacenter, preferably as a multiple-choice question if your environment supports one. Billing starts immediately. Access is closed until an allowlist is set.",
      inputSchema: {
        name: z.string().describe("Name of the database instance"),
        plankey: z.string().describe("Plan key from database_listplans"),
        engine: z.enum(["mysql", "postgresql"]).describe("Database engine"),
        engineversion: z.string().describe("Engine version from database_listplans"),
        datacenterkey: z
          .string()
          .describe("Datacenter key from database_listplans, e.g. dc-fbg1, dc-sto1 or dc-oul1"),
        allowlist: z
          .array(z.string())
          .optional()
          .describe("IP addresses/CIDR blocks allowed to connect"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.database.create(args)),
  );

  server.registerTool(
    "database_delete",
    {
      description:
        "Delete a managed database instance. All databases and data are permanently destroyed. Irreversible.",
      inputSchema: { id: z.string().describe("Database instance ID, e.g. db-abc123") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.database.delete(args)),
  );

  server.registerTool(
    "database_connection_details",
    {
      description:
        "Get the connection string for a managed database instance. Pass databasename and username together (both or neither). Treat the output as secret.",
      inputSchema: {
        id: z.string().describe("Database instance ID, e.g. db-abc123"),
        databasename: z.string().optional().describe("Requires username too"),
        username: z.string().optional().describe("Requires databasename too"),
      },
      annotations: READ,
    },
    (args) => run(glesys.database.connectionDetails(args)),
  );

  server.registerTool(
    "database_update_allowlist",
    {
      description:
        "Replace the IP allowlist of a managed database instance. Pass the complete list — addresses not included are removed.",
      inputSchema: {
        id: z.string().describe("Database instance ID, e.g. db-abc123"),
        allowlist: z
          .array(z.string())
          .describe("Complete list of IP addresses/CIDR blocks allowed to connect"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.database.updateAllowList(args)),
  );
}
