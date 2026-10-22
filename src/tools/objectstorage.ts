import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DESTRUCTIVE, type Glesys, READ, run, UPDATE, WRITE, yesno } from "../client.js";

export function registerObjectStorageTools(server: McpServer, glesys: Glesys): void {
  server.registerTool(
    "objectstorage_list_instances",
    {
      description: "List S3-compatible object storage instances on the project.",
      annotations: READ,
    },
    () => run(glesys.objectStorage.listInstances()),
  );

  server.registerTool(
    "objectstorage_instance_details",
    {
      description:
        "Get details about an object storage instance, including its buckets and credentials.",
      inputSchema: { instanceid: z.string().describe("Instance ID, e.g. os-ab123") },
      annotations: READ,
    },
    (args) => run(glesys.objectStorage.instanceDetails(args)),
  );

  server.registerTool(
    "objectstorage_create_instance",
    {
      description:
        "Create an S3-compatible object storage instance. Returns the instance including its first access credential (key + secret) — the secret is only shown once.",
      inputSchema: {
        datacenter: z
          .enum(["dc-sto1", "dc-fbg1"])
          .describe("Datacenter: Stockholm or Falkenberg"),
        description: z.string().max(255).optional(),
        createinitialbucket: z.boolean().optional().describe("Also create a first bucket"),
      },
      annotations: WRITE,
    },
    ({ createinitialbucket, ...args }) =>
      run(
        glesys.objectStorage.createInstance({
          ...args,
          createinitialbucket:
            yesno(createinitialbucket),
        }),
      ),
  );

  server.registerTool(
    "objectstorage_edit_instance",
    {
      description:
        "Change the description of an object storage instance. Clearing a description is not supported.",
      inputSchema: {
        instanceid: z.string().describe("Instance ID"),
        description: z.string().min(1).max(255).describe("The new description"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.objectStorage.editInstance(args)),
  );

  server.registerTool(
    "objectstorage_delete_instance",
    {
      description:
        "Delete an object storage instance. All buckets and stored files are permanently destroyed. Irreversible.",
      inputSchema: { instanceid: z.string().describe("Instance ID") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.objectStorage.deleteInstance(args)),
  );

  server.registerTool(
    "objectstorage_create_credential",
    {
      description:
        "Create an access credential (key + secret) for an object storage instance. The secret is only shown once.",
      inputSchema: {
        instanceid: z.string().describe("Instance ID"),
        description: z.string().max(255).optional(),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.objectStorage.createCredential(args)),
  );

  server.registerTool(
    "objectstorage_estimated_cost",
    {
      description:
        "Estimate the monthly cost of object storage: an existing instance (pass instanceid) or a new one (pass the expected average usage in GiB).",
      inputSchema: {
        instanceid: z.string().optional().describe("Existing instance ID, e.g. os-ab123"),
        averageUsageInGib: z
          .number()
          .int()
          .optional()
          .describe("Expected average usage in GiB; required when no instanceid is given"),
      },
      annotations: READ,
    },
    (args) => run(glesys.objectStorage.estimatedCost(args)),
  );

  server.registerTool(
    "objectstorage_costs",
    {
      description: "Get the actual object storage costs for the project.",
      inputSchema: {
        instanceid: z.string().optional().describe("Limit to one instance"),
        includelines: z.boolean().optional().describe("Include per-line cost details"),
      },
      annotations: READ,
    },
    ({ includelines, ...args }) =>
      run(glesys.objectStorage.costs({ ...args, includelines: yesno(includelines) })),
  );

  server.registerTool(
    "objectstorage_delete_credential",
    {
      description:
        "Delete an access credential from an object storage instance. Anything using it loses access immediately.",
      inputSchema: {
        instanceid: z.string().describe("Instance ID"),
        credentialid: z.string().describe("Credential ID"),
      },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.objectStorage.deleteCredential(args)),
  );
}
