import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDocPage } from "../lib/cache.js";

export function registerGetDocPage(server: McpServer, kv: KVNamespace) {
  server.tool(
    "get_doc_page",
    "Retrieve a specific Plaid documentation page as Markdown. Use paths like 'docs/auth', 'docs/link/web', 'docs/api/items'.",
    {
      path: z
        .string()
        .describe(
          'Documentation path, e.g. "docs/auth", "docs/link/web", "docs/api/items"',
        ),
    },
    async ({ path }) => {
      // Normalize path: strip leading slash, ensure it doesn't end with /
      let normalized = path.replace(/^\/+/, "").replace(/\/+$/, "");

      // If path doesn't start with "docs/" or "plaid-exchange/docs/", prepend "docs/"
      if (!normalized.startsWith("docs/") && !normalized.startsWith("plaid-exchange/")) {
        normalized = `docs/${normalized}`;
      }

      const url = `https://plaid.com/${normalized}/index.html.md`;
      const content = await getDocPage(kv, url);

      if (!content) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Page not found at path "${normalized}". Try using search_docs to find the correct path, or list_sections to browse available pages.`,
            },
          ],
        };
      }

      return {
        content: [{ type: "text" as const, text: content }],
      };
    },
  );
}
