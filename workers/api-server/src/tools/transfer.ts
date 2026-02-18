import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlaidClient } from "../lib/plaid-client.js";
import type { TokenVault } from "../lib/token-vault.js";
import { formatResponse, resolveItemRef } from "../lib/tool-helpers.js";

export function registerTransferTools(
  server: McpServer,
  client: PlaidClient,
  vault: TokenVault,
) {
  server.tool(
    "create_transfer",
    "Initiate a bank transfer (ACH or wire). Requires Transfer product setup.",
    {
      item_ref: z
        .string()
        .describe("The item reference alias for the Item"),
      account_id: z
        .string()
        .describe("The account ID to transfer from/to"),
      type: z
        .enum(["debit", "credit"])
        .describe("Transfer type: debit (pull from user) or credit (push to user)"),
      network: z
        .enum(["ach", "same-day-ach", "wire"])
        .describe("Transfer network"),
      amount: z
        .string()
        .describe('Transfer amount as a string (e.g. "100.00")'),
      description: z
        .string()
        .describe("Transfer description (max 15 chars for ACH)"),
      ach_class: z
        .enum(["ppd", "ccd", "web"])
        .optional()
        .default("ppd")
        .describe("ACH class code"),
      user: z
        .object({
          legal_name: z.string().describe("User's legal name"),
        })
        .describe("Transfer user info"),
    },
    {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
    async ({
      item_ref,
      account_id,
      type,
      network,
      amount,
      description,
      ach_class,
      user,
    }) => {
      const resolved = await resolveItemRef(vault, item_ref);
      if ("isError" in resolved) return resolved;

      const result = await client.request("/transfer/create", {
        access_token: resolved.access_token,
        account_id,
        type,
        network,
        amount,
        description,
        ach_class,
        user,
      });
      return formatResponse(result);
    },
  );

  server.tool(
    "get_transfer",
    "Get the status and details of a specific transfer.",
    {
      transfer_id: z.string().describe("The transfer ID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({ transfer_id }) => {
      const result = await client.request("/transfer/get", { transfer_id });
      return formatResponse(result);
    },
  );

  server.tool(
    "list_transfers",
    "List recent transfers with optional filters.",
    {
      start_date: z
        .string()
        .optional()
        .describe("Start date in ISO 8601 format"),
      end_date: z
        .string()
        .optional()
        .describe("End date in ISO 8601 format"),
      count: z
        .number()
        .optional()
        .default(25)
        .describe("Number of transfers (default 25)"),
      offset: z
        .number()
        .optional()
        .default(0)
        .describe("Pagination offset"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    async ({ start_date, end_date, count, offset }) => {
      const result = await client.request("/transfer/list", {
        start_date,
        end_date,
        count,
        offset,
      });
      return formatResponse(result);
    },
  );
}
