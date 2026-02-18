import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlaidClient } from "../lib/plaid-client.js";
import type { TokenVault } from "../lib/token-vault.js";
import {
  resolveItemRef,
  formatSensitiveResponse,
  summarizeInvestmentsHoldings,
  summarizeInvestmentsTransactions,
} from "../lib/tool-helpers.js";

export function registerInvestmentTools(
  server: McpServer,
  client: PlaidClient,
  vault: TokenVault,
) {
  server.tool(
    "get_investments_holdings",
    "Get investment holdings (stocks, funds, etc.) for an Item. Requires the 'investments' product.",
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

      const level = await vault.getDisclosureLevel("investments");
      const result = await client.request("/investments/holdings/get", {
        access_token: resolved.access_token,
        options,
      });
      return formatSensitiveResponse(result, summarizeInvestmentsHoldings, level);
    },
  );

  server.tool(
    "get_investments_transactions",
    "Get investment transactions (buys, sells, dividends, etc.) for an Item. Requires the 'investments' product.",
    {
      item_ref: z
        .string()
        .describe("The item reference alias for the Item"),
      start_date: z
        .string()
        .describe("Start date in YYYY-MM-DD format"),
      end_date: z
        .string()
        .describe("End date in YYYY-MM-DD format"),
      options: z
        .object({
          account_ids: z
            .array(z.string())
            .optional()
            .describe("Filter to specific account IDs"),
          count: z
            .number()
            .optional()
            .default(100)
            .describe("Number of transactions (default 100)"),
          offset: z
            .number()
            .optional()
            .default(0)
            .describe("Pagination offset"),
        })
        .optional(),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({ item_ref, start_date, end_date, options }) => {
      const resolved = await resolveItemRef(vault, item_ref);
      if ("isError" in resolved) return resolved;

      const level = await vault.getDisclosureLevel("investments");
      const result = await client.request("/investments/transactions/get", {
        access_token: resolved.access_token,
        start_date,
        end_date,
        options,
      });
      return formatSensitiveResponse(result, summarizeInvestmentsTransactions, level);
    },
  );
}
