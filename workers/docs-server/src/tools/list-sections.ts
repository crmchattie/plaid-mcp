import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDocIndex, buildSectionTree } from "../lib/docs-index.js";

export function registerListSections(server: McpServer, kv: KVNamespace) {
  server.tool(
    "list_sections",
    "Browse the Plaid documentation hierarchy. Returns sections and their pages. Optionally filter by section name.",
    {
      section: z
        .string()
        .optional()
        .describe(
          'Optional section filter, e.g. "Auth", "Transactions", "Link"',
        ),
    },
    async ({ section }) => {
      const entries = await getDocIndex(kv);
      const tree = buildSectionTree(entries, section);

      if (tree.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: section
                ? `No section found matching "${section}". Call list_sections without a filter to see all sections.`
                : "No documentation sections found.",
            },
          ],
        };
      }

      const formatted = tree
        .map((node) => {
          const children = node.children
            .map((c) => `  - ${c.title} (${c.path})`)
            .join("\n");
          return `### ${node.title}\n${children}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Documentation sections (${tree.length} section(s)):\n\n${formatted}`,
          },
        ],
      };
    },
  );
}
