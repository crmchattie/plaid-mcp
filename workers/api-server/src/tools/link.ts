import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlaidClient } from "../lib/plaid-client.js";
import type { TokenVault } from "../lib/token-vault.js";
import { formatResponse, resolveItemRef } from "../lib/tool-helpers.js";

export function registerLinkTools(
  server: McpServer,
  client: PlaidClient,
  vault: TokenVault,
) {
  server.tool(
    "create_link_token",
    "Create a Link token to initialize Plaid Link in your app. Required to start the account connection flow.",
    {
      user: z
        .object({
          client_user_id: z.string().describe("Unique identifier for the user"),
        })
        .describe("User information"),
      products: z
        .array(z.string())
        .optional()
        .describe('Products to enable (e.g. ["transactions", "auth"])'),
      country_codes: z
        .array(z.string())
        .default(["US"])
        .describe('Country codes (default ["US"])'),
      language: z.string().default("en").describe("Language code"),
      client_name: z
        .string()
        .default("Plaid MCP")
        .describe("App name shown in Link"),
      redirect_uri: z
        .string()
        .optional()
        .describe("Redirect URI for OAuth flows"),
      webhook: z.string().optional().describe("Webhook URL for updates"),
      hosted_link: z
        .object({
          completion_redirect_uri: z.string().optional(),
          url_lifetime_seconds: z.number().optional(),
        })
        .optional()
        .describe(
          "Include to get a hosted_link_url the user can open in a browser.",
        ),
      item_ref: z
        .string()
        .optional()
        .describe(
          "Item reference for update mode (re-auth). Resolves to access_token from vault.",
        ),
    },
    {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({
      user,
      products,
      country_codes,
      language,
      client_name,
      redirect_uri,
      webhook,
      hosted_link,
      item_ref,
    }) => {
      let access_token: string | undefined;
      if (item_ref) {
        const resolved = await resolveItemRef(vault, item_ref);
        if ("isError" in resolved) return resolved;
        access_token = resolved.access_token;
      }

      const result = await client.request("/link/token/create", {
        user,
        products,
        country_codes,
        language,
        client_name,
        redirect_uri,
        webhook,
        hosted_link,
        access_token,
      });
      return formatResponse(result);
    },
  );

  server.tool(
    "exchange_public_token",
    "Exchange a public token from Plaid Link for a permanent access token. The token is stored securely in the server vault — only an opaque item_ref alias is returned.",
    {
      public_token: z
        .string()
        .describe("The public token from Link's onSuccess callback"),
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
    async ({ public_token, alias }) => {
      const result = await client.request<{
        access_token: string;
        item_id: string;
      }>("/item/public_token/exchange", {
        public_token,
      });

      if (result.error) return formatResponse(result);

      const data = result.data!;
      const itemRef = alias || `item-${data.item_id.slice(0, 8)}`;

      await vault.store(itemRef, {
        access_token: data.access_token,
        item_id: data.item_id,
        created_at: new Date().toISOString(),
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Token exchanged and stored. Use item_ref "${itemRef}" for subsequent API calls.`,
          },
        ],
      };
    },
  );

  server.tool(
    "get_link_session",
    "Check status of a Plaid Link session. Returns public tokens if the user completed the flow. Use with hosted Link to poll for completion.",
    {
      link_token: z
        .string()
        .describe("The link token returned by create_link_token"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({ link_token }) => {
      const result = await client.request("/link/token/get", { link_token });
      return formatResponse(result);
    },
  );
}
