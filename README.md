# plaid-mcp

Multi-tenant [MCP](https://modelcontextprotocol.io/) servers for the [Plaid API](https://plaid.com/docs/), running on Cloudflare Workers.

Each MCP client authenticates with their own Plaid `client_id` and `secret` via HTTP Basic Auth. The server acts as a stateful MCP gateway — each session gets an isolated Durable Object with its own token vault and Plaid credentials.

## Servers

### api-server

Streamable HTTP MCP server exposing Plaid API operations as tools. Deployed at:

```
https://plaid-api-mcp.myplaid.workers.dev/mcp
```

**25 tools** across these categories:

| Category | Tools |
|---|---|
| Link | `create_link_token`, `exchange_public_token` |
| Sandbox | `sandbox_create_public_token`, `sandbox_reset_login`, `sandbox_fire_webhook` |
| Items | `get_item`, `remove_item` |
| Accounts | `get_accounts` |
| Auth | `get_auth` |
| Transactions | `get_transactions_sync` |
| Balance | `get_balance` |
| Identity | `get_identity` |
| Investments | `get_investments_holdings`, `get_investments_transactions` |
| Liabilities | `get_liabilities` |
| Transfers | `create_transfer`, `get_transfer`, `list_transfers` |
| Vault | `list_items`, `remove_stored_item` |
| Disclosure | `get_disclosure_settings`, `set_disclosure_level` |

### docs-server

MCP server for searching and reading Plaid documentation, backed by KV-stored `llms.txt` content.

**Tools:** `search_docs`, `get_doc_page`, `list_sections`

## Authentication

Every request (except CORS preflight) requires an `Authorization: Basic <base64(client_id:secret)>` header. The server does not validate credentials itself — if they're wrong, Plaid API calls fail with Plaid's own error messages.

Credentials are kept **in-memory only**. The framework's default prop persistence to Durable Object storage is overridden so that Plaid secrets are never written to disk. Fresh credentials arrive on every request via the Authorization header.

## Client Configuration

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "plaid": {
      "url": "https://plaid-api-mcp.myplaid.workers.dev/mcp",
      "headers": {
        "Authorization": "Basic <base64(client_id:secret)>"
      }
    }
  }
}
```

### MCP SDK (TypeScript)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://plaid-api-mcp.myplaid.workers.dev/mcp"),
  {
    requestInit: {
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      },
    },
  },
);

const client = new Client({ name: "my-agent", version: "1.0" });
await client.connect(transport);
```

## Session Isolation

Each MCP session gets its own Durable Object instance (keyed by session ID):

- **Credentials** — per-session `PlaidClient` using that user's `client_id`/`secret`, held in memory only
- **Token vault** — per-session DO storage for access tokens. The LLM only sees opaque `item_ref` aliases, never raw access tokens
- **Disclosure preferences** — per-session controls over data detail levels (summary vs. detailed)

No cross-tenant data leakage is possible — DO storage is per-instance.

## Project Structure

```
plaid-mcp/
  packages/shared/       # Shared types (PlaidEnv, DocEntry, etc.)
  workers/api-server/    # Plaid API MCP server
  workers/docs-server/   # Plaid docs MCP server
```

pnpm monorepo with Cloudflare Workers.

## Development

```bash
pnpm install

# Run locally
pnpm dev:api
pnpm dev:docs

# Type check
pnpm typecheck

# Deploy
pnpm deploy:api
pnpm deploy:docs
```

## Verification

```bash
# No credentials -> 401
curl -s -X POST https://plaid-api-mcp.myplaid.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'

# With credentials -> MCP initialize response
curl -s -X POST https://plaid-api-mcp.myplaid.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Basic $(echo -n '<client_id>:<secret>' | base64)" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'
```
