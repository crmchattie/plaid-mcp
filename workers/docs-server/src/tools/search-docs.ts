import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDocIndex, searchEntries } from "../lib/docs-index.js";
import { getDocPage } from "../lib/cache.js";

export function registerSearchDocs(server: McpServer, kv: KVNamespace) {
  server.tool(
    "search_docs",
    "Search Plaid documentation by keyword. Returns matching page titles, URLs, and content snippets.",
    {
      query: z.string().describe("Search query (e.g. 'transactions sync', 'link token')"),
      limit: z.number().optional().default(10).describe("Max number of results (default 10)"),
    },
    async ({ query, limit }) => {
      const entries = await getDocIndex(kv);
      const matches = searchEntries(entries, query).slice(0, limit);

      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No documentation pages found matching "${query}".`,
            },
          ],
        };
      }

      // Fetch snippets for top matches
      const results = await Promise.all(
        matches.map(async (entry) => {
          const page = await getDocPage(kv, entry.url);
          let snippet = "";
          if (page) {
            const queryLower = query.toLowerCase();
            const idx = page.toLowerCase().indexOf(queryLower);
            if (idx !== -1) {
              const start = Math.max(0, idx - 100);
              const end = Math.min(page.length, idx + queryLower.length + 200);
              snippet = (start > 0 ? "..." : "") + page.slice(start, end).trim() + (end < page.length ? "..." : "");
            } else {
              // Show beginning of content as snippet
              snippet = page.slice(0, 300).trim() + "...";
            }
          }
          return `### ${entry.title}\n**URL:** ${entry.url}\n**Section:** ${entry.section}\n\n${snippet}`;
        }),
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${matches.length} result(s) for "${query}":\n\n${results.join("\n\n---\n\n")}`,
          },
        ],
      };
    },
  );
}
