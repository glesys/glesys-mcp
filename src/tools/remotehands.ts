import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { READ, UPDATE, WRITE, run } from "../client.js";

export function registerRemoteHandsTools(server: McpServer, glesys: GleSYSAPI): void {
  server.registerTool(
    "remotehands_list",
    {
      description: "List remote hands requests on the project with status and instructions.",
      annotations: READ,
    },
    () => run(glesys.remoteHands.list()),
  );

  server.registerTool(
    "remotehands_create",
    {
      description:
        "Request remote hands work on colocation services in a Glesys data center. "
        + "Costs money: billed per intervention, with a higher rate outside office hours. "
        + "Write instructions a technician can follow without follow-up questions.",
      inputSchema: {
        servicekeys: z
          .array(z.string())
          .describe(
            "Service keys the work applies to: co* keys from colocationrack_list, cs* keys "
            + "(physical servers) from server_list. All services must be in the same data center",
          ),
        title: z.string().max(100).optional().describe("Short summary of the work, max 100 characters"),
        instructions: z.string().describe("What the technician should do, precise and complete"),
        executionoption: z
          .enum(["asap", "scheduled"])
          .describe("asap performs the work as soon as possible"),
        trackingids: z
          .array(z.string())
          .optional()
          .describe("Tracking ids of inbound deliveries related to the work"),
        shipmentkeys: z
          .array(z.string())
          .optional()
          .describe("Keys of registered shipments related to the work, from shipment_list"),
      },
      annotations: WRITE,
    },
    (args) => run(glesys.remoteHands.create(args)),
  );

  server.registerTool(
    "remotehands_cancel",
    {
      description: "Cancel a remote hands request that has not been executed yet.",
      inputSchema: {
        key: z.string().describe("Key of the remote hands request to cancel"),
      },
      annotations: UPDATE,
    },
    (args) => run(glesys.remoteHands.cancel(args)),
  );
}
