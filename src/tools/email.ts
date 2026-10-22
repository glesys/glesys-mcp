import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DESTRUCTIVE, type Glesys, READ, run, UPDATE, WRITE } from "../client.js";

const accountSettings = {
  antispamlevel: z.number().int().min(0).max(5).optional().describe("Spam filter level, 0-5"),
  antivirus: z.boolean().optional(),
  autorespond: z.boolean().optional().describe("Enable the auto-responder"),
  autorespondmessage: z.string().optional().describe("Auto-responder message"),
  quotaingib: z.number().int().min(1).optional().describe("Mailbox quota in GiB"),
  rejectspam: z.boolean().optional().describe("Reject spam instead of putting it in the spam folder"),
};

export function registerEmailTools(server: McpServer, glesys: Glesys): void {
  server.registerTool(
    "email_overview",
    {
      description: "List all domains on the project that have email, with their accounts and aliases.",
      inputSchema: {
        filter: z.string().optional().describe("Filter domains by name"),
        page: z.number().int().optional(),
      },
      annotations: READ,
    },
    (args) => run(glesys.email.overview(args)),
  );

  server.registerTool(
    "email_list",
    {
      description: "List email accounts and aliases on a domain, with quota and settings.",
      inputSchema: {
        domainname: z.string().describe("Domain name, e.g. example.com"),
        filter: z.string().optional().describe("Filter by email address"),
      },
      annotations: READ,
    },
    (args) => run(glesys.email.list(args)),
  );

  server.registerTool(
    "email_quota",
    {
      description: "Get used and total quota for an email account.",
      inputSchema: { emailaccount: z.string().describe("Email address of the account") },
      annotations: READ,
    },
    (args) => run(glesys.email.quota(args)),
  );

  server.registerTool(
    "email_costs",
    {
      description: "Get the email costs for the project.",
      annotations: READ,
    },
    () => run(glesys.email.costs()),
  );

  server.registerTool(
    "email_createaccount",
    {
      description:
        "Create an email account on a domain the project holds. No password is set on creation — call email_resetpassword afterwards to get one.",
      inputSchema: {
        emailaccount: z.string().describe("Email address to create, e.g. info@example.com"),
        ...accountSettings,
      },
      annotations: WRITE,
    },
    (args) => run(glesys.email.createAccount(args)),
  );

  server.registerTool(
    "email_editaccount",
    {
      description: "Change the settings of an email account. Only the fields you pass are changed.",
      inputSchema: {
        emailaccount: z.string().describe("Email address of the account"),
        ...accountSettings,
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.email.editAccount(args)),
  );

  server.registerTool(
    "email_resetpassword",
    {
      description:
        "Set a new random password for an email account and return it. The old password stops working. Treat the output as secret.",
      inputSchema: { emailaccount: z.string().describe("Email address of the account") },
      annotations: UPDATE,
    },
    (args) => run(glesys.email.resetPassword(args)),
  );

  server.registerTool(
    "email_createalias",
    {
      description: "Create an email alias that forwards to one or more addresses.",
      inputSchema: {
        emailalias: z.string().describe("Alias address to create, e.g. sales@example.com"),
        goto: z
          .array(z.string())
          .min(1)
          .describe("Destination email addresses the alias forwards to"),
      },
      annotations: WRITE,
    },
    ({ goto, ...args }) => run(glesys.email.createAlias({ ...args, goto: goto.join(",") })),
  );

  server.registerTool(
    "email_editalias",
    {
      description: "Replace the destinations of an email alias.",
      inputSchema: {
        emailalias: z.string().describe("The alias address"),
        goto: z
          .array(z.string())
          .min(1)
          .describe("Complete list of destination addresses; replaces the current list"),
      },
      annotations: UPDATE,
    },
    ({ goto, ...args }) => run(glesys.email.editAlias({ ...args, goto: goto.join(",") })),
  );

  server.registerTool(
    "email_delete",
    {
      description:
        "Delete an email account or alias. Deleting an account permanently destroys its stored mail. Irreversible.",
      inputSchema: { email: z.string().describe("Email address of the account or alias") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.email.delete(args)),
  );
}
