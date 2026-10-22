import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DESTRUCTIVE, type Glesys, READ, run, UPDATE, WRITE, yesno } from "../client.js";

const lbidSchema = z.string().describe("Load balancer ID, e.g. lb123456");
const portSchema = z.number().int().min(1).max(65534);
const componentNameSchema = z
  .string()
  .min(3)
  .max(16)
  .describe("3-16 chars: letters, digits, space, . - _ (unique within the load balancer)");

export function registerLoadBalancerTools(server: McpServer, glesys: Glesys): void {
  server.registerTool(
    "loadbalancer_list",
    {
      description: "List load balancers on the project.",
      annotations: READ,
    },
    () => run(glesys.loadBalancer.list()),
  );

  server.registerTool(
    "loadbalancer_details",
    {
      description:
        "Get details about a load balancer, including its frontends, backends, targets and blocklist. Target statuses are UP, DOWN, MAINT (disabled) or UNKNOWN; configuration changes deploy asynchronously, so statuses can lag behind recent writes.",
      inputSchema: { loadbalancerid: lbidSchema },
      annotations: READ,
    },
    (args) => run(glesys.loadBalancer.details(args)),
  );

  server.registerTool(
    "loadbalancer_create",
    {
      description:
        "Create a load balancer. Billing starts immediately. A working setup also needs a backend (loadbalancer_add_backend), targets in that backend (loadbalancer_add_target) and a frontend listening on a port (loadbalancer_add_frontend).",
      inputSchema: {
        name: z.string().min(3).max(255),
        datacenter: z.enum(["Falkenberg", "Stockholm"]),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.loadBalancer.create(args)),
  );

  server.registerTool(
    "loadbalancer_edit",
    {
      description: "Rename a load balancer.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        name: z.string().min(3).max(255).optional(),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.loadBalancer.edit(args)),
  );

  server.registerTool(
    "loadbalancer_destroy",
    {
      description: "Permanently destroy a load balancer and all its configuration. Irreversible.",
      inputSchema: { loadbalancerid: lbidSchema },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.loadBalancer.destroy(args)),
  );

  server.registerTool(
    "loadbalancer_add_backend",
    {
      description:
        "Add a backend to a load balancer. A backend groups the targets that traffic is balanced over.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        name: componentNameSchema,
        mode: z.enum(["tcp", "http"]).optional().describe("Balancing mode, default tcp"),
        stickysession: z.boolean().optional().describe("Pin clients to the same target"),
        connecttimeout: z
          .number()
          .int()
          .min(1000)
          .max(30000)
          .optional()
          .describe("Milliseconds, default 4000"),
        responsetimeout: z
          .number()
          .int()
          .min(1000)
          .max(360000)
          .optional()
          .describe("Milliseconds, default 30000"),
      },
      annotations: WRITE,
    },
    ({ stickysession, ...args }) =>
      run(
        glesys.loadBalancer.addBackEnd({
          ...args,
          stickysession: yesno(stickysession),
        }),
      ),
  );

  server.registerTool(
    "loadbalancer_edit_backend",
    {
      description: "Change a backend's mode, sticky sessions or timeouts.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        backendname: z.string(),
        mode: z.enum(["tcp", "http"]).optional(),
        stickysession: z.boolean().optional(),
        connecttimeout: z.number().int().min(1000).max(30000).optional().describe("Milliseconds"),
        responsetimeout: z.number().int().min(1000).max(360000).optional().describe("Milliseconds"),
      },
      annotations: UPDATE,
    },
    ({ stickysession, ...args }) =>
      run(
        glesys.loadBalancer.editBackEnd({
          ...args,
          stickysession: yesno(stickysession),
        }),
      ),
  );

  server.registerTool(
    "loadbalancer_remove_backend",
    {
      description:
        "Remove a backend from a load balancer. Fails while any frontend still references it (remove those first), and silently deletes all of the backend's targets.",
      inputSchema: { loadbalancerid: lbidSchema, backendname: z.string() },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.loadBalancer.removeBackEnd(args)),
  );

  server.registerTool(
    "loadbalancer_add_target",
    {
      description:
        "Add a target (a server to balance traffic to) to a backend. Use the server's IP address and service port.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        backendname: z.string(),
        name: componentNameSchema,
        ipaddress: z
          .string()
          .describe("Target IP address; must be public and routable, private ranges are rejected"),
        port: portSchema.describe("Target port"),
        weight: z.number().int().describe("Relative traffic weight, e.g. 100"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.loadBalancer.addTarget(args)),
  );

  server.registerTool(
    "loadbalancer_edit_target",
    {
      description: "Change a target's IP address, port or weight.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        backendname: z.string(),
        targetname: z.string(),
        ipaddress: z.string().optional(),
        port: portSchema.optional(),
        weight: z.number().int().optional(),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.loadBalancer.editTarget(args)),
  );

  server.registerTool(
    "loadbalancer_enable_target",
    {
      description: "Enable a disabled target so it receives traffic again.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        backendname: z.string(),
        targetname: z.string(),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.loadBalancer.enableTarget(args)),
  );

  server.registerTool(
    "loadbalancer_disable_target",
    {
      description:
        "Disable a target so it stops receiving traffic, e.g. during maintenance. The target stays configured.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        backendname: z.string(),
        targetname: z.string(),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.loadBalancer.disableTarget(args)),
  );

  server.registerTool(
    "loadbalancer_remove_target",
    {
      description: "Remove a target from a backend.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        backendname: z.string(),
        name: z.string().describe("Target name"),
      },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.loadBalancer.removeTarget(args)),
  );

  server.registerTool(
    "loadbalancer_add_frontend",
    {
      description:
        "Add a frontend (a listening port) to a load balancer, connected to a backend. For TLS, upload a certificate first with loadbalancer_add_certificate and reference it by name.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        name: componentNameSchema,
        port: portSchema.describe("Port to listen on (unique within the load balancer)"),
        backendname: z.string().describe("Backend to send traffic to"),
        sslcertificate: z
          .string()
          .optional()
          .describe("Certificate name from loadbalancer_list_certificates"),
        maxconnections: z
          .number()
          .int()
          .max(200000)
          .optional()
          .describe("Default 1000; the sum across all frontends may not exceed 800000"),
        clienttimeout: z
          .number()
          .int()
          .min(1000)
          .max(30000)
          .optional()
          .describe("Milliseconds, default 30000"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.loadBalancer.addFrontEnd(args)),
  );

  server.registerTool(
    "loadbalancer_edit_frontend",
    {
      description: "Change a frontend's port, certificate, connection limit or client timeout.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        frontendname: z.string(),
        port: portSchema.optional(),
        sslcertificate: z
          .string()
          .optional()
          .describe("Certificate name, or \"none\" to detach the current certificate"),
        maxconnections: z.number().int().max(200000).optional(),
        clienttimeout: z.number().int().min(1000).max(30000).optional().describe("Milliseconds"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.loadBalancer.editFrontEnd(args)),
  );

  server.registerTool(
    "loadbalancer_remove_frontend",
    {
      description: "Remove a frontend from a load balancer. Its port stops accepting traffic.",
      inputSchema: { loadbalancerid: lbidSchema, frontendname: z.string() },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.loadBalancer.removeFrontEnd(args)),
  );

  server.registerTool(
    "loadbalancer_list_certificates",
    {
      description: "List the TLS certificates uploaded to a load balancer.",
      inputSchema: { loadbalancerid: lbidSchema },
      annotations: READ,
    },
    (args) => run(glesys.loadBalancer.listCertificate(args)),
  );

  server.registerTool(
    "loadbalancer_add_certificate",
    {
      description:
        "Upload a TLS certificate to a load balancer for use in frontends. The certificate is a base64 encoded PEM blob: the certificate (and any chain) concatenated with its private key. Uploads without a matching private key are rejected.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        certificatename: z
          .string()
          .min(2)
          .max(32)
          .describe("Name to reference the certificate by (letters, digits, - _ .)"),
        certificate: z
          .string()
          .describe("Base64 encoded PEM: certificate, chain and private key concatenated"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.loadBalancer.addCertificate(args)),
  );

  server.registerTool(
    "loadbalancer_remove_certificate",
    {
      description:
        "Remove a TLS certificate from a load balancer. It must not be in use by a frontend.",
      inputSchema: { loadbalancerid: lbidSchema, certificatename: z.string() },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.loadBalancer.removeCertificate(args)),
  );

  server.registerTool(
    "loadbalancer_errors",
    {
      description: "Get recent errors for a load balancer, useful when targets are not receiving traffic.",
      inputSchema: { loadbalancerid: lbidSchema },
      annotations: READ,
    },
    (args) => run(glesys.loadBalancer.errors(args)),
  );

  server.registerTool(
    "loadbalancer_add_to_blocklist",
    {
      description: "Block an IP prefix from connecting to a load balancer.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        prefix: z
          .string()
          .describe("CIDR prefix with an explicit mask, e.g. 192.0.2.0/24 or 192.0.2.4/32"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.loadBalancer.addToBlocklist(args)),
  );

  server.registerTool(
    "loadbalancer_remove_from_blocklist",
    {
      description: "Remove an IP prefix from a load balancer's blocklist.",
      inputSchema: {
        loadbalancerid: lbidSchema,
        prefix: z.string().describe("IP address or CIDR prefix, e.g. 192.0.2.0/24"),
      },
      annotations: DESTRUCTIVE,
    },
    (args) => run(glesys.loadBalancer.removeFromBlocklist(args)),
  );
}
