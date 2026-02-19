# plaid-mcp

[MCP](https://modelcontextprotocol.io/) servers for the [Plaid API](https://plaid.com/docs/), running on Cloudflare Workers.

**[Try the live demo →](https://plaid-mcp.vercel.app/)** — no credentials needed, sandbox test accounts included.

Two servers:

- **api-server** — Multi-tenant Plaid API gateway. Each client authenticates with their own Plaid `client_id` and `secret` via Basic Auth and gets an isolated session with its own token vault.
- **docs-server** — Plaid documentation search and retrieval. No authentication required.

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

MCP server for searching and reading Plaid documentation, backed by KV-stored `llms.txt` content. No authentication required. Deployed at:

```
https://plaid-docs-mcp.myplaid.workers.dev/mcp
```

**Tools:** `search_docs`, `get_doc_page`, `list_sections`

## Authentication (api-server)

Every request (except CORS preflight) requires an `Authorization: Basic <base64(client_id:secret)>` header. The server does not validate credentials itself — if they're wrong, Plaid API calls fail with Plaid's own error messages. The docs-server requires no authentication.

Credentials are kept **in-memory only**. The framework's default prop persistence to Durable Object storage is overridden so that Plaid secrets are never written to disk. Fresh credentials arrive on every request via the Authorization header.

## Client Configuration

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "plaid-api": {
      "url": "https://plaid-api-mcp.myplaid.workers.dev/mcp",
      "headers": {
        "Authorization": "Basic <base64(client_id:secret)>"
      }
    },
    "plaid-docs": {
      "url": "https://plaid-docs-mcp.myplaid.workers.dev/mcp"
    }
  }
}
```

### MCP SDK (TypeScript)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// API server (requires Plaid credentials)
const apiTransport = new StreamableHTTPClientTransport(
  new URL("https://plaid-api-mcp.myplaid.workers.dev/mcp"),
  {
    requestInit: {
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      },
    },
  },
);

const apiClient = new Client({ name: "my-agent", version: "1.0" });
await apiClient.connect(apiTransport);

// Docs server (no auth required)
const docsTransport = new StreamableHTTPClientTransport(
  new URL("https://plaid-docs-mcp.myplaid.workers.dev/mcp"),
);

const docsClient = new Client({ name: "my-agent", version: "1.0" });
await docsClient.connect(docsTransport);
```

### MCP SDK (Python)

```python
from base64 import b64encode
from mcp.client.streamable_http import streamablehttp_client
from mcp import ClientSession

credentials = b64encode(f"{client_id}:{secret}".encode()).decode()

# API server (requires Plaid credentials)
async with streamablehttp_client(
    "https://plaid-api-mcp.myplaid.workers.dev/mcp",
    headers={"Authorization": f"Basic {credentials}"},
) as (read, write, _):
    async with ClientSession(read, write) as session:
        await session.initialize()

# Docs server (no auth required)
async with streamablehttp_client(
    "https://plaid-docs-mcp.myplaid.workers.dev/mcp",
) as (read, write, _):
    async with ClientSession(read, write) as session:
        await session.initialize()
```

## Session Isolation

Each MCP session gets its own Durable Object instance (keyed by session ID):

- **Credentials** — per-session `PlaidClient` using that user's `client_id`/`secret`, held in memory only
- **Token vault** — per-session DO storage for access tokens. The LLM only sees opaque `item_ref` aliases, never raw access tokens
- **Disclosure preferences** — per-session controls over data detail levels (summary vs. detailed)

No cross-tenant data leakage is possible — DO storage is per-instance.

## Security Model

The API server handles real financial credentials and data across multiple tenants. The security design follows defense-in-depth: multiple independent layers must all fail for sensitive data to leak.

### 1. Session Isolation via Durable Objects

