import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlaidClient } from "../lib/plaid-client.js";
import type { TokenVault } from "../lib/token-vault.js";
import { formatResponse, resolveItemRef } from "../lib/tool-helpers.js";

export function registerItemTools(
  server: McpServer,
  client: PlaidClient,
  vault: TokenVault,
) {
  server.tool(
    "get_item",
    "Get metadata about a connected Plaid Item (bank connection), including institution info, status, and available products.",
    {
      item_ref: z
        .string()
        .describe("The item reference alias for the Item"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({ item_ref }) => {
      const resolved = await resolveItemRef(vault, item_ref);
      if ("isError" in resolved) return resolved;

      const result = await client.request("/item/get", {
        access_token: resolved.access_token,
      });
      return formatResponse(result);
    },
  );

  server.tool(
    "remove_item",
    "Remove a Plaid Item (bank connection). The access token will be invalidated and the vault entry will be deleted.",
    {
      item_ref: z
        .string()
        .describe("The item reference alias for the Item to remove"),
    },
    {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
    async ({ item_ref }) => {
      const resolved = await resolveItemRef(vault, item_ref);
      if ("isError" in resolved) return resolved;

      const result = await client.request("/item/remove", {
        access_token: resolved.access_token,
      });

      if (!result.error) {
        await vault.delete(item_ref);
      }

      return formatResponse(result);
    },
  );
}
