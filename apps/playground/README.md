# Plaid MCP Playground

Web-based chat interface for exploring the Plaid API through conversation, powered by [MCP](https://modelcontextprotocol.io/) and Claude.

**[Live Demo →](https://plaid-mcp.vercel.app/)**

## What It Does

This is an interactive playground that connects two MCP servers — one for the Plaid API (25 tools) and one for Plaid documentation search — to a Claude-powered chat interface. Users can:

- Search Plaid docs, API references, and integration guides
- Create sandbox items and test all Plaid API endpoints through conversation
- View rich, structured results (account cards, transaction feeds, masked auth numbers, etc.) instead of raw JSON

Sandbox test credentials are built in — no Plaid account needed to try it.

## Architecture

```
Browser (Next.js)
    ↓ chat messages + optional credentials
  /api/chat (route.ts)
    ↓ creates MCP clients per request
  ┌─────────────────────────────┐
  │  plaid-api-mcp (CF Worker)  │ ← 25 Plaid API tools
  │  plaid-docs-mcp (CF Worker) │ ← 3 docs search tools
  └─────────────────────────────┘
    ↓ tool results with dual-audience annotations
  Claude (Anthropic API)
    ↓ streamed response
  Browser → custom tool renderers
```

Key design decisions:

- **Dual-audience annotations**: The API server sends separate content for the LLM (summarized, masked) and the user (full JSON). The client parses these and routes user-audience data to custom renderers.
- **Token vault**: Access tokens are stored server-side under opaque aliases. The LLM never sees raw tokens.
- **Per-request MCP clients**: Each chat request creates fresh MCP connections, so sessions are fully isolated.

## Stack

- [Next.js 16](https://nextjs.org) with App Router
- [AI SDK](https://ai-sdk.dev) for streaming chat with MCP tool support
- [Anthropic Claude](https://anthropic.com) (Haiku 4.5 default, Sonnet/Opus available)
- [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS
- PostgreSQL (Drizzle ORM) for chat persistence
- NextAuth for authentication (guest access supported)

## Development

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Requires `POSTGRES_URL`, `AUTH_SECRET`, and optionally `PLAID_CLIENT_ID` + `PLAID_SECRET` for built-in sandbox credentials.
