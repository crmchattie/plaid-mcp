import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlaidClient } from "../lib/plaid-client.js";
import type { TokenVault } from "../lib/token-vault.js";
import {
  resolveItemRef,
  formatSensitiveResponse,
  summarizeAuth,
} from "../lib/tool-helpers.js";

export function registerAuthTools(
  server: McpServer,
  client: PlaidClient,
  vault: TokenVault,
) {
  server.tool(
    "get_auth",
    "Get bank account and routing numbers for ACH payments. Requires the 'auth' product.",
    {
      item_ref: z
        .string()
        .describe("The item reference alias for the Item"),
      options: z
        .object({
          account_ids: z
            .array(z.string())
            .optional()
            .describe("Filter to specific account IDs"),
        })
        .optional(),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({ item_ref, options }) => {
      const resolved = await resolveItemRef(vault, item_ref);
      if ("isError" in resolved) return resolved;

      const result = await client.request("/auth/get", {
        access_token: resolved.access_token,
        options,
      });
      return formatSensitiveResponse(result, summarizeAuth);
    },
  );
}
