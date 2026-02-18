import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlaidClient } from "../lib/plaid-client.js";
import type { TokenVault } from "../lib/token-vault.js";
import {
  resolveItemRef,
  formatSensitiveResponse,
  summarizeAccounts,
} from "../lib/tool-helpers.js";

export function registerAccountTools(
  server: McpServer,
  client: PlaidClient,
  vault: TokenVault,
) {
  server.tool(
    "get_accounts",
    "List all accounts associated with a Plaid Item. Returns account names, types, balances, and masks.",
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

      const result = await client.request("/accounts/get", {
        access_token: resolved.access_token,
        options,
      });
      return formatSensitiveResponse(result, summarizeAccounts);
    },
  );
}
