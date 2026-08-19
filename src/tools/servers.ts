import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE, yesno } from "../client.js";

export function registerServerTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "server_list",
    {
      description:
        "List all servers in the project with their IDs (e.g. kvm123456), hostnames and datacenter.",
      annotations: READ,
    },
    () => run(glesys.server.list()),
  );

  server.registerTool(
    "server_details",
    {
      description:
        "Get detailed information about a server: hardware configuration, IP addresses, cost and (optionally) run state.",
      inputSchema: {
        serverid: z.string().describe("Server ID, e.g. kvm123456"),
        includestate: z
          .boolean()
          .optional()
          .describe("Also fetch the current run state (running/locked). Slightly slower."),
      },
      annotations: READ,
    },
    ({ serverid, includestate }) =>
      run(glesys.server.details({ serverid, includestate: yesno(includestate) })),
  );

  server.registerTool(
    "server_templates",
    {
      description:
        "List available OS templates grouped by platform (KVM, VMware). Each template lists its minimum disk and memory size. Reference templates by id in server_create.",
      annotations: READ,
    },
    () => run(glesys.server.templates()),
  );

  server.registerTool(
    "server_allowedarguments",
    {
      description:
        "List the allowed values for server configuration per platform: disksize, memorysize, cpucores, bandwidth, datacenter and templates. Pass serverid to get the valid resize values for an existing server. Call this before server_create or server_edit instead of guessing sizes.",
      inputSchema: {
        serverid: z.string().optional().describe("Server ID to get resize options for"),
      },
      annotations: READ,
    },
    (args) => run(glesys.server.allowedArguments(args)),
  );

  server.registerTool(
    "server_listplans",
    {
      description:
        "List available server plans (predefined cpu/memory/disk size combinations) with their plansizekey and price. Sizes on Glesys are enum-constrained — use a plan, or pick sizes that appear in these plans.",
      annotations: READ,
    },
    () => run(glesys.server.listPlans()),
  );

  server.registerTool(
    "server_create",
    {
      description:
        "Create a new virtual server. This has many options — unless the user has already specified them, first fetch the real choices (server_allowedarguments, server_templates) and ask the user to pick datacenter, template, size and login method, preferably as a multiple-choice question if your environment supports one. Do not guess these. The server starts billing immediately. "
        + "The KVM and VMware platforms take different arguments:\n"
        + "KVM (the normal choice): sizing requires all three of cpucores+memorysize+disksize (or plansizekey, but plans require a feature flag most projects lack — prefer explicit sizes; never send both). Login requires users OR cloudconfig — each user needs a password or sshkeys (public key strings). The top-level sshkey/sshkeyids/rootpassword arguments are ignored on KVM.\n"
        + "VMware: disksize, memorysize and cpucores are all required (plansizekey is ignored). rootpassword is required for most templates. sshkey/sshkeyids authorize root; users/cloudconfig only work on templates whose bootstrapmethod is cloud-init (see server_templates).",
      inputSchema: {
        datacenter: z.string().describe("Datacenter, e.g. Falkenberg or Stockholm"),
        platform: z.enum(["KVM", "VMware"]).describe("Virtualization platform, normally KVM"),
        hostname: z
          .string()
          .max(60)
          .describe("Hostname: lowercase a-z, 0-9, dots and dashes; unique within the project"),
        templatename: z
          .string()
          .describe("Template id from server_templates (name or tag also accepted)"),
        plansizekey: z
          .string()
          .optional()
          .describe(
            "KVM only: plan key from server_listplans. Requires the server-plans feature flag; do not combine with explicit sizes",
          ),
        disksize: z
          .number()
          .optional()
          .describe("Disk size in GB (allowed values only, see server_allowedarguments)"),
        memorysize: z.number().optional().describe("Memory in MB (allowed values only)"),
        cpucores: z.number().optional().describe("Number of CPU cores (allowed values only)"),
        bandwidth: z
          .number()
          .optional()
          .describe("Bandwidth in Mbps (allowed values only; default 100 on KVM)"),
        description: z.string().max(100).optional(),
        ip: z.string().optional().describe("IPv4 address, \"any\" (default) or \"none\""),
        ipv6: z.string().optional().describe("IPv6 address, \"any\" (default) or \"none\""),
        users: z
          .array(
            z.object({
              username: z
                .string()
                .describe("Lowercase, starts with a letter or _, max 32 chars (a-z, 0-9, _, -)"),
              password: z
                .string()
                .min(8)
                .optional()
                .describe("Min 8 chars; required if sshkeys is not given"),
              sshkeys: z
                .array(z.string())
                .optional()
                .describe("Public SSH key strings; required if password is not given"),
            }),
          )
          .optional()
          .describe("Users to create on the server (KVM and cloud-init VMware templates)"),
        cloudconfig: z
          .string()
          .optional()
          .describe("cloud-init cloud-config YAML (KVM and cloud-init VMware templates)"),
        cloudconfigparams: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Mustache parameters substituted into cloudconfig"),
        backupschedules: z
          .array(
            z.object({
              frequency: z.enum(["daily", "weekly"]),
              numberofimagestokeep: z.number().min(1),
            }),
          )
          .optional()
          .describe("KVM only: automatic backup schedules"),
        sshkeyids: z
          .array(z.number())
          .optional()
          .describe("VMware only: IDs of stored SSH keys (see sshkey_list) to authorize for root"),
        sshkey: z
          .string()
          .optional()
          .describe(
            "VMware only: a public SSH key string to authorize for root (no sk-* hardware keys; use users[].sshkeys for those)",
          ),
        rootpassword: z
          .string()
          .optional()
          .describe(
            "VMware only: root password, required for most VMware templates. Min 8 chars; only A-Za-z0-9 and . - _ @ # $ % / ^ & + = ? ! *",
          ),
      },
      annotations: WRITE,
    },
    ({ sshkeyids, ...args }) =>
      run(glesys.server.create({ ...args, sshkeyids: sshkeyids?.join(",") })),
  );

  server.registerTool(
    "server_estimatedcost",
    {
      description:
        "Estimate the monthly cost of a new server configuration before creating it, or of a configuration change to an existing server (pass serverid). Use this to show the user the price before server_create or server_edit.",
      inputSchema: {
        serverid: z.string().optional().describe("Existing server to estimate changes for"),
        cpucores: z.number().optional(),
        memorysize: z.number().optional().describe("Memory in MB"),
        disksize: z.number().optional().describe("Disk size in GB"),
        bandwidth: z.number().optional().describe("Bandwidth in Mbps"),
      },
      annotations: READ,
    },
    (args) => run(glesys.server.estimatedCost(args)),
  );

  server.registerTool(
    "server_previewcloudconfig",
    {
      description:
        "Render a cloud-config mustache template with parameters and users, exactly as server_create would. Use this to validate a cloudconfig before creating the server.",
      inputSchema: {
        cloudconfig: z.string().describe("cloud-init cloud-config YAML (mustache template)"),
        cloudconfigparams: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Mustache parameters substituted into the template"),
        users: z
          .array(
            z.object({
              username: z.string(),
              password: z.string().optional(),
              sshkeys: z.array(z.string()).optional(),
            }),
          )
          .optional()
          .describe("Users, same format as server_create"),
      },
      annotations: READ,
    },
    (args) => run(glesys.server.previewCloudConfig(args)),
  );

  server.registerTool(
    "server_edit",
    {
      description:
        "Change a server's configuration. Get the valid resize values from server_allowedarguments with the serverid — they are server-specific, and disksize can only grow. "
        + "Caveats: bandwidth is only editable on VMware (silently ignored on KVM). KVM servers created from a plan (plansizekey) can only change hostname, description and backupschedules. Resizing may require a reboot.",
      inputSchema: {
        serverid: z.string().describe("Server ID"),
        disksize: z.number().optional().describe("Disk size in GB; can only grow"),
        memorysize: z.number().optional(),
        cpucores: z.number().optional(),
        bandwidth: z.number().optional().describe("VMware only; ignored on KVM"),
        hostname: z.string().max(60).optional(),
        description: z.string().max(100).optional(),
        backupschedules: z
          .array(
            z.object({
              frequency: z.enum(["daily", "weekly"]),
              numberofimagestokeep: z.number().min(1),
            }),
          )
          .optional()
          .describe("KVM only: replaces all backup schedules; an empty array removes them"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.server.edit(args)),
  );

  server.registerTool(
    "server_start",
    {
      description: "Start a stopped server.",
      inputSchema: { serverid: z.string().describe("Server ID") },
      annotations: UPDATE,
    },
    (args) => run(glesys.server.start(args)),
  );

  server.registerTool(
    "server_stop",
    {
      description:
        "Stop or reboot a server. type \"soft\" (default) shuts down gracefully, \"hard\" cuts power, \"reboot\" restarts the server. On VMware, soft and reboot require VMware Tools running in the guest.",
      inputSchema: {
        serverid: z.string().describe("Server ID"),
        type: z.enum(["soft", "hard", "reboot"]).optional(),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.server.stop(args)),
  );

  server.registerTool(
    "server_status",
    {
      description:
        "Get status for a server: run state, CPU/memory/disk usage and uptime. Usage numbers are cached for one minute. Not all types are supported on all platforms.",
      inputSchema: { serverid: z.string().describe("Server ID") },
      annotations: READ,
    },
    (args) => run(glesys.server.status(args)),
  );

  server.registerTool(
    "server_resourceusage",
    {
      description:
        "Get resource usage over time for a VMware server, e.g. CPU or disk usage history. Not supported on KVM; use server_status for a current snapshot there.",
      inputSchema: {
        serverid: z.string().describe("VMware server ID"),
        resource: z.enum([
          "cpuusage",
          "memoryusage",
          "diskusage",
          "diskioread",
          "diskiowrite",
          "transfertotal",
        ]),
        resolution: z.enum(["minute", "hour", "day"]),
      },
      annotations: READ,
    },
    (args) => run(glesys.server.resourceUsage(args)),
  );

  server.registerTool(
    "server_costs",
    {
      description:
        "List the actual costs for a server: cpu, memory, disk, license and other line items.",
      inputSchema: { serverid: z.string().describe("Server ID") },
      annotations: READ,
    },
    (args) => run(glesys.server.costs(args)),
  );

  server.registerTool(
    "server_reset",
    {
      description:
        "Forcefully restart a KVM server, like cutting power and starting it again. Use when the server is hung and server_stop with type reboot does not respond.",
      inputSchema: { serverid: z.string().describe("KVM server ID") },
      annotations: UPDATE,
    },
    (args) => run(glesys.server.reset(args)),
  );

  server.registerTool(
    "server_backup",
    {
      description:
        "Enable or disable backup for a VMware server. On KVM, backups are configured with backupschedules in server_create or server_edit instead.",
      inputSchema: {
        serverid: z.string().describe("VMware server ID"),
        enabled: z.boolean(),
      },
      annotations: UPDATE,
    },
    ({ serverid, enabled }) => run(glesys.server.backup({ serverid, enabled: yesno(enabled) })),
  );

  server.registerTool(
    "server_estimated_backup_cost",
    {
      description: "Estimate the backup cost for an existing VMware server.",
      inputSchema: {
        serverid: z.string().describe("VMware server ID"),
        enabled: z.boolean().optional().describe("Estimate as if backup were enabled/disabled"),
      },
      annotations: READ,
    },
    ({ serverid, enabled }) =>
      run(glesys.server.estimatedBackupCost({ serverid, enabled: yesno(enabled) })),
  );

  server.registerTool(
    "server_list_backups",
    {
      description:
        "List available backups for a KVM server, both scheduled and manual, with their backup IDs.",
      inputSchema: { serverid: z.string().describe("KVM server ID") },
      annotations: READ,
    },
    (args) => run(glesys.server.listBackups(args)),
  );

  server.registerTool(
    "server_create_manual_backup",
    {
      description:
        "Create a manual backup of a KVM server, e.g. before a risky change. The backup appears in server_list_backups.",
      inputSchema: { serverid: z.string().describe("KVM server ID") },
      annotations: WRITE,
    },
    (args) => run(glesys.server.createManualBackup(args)),
  );

  server.registerTool(
    "server_delete_manual_backup",
    {
      description: "Delete a manual backup of a KVM server. Irreversible.",
      inputSchema: { backupid: z.string().describe("Backup ID from server_list_backups") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.server.deleteManualBackup(args)),
  );

  server.registerTool(
    "server_create_from_backup",
    {
      description:
        "Create a new KVM server from a backup. The original server is untouched. Billing for the new server starts immediately.",
      inputSchema: {
        backupid: z.string().describe("Backup ID from server_list_backups"),
        datacenter: z
          .string()
          .optional()
          .describe("Datacenter for the new server; defaults to the backup's datacenter"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.server.createFromBackup(args)),
  );

  server.registerTool(
    "server_destroy",
    {
      description:
        "Permanently destroy a server and its disk. This is irreversible. keepip=true keeps the IP address reserved on the project (still billed); keepip=false releases it back to Glesys.",
      inputSchema: {
        serverid: z.string().describe("Server ID"),
        keepip: z.boolean().describe("Keep the IP address reserved on the project"),
      },
      annotations: DESTRUCTIVE,
    },
    ({ serverid, keepip }) =>
      run(glesys.server.destroy({ serverid, keepip: yesno(keepip) })),
  );
}

export function registerSshKeyTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "sshkey_list",
    {
      description: "List SSH keys stored on the project, with their IDs for use in server_create.",
      annotations: READ,
    },
    () => run(glesys.sshKey.list()),
  );

  server.registerTool(
    "sshkey_add",
    {
      description: "Store a public SSH key on the project for use when creating servers.",
      inputSchema: {
        sshkey: z.string().describe("The public key, e.g. ssh-ed25519 AAAA..."),
        description: z.string().max(100).describe("A name for the key"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.sshKey.add(args)),
  );

  server.registerTool(
    "sshkey_remove",
    {
      description: "Remove stored SSH keys from the project.",
      inputSchema: {
        sshkeyids: z
          .string()
          .regex(/^\d+(,\d+)*$/)
          .describe("SSH key ID, or several separated by commas"),
      },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.sshKey.remove(args)),
  );
}
