import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TokenVault } from "../lib/token-vault.js";
import { DEFAULT_DISCLOSURE } from "../lib/token-vault.js";
import type { DisclosureCategory, DisclosureLevel } from "../lib/token-vault.js";

const CATEGORIES = ["transactions", "investments", "liabilities", "identity"] as const;

const CATEGORY_DESCRIPTIONS: Record<typeof CATEGORIES[number], { summary: string; detailed: string }> = {
  transactions: {
    summary: "The assistant can only see transaction counts (e.g. \"5 transactions added\").",
    detailed: "The assistant can now see individual transaction details: merchant names, amounts, dates, and categories.",
  },
  investments: {
    summary: "The assistant can only see investment counts (e.g. \"3 holdings across 1 account\").",
    detailed: "The assistant can now see individual holdings and investment transactions: ticker symbols, quantities, values, and dates.",
  },
  liabilities: {
    summary: "The assistant can only see liability counts (e.g. \"2 credit cards, 1 mortgage\").",
    detailed: "The assistant can now see individual liability details: balances, interest rates, and payment amounts.",
  },
  identity: {
    summary: "The assistant can only see owner counts (e.g. \"2 owners\"). All personal details are hidden.",
    detailed: "The assistant can now see first names only. Addresses, SSNs, phone numbers, and emails remain hidden.",
  },
};

export function registerDisclosureTools(server: McpServer, vault: TokenVault) {
  server.tool(
    "get_disclosure_settings",
    "Show current data disclosure level for each configurable category. Categories set to 'detailed' allow the assistant to see individual records; 'summary' shows only counts and totals.",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
    async () => {
      const prefs = await vault.getDisclosurePreferences();
      const lines = CATEGORIES.map(
        (cat) => `- ${cat}: ${prefs[cat]}`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Disclosure settings:\n${lines.join("\n")}\n\nUse set_disclosure_level to change a category. Categories not listed (auth, accounts, balance) are not configurable.`,
          },
        ],
      };
    },
  );

  server.tool(
    "set_disclosure_level",
    "Change the data disclosure level for a category. 'summary' shows only counts/totals to the assistant; 'detailed' includes individual records (merchant names, amounts, etc). Auth, accounts, and balance are not configurable.",
    {
      category: z
        .enum(CATEGORIES)
        .describe("The data category to configure"),
      level: z
        .enum(["summary", "detailed"] as const)
        .describe("Disclosure level: 'summary' (counts only) or 'detailed' (individual records)"),
    },
    {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    async ({ category, level }: { category: DisclosureCategory; level: DisclosureLevel }) => {
      const prefs = await vault.setDisclosureLevel(category, level);
      const lines = CATEGORIES.map(
        (cat) => `- ${cat}: ${prefs[cat]}`,
      );
      const desc = CATEGORY_DESCRIPTIONS[category][level];
      return {
        content: [
          {
            type: "text" as const,
            text: `Updated ${category} to "${level}".\n\nCurrent settings:\n${lines.join("\n")}`,
            annotations: { audience: ["assistant"] },
          },
          {
            type: "text" as const,
            text: `Disclosure changed: ${category} → ${level}.\n${desc}`,
            annotations: { audience: ["user"] },
          },
        ],
      };
    },
  );
}
