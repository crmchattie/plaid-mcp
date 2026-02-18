import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlaidClient } from "../lib/plaid-client.js";
import type { TokenVault } from "../lib/token-vault.js";
import {
  resolveItemRef,
  formatSensitiveResponse,
  summarizeTransactionsSync,
} from "../lib/tool-helpers.js";

export function registerTransactionTools(
  server: McpServer,
  client: PlaidClient,
  vault: TokenVault,
) {
  server.tool(
    "get_transactions_sync",
    "Get incremental transaction updates using the sync endpoint. Returns added, modified, and removed transactions since the last cursor.",
    {
      item_ref: z
        .string()
        .describe("The item reference alias for the Item"),
      cursor: z
        .string()
        .optional()
        .describe(
          "Cursor from previous sync call. Omit for initial sync to get all transactions.",
        ),
      count: z
        .number()
        .optional()
        .default(100)
        .describe("Number of transactions to return per page (default 100)"),
      options: z
        .object({
          include_personal_finance_category: z
            .boolean()
            .optional()
            .default(true)
            .describe("Include detailed category info"),
        })
        .optional(),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({ item_ref, cursor, count, options }) => {
      const resolved = await resolveItemRef(vault, item_ref);
      if ("isError" in resolved) return resolved;

      const body: Record<string, unknown> = {
        access_token: resolved.access_token,
        count,
        options,
      };
      if (cursor) body.cursor = cursor;

      const level = await vault.getDisclosureLevel("transactions");
      const result = await client.request("/transactions/sync", body);
      return formatSensitiveResponse(result, summarizeTransactionsSync, level);
    },
  );
}
