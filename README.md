# glesys-mcp

[![CI](https://github.com/glesys/glesys-mcp/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/glesys/glesys-mcp/actions/workflows/ci.yml?query=branch%3Amain)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](vitest.config.ts)
[![License](https://img.shields.io/github/license/glesys/glesys-mcp.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-beta-orange)

MCP server for the [Glesys API](https://github.com/glesys/api-docs). Manage your Glesys infrastructure from Claude Code, Claude Desktop, Cursor, VS Code or any other MCP client.

glesys-mcp is in beta. Tool names, arguments and behavior may change until 1.0.

## Examples

Once connected, you talk to your client in plain language and it picks the right tools:

- "We just hit the front page of Hacker News. Double web01's CPU and memory, and tell me what the panic costs per month."
- "I'm demoing in an hour. Postgres with an app user, a Debian server in Falkenberg allowlisted to reach it, and the connection string in my hand."
- "New project, new domain. Register example-app.se if it's available, create a small Ubuntu server in Falkenberg, and point the domain at the server's IP."
- "web01 is on fire. Pull it out of the load balancer, hard reset it, and don't put it back until it responds."
- "Someone deleted DNS records for the docs site. Check the zone, tell me what's missing, and put it back."
- "Set up the whole stack for the new app: two web servers in Stockholm, a file storage volume both can mount, a MySQL they're allowed to reach, and a load balancer in front with both servers as targets."
- "Every IP we own should have a PTR record matching its server's hostname. Find the ones that don't and fix them."
- "The new developer starts Monday. VPN user, SSH key on the staging servers."
- "Give me a server that's ready when it boots: Debian, a deploy user with my SSH key, and Docker installed via cloud-init. Show me the cloud-config before creating anything."
- "Is it us or is it Glesys? Check the status page, and if Glesys looks fine, pull the load balancer error log."

Reads run directly. Writes are annotated, so your client asks first.

## Setup

Requires Node.js `^24.15.0 || >=26.0.0` and npm 12 or later.

### 1. Install

The install step builds the server:

```sh
git clone https://github.com/glesys/glesys-mcp.git
cd glesys-mcp
npm install
```

The server is now at `dist/index.js`. The configs below reference it by absolute path, so adjust `/path/to/glesys-mcp` to where you cloned it.

### 2. Create an API key

Create an API key for your project in the Glesys Control Panel. New keys start fully restricted:

- **Allowed hosts**: add the public IP of the machine running the MCP server.
- **Allowed functions**: allow the modules you want to use (`server`, `serverdisk`, `sshkey`, `ip`, `networkadapter`, `network`, `privatenetwork`, `loadbalancer`, `domain`, `email`, `objectstorage`, `filestorage`, `blockstorage`, `archive`, `database`, `vpn`, `colocationrack`, `remotehands`, `shipment`).

If every tool returns a `401` or "not allowed" error, it is one of these two.

### 3. Configure your client

The server reads two environment variables, plus an optional third:

- `GLESYS_PROJECT_KEY`: your project key, e.g. `cl12345`
- `GLESYS_API_KEY`: the API key
- `GLESYS_ENABLE_DESTRUCTIVE`: set to `true` to register the destructive tools (delete/destroy/remove/release). Without it they do not exist as far as the client is concerned, which protects you even if your client skips confirmations. To enable them later, add the variable to the `env` block in your client config and restart the client (for Claude Code, re-run `claude mcp add` with the extra `--env`).

Keep the key itself out of config files: export it in your shell and let the client resolve it through environment variable substitution, as in the examples below.

**Claude Code**

```sh
claude mcp add glesys --scope user --env GLESYS_PROJECT_KEY=cl12345 --env GLESYS_API_KEY=$GLESYS_API_KEY -- node /path/to/glesys-mcp/dist/index.js
```

`--scope user` makes the server available in all your projects. Without it, the server is only registered in the current directory. There is also `--scope project`, which shares the server with everyone in a repository via a committed `.mcp.json`. Keep the credentials as environment variable references there.

**Claude Desktop** (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "glesys": {
      "command": "node",
      "args": ["/path/to/glesys-mcp/dist/index.js"],
      "env": {
        "GLESYS_PROJECT_KEY": "cl12345",
        "GLESYS_API_KEY": "${GLESYS_API_KEY}"
      }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`) uses the same shape as Claude Desktop.

**VS Code** (`.vscode/mcp.json`)

```json
{
  "servers": {
    "glesys": {
      "command": "node",
      "args": ["/path/to/glesys-mcp/dist/index.js"],
      "env": {
        "GLESYS_PROJECT_KEY": "cl12345",
        "GLESYS_API_KEY": "${env:GLESYS_API_KEY}"
      }
    }
  }
}
```

## Tools

163 tools in nineteen groups. Each tool maps 1:1 to a Glesys API function (`server_create` calls `POST /server/create`). See the [API documentation](https://github.com/glesys/api-docs/wiki/API-Documentation) for details.

Every tool has MCP annotations (`readOnlyHint`/`destructiveHint`) so your client can ask before writes. Destructive tools are off by default; `GLESYS_ENABLE_DESTRUCTIVE` in the setup section enables them.

| Group | Tools |
|---|---|
| `server_*` | list, details, status, resourceusage, costs, create, edit, destroy, start, stop (soft/hard/reboot), reset, templates, listplans, allowedarguments, estimatedcost, previewcloudconfig, networkadapters, backup, estimated_backup_cost, list_backups, create/delete_manual_backup, create_from_backup |
| `serverdisk_*` | limits, estimatedcost, create, reconfigure, updatename, delete |
| `sshkey_*` | list, add, remove |
| `ip_*` | list_own, list_free, details, take, release, add_to_server, remove_from_server, set_ptr, reset_ptr, estimated_cost |
| `networkadapter_*` | create, details, edit, delete |
| `network_*` | list, details, create, edit, delete |
| `privatenetwork_*` | list, details, create, edit, delete, list_segments, create_segment, edit_segment, delete_segment, estimated_cost |
| `loadbalancer_*` | list, details, create, edit, destroy, add/edit/remove_backend, add/edit/enable/disable/remove_target, add/edit/remove_frontend, list/add/remove_certificate(s), errors, add_to/remove_from_blocklist |
| `dns_*` | list_domains, domain_details, add_domain, edit_domain, delete_domain, export_zone, list_records, add_record, update_record, delete_record, check_availability, pricelist, allowedarguments, register_domain, transfer_domain, renew_domain, set_autorenew, change_nameservers, generate_auth_code |
| `email_*` | overview, list, quota, costs, createaccount, editaccount, resetpassword, createalias, editalias, delete |
| `objectstorage_*` | list_instances, instance_details, create_instance, edit_instance, delete_instance, create_credential, delete_credential, estimated_cost, costs |
| `filestorage_*` | list_volumes, volume_details, list_plans, create_volume, edit_volume, resource_usage, delete_volume |
| `blockstorage_*` | list_volumes, volume_details, list_tiers, create_volume, edit_volume, resize_volume, attach_volume, detach_volume, delete_volume |
| `archive_*` | list, details, allowedarguments, create, resize, changepassword, changedescription, delete |
| `database_*` | list, details, listplans, create, delete, connection_details, update_allowlist, estimated_cost, create/delete_database, create/delete_user, reset_user_password, set_user_permissions |
| `vpn_*` | list_users, create_user, edit_user, delete_user |
| `colocationrack_*` | list |
| `remotehands_*` | list, create, cancel |
| `shipment_*` | list, create, edit, cancel |
| `glesys_*` | status |
