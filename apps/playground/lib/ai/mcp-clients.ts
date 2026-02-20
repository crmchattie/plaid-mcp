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
  sessionHint?: string,
): Promise<MCPClients> {
  const docsClientPromise = createMCPClient({
    transport: new StreamableHTTPClientTransport(new URL(DOCS_SERVER_URL)),
  });

  let apiClientPromise: Promise<MCPClient> | null = null;
  if (credentials) {
    const basicAuth = Buffer.from(
      `${credentials.clientId}:${credentials.secret}`,
    ).toString("base64");

    const headers: Record<string, string> = {
      Authorization: `Basic ${basicAuth}`,
    };
    if (sessionHint) {
      headers["X-Session-Hint"] = sessionHint;
    }

    apiClientPromise = createMCPClient({
      transport: new StreamableHTTPClientTransport(new URL(API_SERVER_URL), {
        requestInit: { headers },
      }),
    });
  }

  const [docsClient, apiClient] = await Promise.all([
    docsClientPromise,
    apiClientPromise,
  ]);

  return { apiClient, docsClient };
}

// Tools that modify state and should require user confirmation before executing.
const TOOLS_REQUIRING_CONFIRMATION = new Set([
  "create_transfer",
  "remove_item",
  "remove_stored_item",
  "sandbox_fire_webhook",
  "sandbox_reset_login",
]);

/**
 * Custom toModelOutput that filters out audience: ["user"] content blocks
 * so the LLM never sees sensitive data (account numbers, PII, etc.).
 * Only content with audience: ["assistant"] or no audience annotation reaches the model.
 */
function audienceFilteredModelOutput({ output }: { toolCallId: string; input: unknown; output: unknown }) {
  try {
    const result = output as { content?: Array<{ type: string; text?: string; annotations?: { audience?: string[] }; [key: string]: unknown }> };

    if (!result.content || !Array.isArray(result.content)) {
      return { type: "json" as const, value: result as any };
    }

    const filtered = result.content.filter((part) => {
      const audience = part.annotations?.audience;
      // Keep if no audience annotation, or if audience includes "assistant"
      return !audience || audience.includes("assistant");
    });

    // If filtering removed everything, tell the LLM the tool succeeded but
    // results were shown directly to the user (sensitive data).
    if (filtered.length === 0) {
      return {
        type: "content" as const,
        value: [{ type: "text" as const, text: "Tool executed successfully. The results contain sensitive data and have been displayed directly to the user." }],
      };
    }

    const converted = filtered.map((part) => {
      if (part.type === "text" && "text" in part) {
        return { type: "text" as const, text: part.text as string };
      }
      if (part.type === "image" && "data" in part && "mimeType" in part) {
        return { type: "image-data" as const, data: part.data as string, mediaType: part.mimeType as string };
      }
      return { type: "text" as const, text: JSON.stringify(part) };
    });

    return { type: "content" as const, value: converted };
  } catch (e) {
    console.error("[audienceFilteredModelOutput] error, falling back to raw output:", e);
    return { type: "json" as const, value: output as any };
  }
}

export async function getPlaidTools(clients: MCPClients) {
  const toolSets = await Promise.all([
    clients.docsClient.tools(),
    clients.apiClient?.tools() ?? Promise.resolve({}),
  ]);

  const tools: Record<string, any> = { ...toolSets[0], ...toolSets[1] };

  // Patch API tools: filter sensitive content and add confirmation where needed
  for (const [name, tool] of Object.entries(tools)) {
    const patches: Record<string, any> = {};

    // Override toModelOutput to filter out audience: ["user"] blocks
    if (tool.toModelOutput) {
      patches.toModelOutput = audienceFilteredModelOutput;
    }

    // Mark destructive tools as requiring user confirmation
    if (TOOLS_REQUIRING_CONFIRMATION.has(name)) {
      patches.needsApproval = true;
    }

    if (Object.keys(patches).length > 0) {
      tools[name] = { ...tool, ...patches };
    }
  }

  return tools;
}

export async function closeClients(clients: MCPClients) {
  const promises: Promise<void>[] = [clients.docsClient.close()];
  if (clients.apiClient) {
    promises.push(clients.apiClient.close());
  }
  await Promise.allSettled(promises);
}
