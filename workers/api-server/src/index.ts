import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PlaidClient } from "./lib/plaid-client.js";
import { TokenVault } from "./lib/token-vault.js";
import type { PlaidEnv } from "@plaid-mcp/shared";
import { registerSandboxTools } from "./tools/sandbox.js";
import { registerLinkTools } from "./tools/link.js";
import { registerItemTools } from "./tools/items.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerTransactionTools } from "./tools/transactions.js";
import { registerAuthTools } from "./tools/auth.js";
import { registerBalanceTools } from "./tools/balance.js";
import { registerIdentityTools } from "./tools/identity.js";
import { registerInvestmentTools } from "./tools/investments.js";
import { registerLiabilityTools } from "./tools/liabilities.js";
import { registerTransferTools } from "./tools/transfer.js";
import { registerVaultTools } from "./tools/vault.js";
import { registerDisclosureTools } from "./tools/disclosure.js";

type PlaidProps = {
  clientId: string;
  secret: string;
};

interface Env {
  PLAID_ENV: string;
  MCP_AGENT: DurableObjectNamespace<PlaidApiMcp>;
}

export class PlaidApiMcp extends McpAgent<Env, unknown, PlaidProps> {
  server = new McpServer({
    name: "plaid-api",
    version: "1.0.0",
  });

  // --- Credential isolation: keep props in-memory only, never in DO storage ---
  // The framework's default onStart/updateProps persist props to ctx.storage
  // for hibernation recovery. We override both so Plaid credentials are never
  // written to disk. This is safe because every Streamable HTTP request carries
  // the Authorization header, so fresh credentials arrive on every request
  // (including hibernation wake).

  async onStart(props: PlaidProps) {
    if (props) this.props = props;
    await this.init();
    const server = await this.server;
    // Complete transport setup via framework internals (underscore-convention,
    // not #-private — accessible at runtime). If the framework renames these,
    // the DO fails to start (loud error, not silent credential leak).
    const self = this as unknown as Record<string, any>;
    self._transport = self.initTransport();
    await server.connect(self._transport);
    await self.reinitializeServer();
  }

  async updateProps(props: PlaidProps) {
    this.props = props;
  }

  async init() {
    const client = new PlaidClient({
      clientId: this.props!.clientId,
      secret: this.props!.secret,
      env: (this.env.PLAID_ENV || "sandbox") as PlaidEnv,
    });

    const vault = new TokenVault(this.ctx.storage);

    registerVaultTools(this.server, vault);
    registerDisclosureTools(this.server, vault);
    registerSandboxTools(this.server, client, vault);
    registerLinkTools(this.server, client, vault);
    registerItemTools(this.server, client, vault);
    registerAccountTools(this.server, client, vault);
    registerTransactionTools(this.server, client, vault);
    registerAuthTools(this.server, client, vault);
    registerBalanceTools(this.server, client, vault);
    registerIdentityTools(this.server, client, vault);
    registerInvestmentTools(this.server, client, vault);
    registerLiabilityTools(this.server, client, vault);
    registerTransferTools(this.server, client, vault);
  }
}

// --- Auth helpers ---

function unauthorized(): Response {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null },
    { status: 401, headers: { "WWW-Authenticate": 'Basic realm="MCP"' } },
  );
}

function parseBasicAuth(request: Request): PlaidProps | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Basic ")) return null;

  const decoded = atob(header.slice(6));
  const colon = decoded.indexOf(":");
  if (colon === -1) return null;

  const clientId = decoded.slice(0, colon);
  const secret = decoded.slice(colon + 1);
  if (!clientId || !secret) return null;

  return { clientId, secret };
}

// --- MCP handler with CORS including Authorization ---

const mcpHandler = PlaidApiMcp.serve("/mcp", {
  binding: "MCP_AGENT",
  corsOptions: {
    headers: "Content-Type, Accept, Authorization, mcp-session-id, mcp-protocol-version",
  },
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return mcpHandler.fetch(request, env, ctx);
    }

    const creds = parseBasicAuth(request);
    if (!creds) return unauthorized();

    Object.assign(ctx, { props: creds });
    return mcpHandler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
