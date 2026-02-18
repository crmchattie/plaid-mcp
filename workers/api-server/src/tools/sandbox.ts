import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlaidClient } from "../lib/plaid-client.js";
import type { TokenVault } from "../lib/token-vault.js";
import { formatResponse, resolveItemRef } from "../lib/tool-helpers.js";

export function registerSandboxTools(
  server: McpServer,
  client: PlaidClient,
  vault: TokenVault,
) {
  server.tool(
    "sandbox_create_public_token",
    "Create a sandbox item in one step: creates a public token, exchanges it, and stores the access token in the vault. Returns an opaque item_ref alias.",
    {
      institution_id: z
        .string()
        .default("ins_109508")
        .describe(
          'Sandbox institution ID (default "ins_109508" for First Platypus Bank)',
        ),
      initial_products: z
        .array(z.string())
        .default(["transactions"])
        .describe('Products to enable (default ["transactions"])'),
      options: z
        .object({
          webhook: z.string().optional(),
          override_username: z
            .string()
            .optional()
            .describe('Sandbox username (e.g. "user_good")'),
          override_password: z.string().optional(),
        })
        .optional()
        .describe("Optional sandbox configuration"),
      alias: z
        .string()
        .optional()
        .describe(
          'Friendly name for this item (e.g. "chase-checking"). Auto-generated if omitted.',
        ),
    },
    {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({ institution_id, initial_products, options, alias }) => {
      // Step 1: Create sandbox public token
      const createResult = await client.request<{ public_token: string }>(
        "/sandbox/public_token/create",
        { institution_id, initial_products, options },
      );
      if (createResult.error) return formatResponse(createResult);

      // Step 2: Exchange for access token
      const exchangeResult = await client.request<{
        access_token: string;
        item_id: string;
      }>("/item/public_token/exchange", {
        public_token: createResult.data!.public_token,
      });
      if (exchangeResult.error) return formatResponse(exchangeResult);

      // Step 3: Store in vault
      const data = exchangeResult.data!;
      const itemRef = alias || `item-${data.item_id.slice(0, 8)}`;

      await vault.store(itemRef, {
        access_token: data.access_token,
        item_id: data.item_id,
        institution_id,
        created_at: new Date().toISOString(),
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Sandbox item created and stored. Use item_ref "${itemRef}" for subsequent API calls.\nInstitution: ${institution_id}\nProducts: ${initial_products.join(", ")}`,
          },
        ],
      };
    },
  );

  server.tool(
    "sandbox_reset_login",
    "Force an Item into an error state to test re-authentication flows in sandbox.",
    {
      item_ref: z
        .string()
        .describe("The item reference alias for the Item to reset"),
    },
    {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
    async ({ item_ref }) => {
      const resolved = await resolveItemRef(vault, item_ref);
      if ("isError" in resolved) return resolved;

      const result = await client.request("/sandbox/item/reset_login", {
        access_token: resolved.access_token,
      });
      return formatResponse(result);
    },
  );

  server.tool(
    "sandbox_fire_webhook",
    "Fire a test webhook in sandbox to simulate webhook delivery.",
    {
      item_ref: z
        .string()
        .describe("The item reference alias for the Item"),
      webhook_type: z
        .string()
        .describe('Webhook type (e.g. "TRANSACTIONS")'),
      webhook_code: z
        .string()
        .describe('Webhook code (e.g. "SYNC_UPDATES_AVAILABLE")'),
    },
    {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({ item_ref, webhook_type, webhook_code }) => {
      const resolved = await resolveItemRef(vault, item_ref);
      if ("isError" in resolved) return resolved;

      const result = await client.request("/sandbox/item/fire_webhook", {
        access_token: resolved.access_token,
        webhook_type,
        webhook_code,
      });
      return formatResponse(result);
    },
  );
}
