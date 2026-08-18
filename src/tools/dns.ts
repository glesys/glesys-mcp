import { domainToASCII } from "node:url";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE } from "../client.js";

// The API only accepts lowercase ASCII domain names, so normalize before sending.
function punycode(domainname: string): string {
  return domainToASCII(domainname.toLowerCase()) || domainname.toLowerCase();
}

const domainnameSchema = z.string().describe("Domain name, e.g. example.com");

const recordTypeSchema = z
  .enum(["A", "AAAA", "ALIAS", "CAA", "CNAME", "MX", "NS", "PTR", "SRV", "TXT", "URL", "SOA"])
  .describe("Record type (uppercase)");

const ttlSchema = z
  .number()
  .int()
  .min(60)
  .max(31556926)
  .describe("TTL in seconds (default 3600)");

export function registerDnsTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "dns_list_domains",
    {
      description: "List all DNS zones (domains) on the project.",
      annotations: READ,
    },
    () => run(glesys.domain.list()),
  );

  server.registerTool(
    "dns_domain_details",
    {
      description:
        "Get details about a DNS zone, including SOA settings and registrar information (whether the domain is registered through Glesys).",
      inputSchema: { domainname: domainnameSchema },
      annotations: READ,
    },
    ({ domainname }) => run(glesys.domain.details({ domainname: punycode(domainname) })),
  );

  server.registerTool(
    "dns_add_domain",
    {
      description:
        "Add an existing domain as a DNS zone on Glesys nameservers. This does not register the domain — use dns_register_domain to purchase one. By default a set of standard records is created. Common freemail domain names are rejected.",
      inputSchema: {
        domainname: domainnameSchema,
        createrecords: z
          .boolean()
          .optional()
          .describe("Create standard records (A, MX, ...) pointing at Glesys. Default true."),
      },
      annotations: WRITE,
    },
    ({ domainname, createrecords }) =>
      run(
        glesys.domain.add({
          domainname: punycode(domainname),
          createrecords: createrecords === undefined ? undefined : createrecords ? "yes" : "no",
        }),
      ),
  );

  server.registerTool(
    "dns_delete_domain",
    {
      description:
        "Remove a DNS zone and all its records from Glesys nameservers. Irreversible. Fails if the domain has email accounts (pass forcedeleteemail to delete those too) or an active Glesys registration.",
      inputSchema: {
        domainname: domainnameSchema,
        forcedeleteemail: z
          .boolean()
          .optional()
          .describe("Also delete all email accounts and aliases on the domain"),
      },
      annotations: DESTRUCTIVE,
    },
    ({ domainname, forcedeleteemail }) =>
      run(
        glesys.domain.delete({
          domainname: punycode(domainname),
          forcedeleteemail:
            forcedeleteemail === undefined ? undefined : forcedeleteemail ? "yes" : "no",
        }),
      ),
  );

  server.registerTool(
    "dns_list_records",
    {
      description:
        "List all records in a DNS zone with their record IDs. Record IDs are needed for dns_update_record and dns_delete_record.",
      inputSchema: { domainname: domainnameSchema },
      annotations: READ,
    },
    ({ domainname }) => run(glesys.domain.listRecords({ domainname: punycode(domainname) })),
  );

  server.registerTool(
    "dns_add_record",
    {
      description: "Add a record to a DNS zone.",
      inputSchema: {
        domainname: domainnameSchema,
        host: z
          .string()
          .max(70)
          .describe("Host, e.g. \"www\", \"@\" for the zone apex, or wildcards \"*\" / \"*.sub\""),
        type: recordTypeSchema,
        data: z.string().describe("Record data, e.g. an IP address"),
        ttl: ttlSchema.optional(),
      },
      annotations: WRITE,
    },
    ({ domainname, ...args }) =>
      run(glesys.domain.addRecord({ ...args, domainname: punycode(domainname) })),
  );

  server.registerTool(
    "dns_update_record",
    {
      description:
        "Update a DNS record's host, data or ttl. Get the recordid from dns_list_records first. Only the fields you pass are changed. The type cannot be changed — delete the record and add a new one instead.",
      inputSchema: {
        recordid: z.number().int().describe("Record ID from dns_list_records"),
        host: z.string().max(70).optional(),
        data: z.string().optional(),
        ttl: ttlSchema.optional(),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.domain.updateRecord(args)),
  );

  server.registerTool(
    "dns_delete_record",
    {
      description: "Delete a DNS record. Get the recordid from dns_list_records first.",
      inputSchema: { recordid: z.number().int().describe("Record ID from dns_list_records") },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.domain.deleteRecord(args)),
  );

  server.registerTool(
    "dns_check_availability",
    {
      description:
        "Check whether a domain name is available to register. A bare name without TLD (e.g. \"example\") searches all offered TLDs.",
      inputSchema: {
        search: z.string().min(3).max(64).describe("Domain name to check, e.g. example.com"),
      },
      annotations: READ,
    },
    (args) => run(glesys.domain.available(args)),
  );

  server.registerTool(
    "dns_pricelist",
    {
      description: "Get registration, transfer and renewal prices per top-level domain.",
      annotations: READ,
    },
    () => run(glesys.domain.priceList()),
  );

  server.registerTool(
    "dns_register_domain",
    {
      description:
        "Register (purchase) a domain through Glesys. This costs real money and is billed to the project, so make sure the user wants this. The zone must exist on the project first (dns_add_domain), and check dns_check_availability and dns_pricelist before registering. Requires registrant contact details.",
      inputSchema: {
        domainname: z.string().describe("Domain name to register"),
        email: z.string().describe("Registrant email address"),
        firstname: z.string().min(2).max(32).describe("Registrant first name"),
        lastname: z.string().min(2).max(64).describe("Registrant last name"),
        nationalid: z
          .string()
          .min(5)
          .max(64)
          .describe("National ID: personal/organization number for the registrant"),
        address: z.string().min(3).max(128).describe("Registrant street address"),
        city: z.string().min(2).max(64).describe("Registrant city"),
        zipcode: z.string().min(2).max(32).describe("Registrant zip/postal code"),
        country: z.string().describe("Registrant country: ISO code or country name, e.g. SE"),
        phonenumber: z
          .string()
          .describe("Registrant phone number, national or +E.164 format, e.g. +46701234567"),
        organization: z
          .string()
          .min(3)
          .max(64)
          .optional()
          .describe("Registrant organization; omit for private individuals"),
        numyears: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Registration years; omit for the TLD minimum (allowed values vary per TLD)"),
      },
      annotations: WRITE,
    },
    ({ domainname, ...args }) =>
      run(glesys.domain.register({ ...args, domainname: punycode(domainname) })),
  );

  server.registerTool(
    "dns_transfer_domain",
    {
      description:
        "Transfer a domain registration to Glesys. This costs real money and is billed to the project, so make sure the user wants this. The zone must exist on the project first (dns_add_domain). Requires the auth code from the current registrar.",
      inputSchema: {
        domainname: z.string().describe("Domain name to transfer"),
        authcode: z
          .string()
          .min(5)
          .max(64)
          .describe("Transfer authorization code from the current registrar"),
      },
      annotations: WRITE,
    },
    ({ domainname, authcode }) =>
      run(glesys.domain.transfer({ domainname: punycode(domainname), authcode })),
  );
}
