import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DESTRUCTIVE, type Glesys, READ, run, UPDATE, WRITE } from "../client.js";

export function registerDatabaseTools(server: McpServer, glesys: Glesys): void {
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
        "Create a managed database instance. Use plankey/engine/engineversion/datacenterkey values from database_listplans. Unless the user has already specified them, fetch the plans first and ask the user to pick engine, plan and datacenter, preferably as a multiple-choice question if your environment supports one. Billing starts immediately. Access is closed until an allowlist is set, and logical databases and users are added with database_create_database and database_create_user.",
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
        "Replace the IP allowlist of a managed database instance. Pass the complete list; addresses not included are removed.",
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

  server.registerTool(
    "database_create_database",
    {
      description: "Create a logical database on a database instance.",
      inputSchema: {
        instanceid: z.string().describe("Database instance ID, e.g. db-abc123"),
        name: z
          .string()
          .min(1)
          .max(63)
          .regex(/^[a-zA-Z_]\w*$/)
          .describe(
            "Database name: starts with a letter or _, then letters/digits/_. Reserved names like mysql and postgres are rejected",
          ),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.database.createDatabase(args)),
  );

  server.registerTool(
    "database_delete_database",
    {
      description:
        "Delete a logical database from a database instance. All data in it is permanently destroyed. Irreversible.",
      inputSchema: {
        databaseid: z.string().describe("Logical database ID from database_details"),
      },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.database.deleteDatabase(args)),
  );

  server.registerTool(
    "database_create_user",
    {
      description:
        "Create a user on a database instance. The response includes the generated password; it is only shown once, treat it as secret. The user has no permissions until database_set_user_permissions is called.",
      inputSchema: {
        instanceid: z.string().describe("Database instance ID, e.g. db-abc123"),
        username: z
          .string()
          .min(1)
          .max(32)
          .regex(/^[a-zA-Z_]\w*$/)
          .describe(
            "Username: starts with a letter or _, then letters/digits/_. Reserved names like root and postgres are rejected",
          ),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.database.createUser(args)),
  );

  server.registerTool(
    "database_delete_user",
    {
      description: "Delete a user from a database instance.",
      inputSchema: { userid: z.string().describe("User ID from database_details") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.database.deleteUser(args)),
  );

  server.registerTool(
    "database_reset_user_password",
    {
      description:
        "Set a new random password for a database instance user and return it. The old password stops working. Treat the output as secret.",
      inputSchema: { userid: z.string().describe("User ID from database_details") },
      annotations: UPDATE,
    },
    (args) => run(glesys.database.resetUserPassword(args)),
  );

  server.registerTool(
    "database_set_user_permissions",
    {
      description:
        "Set the full permission set for a database instance user. The passed permissions replace the existing set; any database not listed is revoked. Pass an empty array to revoke everything.",
      inputSchema: {
        userid: z.string().describe("User ID from database_details"),
        permissions: z
          .array(
            z.object({
              databaseid: z.string().describe("Logical database ID from database_details"),
              permission: z.enum(["READ", "WRITE"]),
            }),
          )
          .describe("Complete permission set; replaces the current one"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.database.setUserPermissions(args)),
  );

  server.registerTool(
    "database_estimated_cost",
    {
      description:
        "Estimate the monthly cost of a database instance: a new one (pass plankey) or an existing one (pass databaseid).",
      inputSchema: {
        databaseid: z.string().optional().describe("Existing instance ID, e.g. db-abc123"),
        plankey: z.string().optional().describe("Plan key from database_listplans"),
      },
      annotations: READ,
    },
    (args) => run(glesys.database.estimatedCost(args)),
  );
}
