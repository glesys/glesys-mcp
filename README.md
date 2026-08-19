# glesys-mcp

MCP server for the [Glesys API](https://github.com/glesys/api-docs). Manage your Glesys infrastructure from Claude Code, Claude Desktop, Cursor, VS Code or any other MCP client.

> Creates cost money. Deletes are permanent. Every tool has MCP annotations (`readOnlyHint`/`destructiveHint`) so your client can ask before writes. Keep those confirmations on.

## Setup

Requires Node.js 22 or later.

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
- **Allowed functions**: allow the modules you want to use (`server`, `serverdisk`, `sshkey`, `ip`, `networkadapter`, `network`, `privatenetwork`, `loadbalancer`, `domain`, `email`, `objectstorage`, `filestorage`, `archive`, `database`, `vpn`).

If every tool returns a `401` or "not allowed" error, it is one of these two.

### 3. Configure your client

The server reads two environment variables:

- `GLESYS_PROJECT_KEY`: your project key, e.g. `cl12345`
- `GLESYS_API_KEY`: the API key

Never paste the key into a config file. Use environment variable substitution where your client supports it.

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

Then ask your client to list your Glesys servers.

## Tools

152 tools in fifteen groups. Each tool maps 1:1 to a Glesys API function (`server_create` calls `POST /server/create`). See the [API documentation](https://github.com/glesys/api-docs/wiki/API-Documentation) for details.

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
| `objectstorage_*` | list_instances, instance_details, create_instance, edit_instance, delete_instance, create_credential, delete_credential |
| `filestorage_*` | list_volumes, volume_details, list_plans, create_volume, edit_volume, resource_usage, delete_volume |
| `archive_*` | list, details, allowedarguments, create, resize, changepassword, changedescription, delete |
| `database_*` | list, details, listplans, create, delete, connection_details, update_allowlist, estimated_cost, create/delete_database, create/delete_user, reset_user_password, set_user_permissions |
| `vpn_*` | list_users, create_user, edit_user, delete_user |

## Development

```sh
npm install
npm run build     # compile to dist/
npm test          # vitest
npm run lint      # eslint
npm run inspect   # open the MCP Inspector against the built server
```

## License

MIT
