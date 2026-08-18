# glesys-mcp

MCP server for the [Glesys API](https://github.com/glesys/api-docs). Manage your Glesys infrastructure from Claude Code, Claude Desktop, Cursor, VS Code or any other MCP client.

Currently supported:

- Servers (KVM and VMware)
- IP addresses
- Private networks
- DNS (zones, records and domain registration)
- Object storage
- SSH keys
- Managed databases

> Creates cost money. Deletes are permanent. Every tool carries MCP annotations (`readOnlyHint`/`destructiveHint`) so your client can ask before writes. Keep those confirmations on.

## Setup

Requires Node.js 22 or later.

### 1. Install

Clone and install. The install step builds the server:

```sh
git clone https://github.com/glesys/glesys-mcp.git
cd glesys-mcp
npm install
```

The server is now at `dist/index.js`. The configs below reference it by absolute path, so adjust `/path/to/glesys-mcp` to where you cloned it.

### 2. Create an API key

Create an API key for your project in the Glesys Control Panel. API keys are restricted by default:

- **Allowed hosts**: add the public IP of the machine running the MCP server.
- **Allowed functions**: allow the modules you want to use (`server`, `sshkey`, `ip`, `privatenetwork`, `domain`, `objectstorage`, `database`).

If every tool returns a `401` or "not allowed" error, it is one of these two.

### 3. Configure your client

The server reads two environment variables:

- `GLESYS_PROJECT_KEY`: your project key, e.g. `cl12345`
- `GLESYS_API_KEY`: the API key

Never paste the key into a config file. Use environment variable substitution where your client supports it.

**Claude Code**

```sh
claude mcp add glesys --env GLESYS_PROJECT_KEY=cl12345 --env GLESYS_API_KEY=$GLESYS_API_KEY -- node /path/to/glesys-mcp/dist/index.js
```

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

61 tools in seven groups. Each tool maps 1:1 to a Glesys API function (`server_create` calls `POST /server/create`). See the [API documentation](https://github.com/glesys/api-docs/wiki/API-Documentation) for details.

| Group | Tools |
|---|---|
| `server_*` | list, details, create, edit, destroy, start, stop (soft/hard/reboot), templates, listplans, allowedarguments, estimatedcost, previewcloudconfig |
| `sshkey_*` | list, add, remove |
| `ip_*` | list_own, list_free, details, take, release, add_to_server, remove_from_server, set_ptr, reset_ptr, estimated_cost |
| `privatenetwork_*` | list, details, create, edit, delete, list_segments, create_segment, edit_segment, delete_segment, estimated_cost |
| `dns_*` | list_domains, domain_details, add_domain, delete_domain, list_records, add_record, update_record, delete_record, check_availability, pricelist, register_domain, transfer_domain |
| `objectstorage_*` | list_instances, instance_details, create_instance, edit_instance, delete_instance, create_credential, delete_credential |
| `database_*` | list, details, listplans, create, delete, connection_details, update_allowlist |

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
