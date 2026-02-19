import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const API_SERVER_URL = "https://plaid-api-mcp.myplaid.workers.dev/mcp";
const DOCS_SERVER_URL = "https://plaid-docs-mcp.myplaid.workers.dev/mcp";

type PlaidCredentials = {
  clientId: string;
  secret: string;
};

export type MCPClients = {
  apiClient: MCPClient | null;
  docsClient: MCPClient;
};

export async function createPlaidMCPClients(
  credentials: PlaidCredentials | null,
): Promise<MCPClients> {
  const docsClientPromise = createMCPClient({
    transport: new StreamableHTTPClientTransport(new URL(DOCS_SERVER_URL)),
  });

  let apiClientPromise: Promise<MCPClient> | null = null;
  if (credentials) {
    const basicAuth = Buffer.from(
      `${credentials.clientId}:${credentials.secret}`,
    ).toString("base64");

    apiClientPromise = createMCPClient({
      transport: new StreamableHTTPClientTransport(new URL(API_SERVER_URL), {
        requestInit: {
          headers: {
            Authorization: `Basic ${basicAuth}`,
          },
        },
      }),
    });
  }

  const [docsClient, apiClient] = await Promise.all([
    docsClientPromise,
    apiClientPromise,
  ]);

  return { apiClient, docsClient };
}

export async function getPlaidTools(clients: MCPClients) {
  const toolSets = await Promise.all([
    clients.docsClient.tools(),
    clients.apiClient?.tools() ?? Promise.resolve({}),
  ]);

  return { ...toolSets[0], ...toolSets[1] };
}

export async function closeClients(clients: MCPClients) {
  const promises: Promise<void>[] = [clients.docsClient.close()];
  if (clients.apiClient) {
    promises.push(clients.apiClient.close());
  }
  await Promise.allSettled(promises);
}
