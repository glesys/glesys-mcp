import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { READ, UPDATE, WRITE, run } from "../client.js";

export function registerShipmentTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "shipment_list",
    {
      description: "List registered inbound shipments to Glesys data centers.",
      annotations: READ,
    },
    () => run(glesys.shipment.list()),
  );

  server.registerTool(
    "shipment_create",
    {
      description:
        "Register an inbound shipment to a Glesys data center so it can be received. "
        + "The tracking id can be added later with shipment_edit once the carrier provides it.",
      inputSchema: {
        datacenter: z.enum(["dc-fbg1", "dc-sto1"]).describe("Destination data center"),
        trackingid: z.string().optional().describe("Carrier tracking id, if already known"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.shipment.create(args)),
  );

  server.registerTool(
    "shipment_edit",
    {
      description: "Set or update the tracking id of a registered shipment.",
      inputSchema: {
        key: z.string().describe("Key of the shipment to edit"),
        trackingid: z.string().describe("Carrier tracking id"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.shipment.edit(args)),
  );

  server.registerTool(
    "shipment_cancel",
    {
      description: "Cancel a registered shipment before it has been received.",
      inputSchema: {
        key: z.string().describe("Key of the shipment to cancel"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.shipment.cancel(args)),
  );
}
