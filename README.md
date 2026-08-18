# glesys-mcp

MCP server for the [Glesys API](https://github.com/glesys/api-docs). Lets MCP-compatible AI clients (Claude Code, Claude Desktop, Cursor, VS Code, and more) manage your Glesys infrastructure: servers, private networks, DNS, object storage, SSH keys and managed databases.

> **Warning:** these tools operate on a live Glesys project. Create, delete and destroy tools do exactly what they say — they add resources that cost money and remove resources permanently. Every tool carries MCP annotations (`readOnlyHint`/`destructiveHint`) so your client can ask for confirmation — keep those confirmations on.

## Setup

Requires Node.js 22 or later.

### 1. Install

Clone the repository and install — the install step builds the server automatically:

```sh
git clone https://github.com/glesys/glesys-mcp.git
cd glesys-mcp
npm install
```

The server is now at `dist/index.js`. The client configs below reference it by absolute path — adjust `/path/to/glesys-mcp` to where you cloned it.

### 2. Create an API key

In the Glesys Control Panel, create an API key for your project. API keys are restricted by default:

- **Allowed hosts**: add the public IP address of the machine running the MCP server.
- **Allowed functions**: allow the modules you want the AI to use (`server`, `sshkey`, `privatenetwork`, `domain`, `objectstorage`, `database`).

A `401` or "not allowed" error from every tool almost always means one of these two restrictions.

### 3. Configure your client

The server reads two environment variables:

- `GLESYS_PROJECT_KEY` — your project key, e.g. `cl12345`
- `GLESYS_API_KEY` — the API key

Never paste the key into a config file — use environment variable substitution where your client supports it.

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

**Cursor** (`~/.cursor/mcp.json`) — same shape as Claude Desktop.

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

Then try it: ask your AI client to "list my Glesys servers".

## Tools

49 tools across six groups:

| Group | Tools |
|---|---|
| `server_*` | list, details, create, edit, destroy, start, stop (soft/hard/reboot), templates, listplans, allowedarguments |
| `sshkey_*` | list, add, remove |
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
