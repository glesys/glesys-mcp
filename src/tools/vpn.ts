import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GleSYSAPI } from "glesys-api";
import { z } from "zod";
import { DESTRUCTIVE, READ, run, UPDATE, WRITE } from "../client.js";

const vpnUsernameSchema = z
  .string()
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/)
  .describe(
    "VPN username, e.g. alice. The project key prefix (clXXXXX_) is added automatically when missing",
  );

const vpnPasswordSchema = z
  .string()
  .min(5)
  .max(50)
  .regex(/^[a-zA-Z0-9\-#.,!]+$/)
  .describe("5-50 chars, only A-Z a-z 0-9 - # . , ! — treat as secret");

export function registerVpnTools(server: McpServer, glesys: GleSYSAPI, project: string): void {
  const login = (username: string) =>
    username.startsWith(`${project}_`) ? username : `${project}_${username}`;

  server.registerTool(
    "vpn_list_users",
    {
      description: "List VPN users on the project.",
      annotations: READ,
    },
    () => run(glesys.vpn.listUsers()),
  );

  server.registerTool(
    "vpn_create_user",
    {
      description: "Create a VPN user. The username must be unique on the project.",
      inputSchema: {
        username: vpnUsernameSchema,
        password: vpnPasswordSchema,
      },
      annotations: WRITE,
    },
    ({ username, password }) =>
      run(glesys.vpn.createUser({ username: login(username), password })),
  );

  server.registerTool(
    "vpn_edit_user",
    {
      description: "Change a VPN user's password, or enable/disable the user.",
      inputSchema: {
        username: vpnUsernameSchema,
        password: vpnPasswordSchema.optional(),
        enabled: z.boolean().optional(),
      },
      annotations: UPDATE,
    },
    ({ username, ...args }) => run(glesys.vpn.editUser({ ...args, username: login(username) })),
  );

  server.registerTool(
    "vpn_delete_user",
    {
      description: "Delete a VPN user. The user loses access immediately.",
      inputSchema: { username: vpnUsernameSchema },
      annotations: DESTRUCTIVE,
    },
    ({ username }) => run(glesys.vpn.deleteUser({ username: login(username) })),
  );
}
