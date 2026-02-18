import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TokenVault } from "../lib/token-vault.js";

export function registerVaultTools(server: McpServer, vault: TokenVault) {
  server.tool(
    "list_items",
    "List all stored item references and their metadata (institution, creation date). Does not reveal access tokens.",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
    async () => {
      const items = await vault.list();
      const entries = Object.entries(items);
      if (entries.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No items stored. Use sandbox_create_public_token or exchange_public_token to add one.",
            },
          ],
        };
      }
      const lines = entries.map(
        ([ref, meta]) =>
          `- ${ref}: institution=${meta.institution_id ?? "unknown"}, item_id=${meta.item_id ?? "unknown"}, created=${meta.created_at}`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Stored items (${entries.length}):\n${lines.join("\n")}`,
          },
        ],
      };
    },
  );

  server.tool(
    "remove_stored_item",
    "Remove an item reference from the local vault. This does NOT revoke the token at Plaid — use remove_item for that.",
    {
      item_ref: z
        .string()
        .describe("The item reference alias to remove from the vault"),
    },
    {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    async ({ item_ref }) => {
      const exists = await vault.has(item_ref);
      if (!exists) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Item ref "${item_ref}" not found in vault.`,
            },
          ],
          isError: true,
        };
      }
      await vault.delete(item_ref);
      return {
        content: [
          {
            type: "text" as const,
            text: `Removed "${item_ref}" from vault.`,
          },
        ],
      };
    },
  );
}