Each MCP session maps to its own [Cloudflare Durable Object](https://developers.cloudflare.com/durable-objects/) instance, keyed by `mcp-session-id`. Every session gets:

- Its own `PlaidClient` with that user's credentials
- Its own `TokenVault` in isolated DO storage
- Its own disclosure preferences

There is no shared state between sessions. Durable Object storage is per-instance by design — one session cannot read another's vault or credentials.

### 2. Credentials Never Written to Disk

The MCP framework (`McpAgent`) normally persists `props` to `ctx.storage` so Durable Objects can recover from hibernation. The API server **overrides both `onStart()` and `updateProps()`** to keep credentials in memory only:

```typescript
// workers/api-server/src/index.ts
async onStart(props: PlaidProps) {
  if (props) this.props = props;   // in-memory only
  // ... framework wiring without storage.put()
}

async updateProps(props: PlaidProps) {
  this.props = props;              // in-memory only, no persistence
}
```

If the DO hibernates, the next HTTP request carries fresh credentials in the `Authorization` header, so the session recovers without needing stored secrets.

### 3. Token Vault — Opaque Aliases

When a public token is exchanged for an access token, the raw token is stored in the vault under an opaque alias (e.g., `"item-a1b2c3d4"`). The LLM only ever sees and references these aliases.

Key design decisions in `TokenVault`:

- **`store(alias, entry)`** — saves the full `VaultEntry` (including `access_token`) to DO storage
- **`resolve(alias)`** — returns only the `access_token` string, used server-side by tools to make Plaid API calls
- **`list()`** — returns metadata **with `access_token` explicitly stripped**:

```typescript
// workers/api-server/src/lib/token-vault.ts
async list(): Promise<Record<string, Omit<VaultEntry, "access_token">>> {
  const entries = await this.storage.list<VaultEntry>({ prefix: KEY_PREFIX });
  const result: Record<string, Omit<VaultEntry, "access_token">> = {};
  for (const [key, entry] of entries) {
    const alias = key.slice(KEY_PREFIX.length);
    const { access_token: _, ...metadata } = entry;  // strip token
    result[alias] = metadata;
  }
  return result;
}
```

The LLM can ask "what items do I have?" and gets back aliases and metadata, but never a raw token.

### 4. Dual-Audience Response Filtering

Plaid API responses contain financial data that the LLM doesn't always need to see in full. The server uses [MCP annotations](https://modelcontextprotocol.io/specification/2025-06-18/server/utilities/annotations) to send different content to the LLM vs. the end user:

```typescript
// workers/api-server/src/lib/tool-helpers.ts
return {
  content: [
    {
      type: "text",
      text: summarize(data, level),          // safe summary
      annotations: { audience: ["assistant"] },
    },
    {
      type: "text",
      text: JSON.stringify(data, null, 2),   // full response
      annotations: { audience: ["user"] },
    },
  ],
};
```

- **`audience: ["assistant"]`** — the LLM sees a summarized version with masked account numbers, redacted PII, and aggregated counts
- **`audience: ["user"]`** — the client UI receives the full JSON response for display

This means the LLM can reason about the data ("you have 3 checking accounts") without processing raw account numbers, SSNs, or routing numbers.

### 5. Per-Category Data Summarization

Each data category has its own summary function that controls what the LLM sees:

| Category | LLM Sees (Summary) | LLM Sees (Detailed) | Always Hidden from LLM |
|---|---|---|---|
| **Accounts** | Count, names, masked numbers (`****1234`) | Same | Full account numbers |
| **Auth** | Account count, ACH count | Same | Routing numbers, account numbers |
| **Balance** | Account names, current/available balances | Same | Full account numbers |
| **Identity** | Owner count | First names only | Full names, SSNs, addresses, phones, emails |
| **Transactions** | Counts (added/modified/removed) | Date, merchant, amount, category | Full descriptions (in summary mode) |
| **Investments** | Holding/security counts | Ticker, quantity, value | Cost basis, security IDs |
| **Liabilities** | Type counts (credit/student/mortgage) | Balances, APR, min payments | Creditor details, account numbers |

### 6. User-Controlled Disclosure Levels

Users can control how much detail the LLM sees per category via two tools:

- **`get_disclosure_settings`** — shows current levels
- **`set_disclosure_level`** — changes a category between `"summary"` and `"detailed"`

Defaults to `"summary"` for all configurable categories (transactions, investments, liabilities, identity). Auth, accounts, and balance are not configurable — they always use their fixed summary format.

This gives users explicit control: "I want the LLM to see my transaction details so it can help me budget" vs. "just tell me the count."

### 7. Input Validation

All tool parameters are validated with Zod schemas before execution. Enum types restrict values to valid options (e.g., transfer networks to `ach | same-day-ach | wire`). The MCP framework rejects malformed inputs before they reach tool handlers.

### Summary

| Layer | What It Protects | Mechanism |
|---|---|---|
| Durable Object isolation | Cross-tenant data access | Separate DO instance per session |
| In-memory credentials | Plaid secrets at rest | Override persistence, re-auth on wake |
| Token vault aliases | Access tokens from LLM | Opaque refs, `list()` strips tokens |
| Dual-audience annotations | Full API responses from LLM | MCP `audience` annotations |
| Category summarization | PII, account numbers, SSNs | Per-category `summarize()` functions |
| Disclosure preferences | Granular data exposure | User-controlled summary vs. detailed |
| Zod validation | Malformed/injected inputs | Schema validation on all parameters |

## Project Structure

```
plaid-mcp/
  packages/shared/       # Shared types (PlaidEnv, DocEntry, etc.)
  workers/api-server/    # Plaid API MCP server (Cloudflare Worker)
  workers/docs-server/   # Plaid docs MCP server (Cloudflare Worker)
  apps/playground/       # Web playground (Next.js) — chat UI with MCP tools
```

pnpm monorepo. Workers deploy to Cloudflare, playground deploys to Vercel.

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
