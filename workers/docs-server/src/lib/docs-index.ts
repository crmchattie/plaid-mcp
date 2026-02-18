import { DocEntry, SectionNode } from "@plaid-mcp/shared";

const LLMS_TXT_URL = "https://plaid.com/docs/llms.txt";
const INDEX_KV_KEY = "_index";
const INDEX_TTL = 60 * 60 * 24; // 24 hours

/**
 * Parses llms.txt content into an array of DocEntry objects.
 *
 * Expected format:
 * ### SectionName
 * - [Title](https://plaid.com/docs/path/index.html.md)
 */
export function parseLlmsTxt(content: string): DocEntry[] {
  const entries: DocEntry[] = [];
  let currentSection = "";

  for (const line of content.split("\n")) {
    const sectionMatch = line.match(/^###\s+(.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    const linkMatch = line.match(
      /^-\s+\[([^\]]+)\]\((https:\/\/plaid\.com\/([^)]+)\/index\.html\.md)\)/,
    );
    if (linkMatch) {
      const [, title, url, path] = linkMatch;
      entries.push({ title, url, path, section: currentSection });
    }
  }

  return entries;
}

/**
 * Fetches and caches the doc index from llms.txt.
 */
export async function getDocIndex(kv: KVNamespace): Promise<DocEntry[]> {
  const cached = await kv.get(INDEX_KV_KEY, "json");
  if (cached) return cached as DocEntry[];

  const resp = await fetch(LLMS_TXT_URL);
  if (!resp.ok) throw new Error(`Failed to fetch llms.txt: ${resp.status}`);

  const text = await resp.text();
  const entries = parseLlmsTxt(text);

  await kv.put(INDEX_KV_KEY, JSON.stringify(entries), {
    expirationTtl: INDEX_TTL,
  });

  return entries;
}

/**
 * Simple keyword search over doc entries.
 * Matches against title, section, and path (case-insensitive).
 */
export function searchEntries(
  entries: DocEntry[],
  query: string,
): DocEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return entries
    .map((entry) => {
      const haystack =
        `${entry.title} ${entry.section} ${entry.path}`.toLowerCase();
      const matchCount = terms.filter((t) => haystack.includes(t)).length;
      return { entry, score: matchCount / terms.length };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry);
}

/**
 * Build a section tree from doc entries.
 */
export function buildSectionTree(
  entries: DocEntry[],
  filterSection?: string,
): SectionNode[] {
  const sectionMap = new Map<string, DocEntry[]>();

  for (const entry of entries) {
    if (filterSection && entry.section.toLowerCase() !== filterSection.toLowerCase()) {
      continue;
    }
    const existing = sectionMap.get(entry.section) ?? [];
    existing.push(entry);
    sectionMap.set(entry.section, existing);
  }

  const nodes: SectionNode[] = [];
  for (const [section, sectionEntries] of sectionMap) {
    nodes.push({
      title: section,
      path: section.toLowerCase().replace(/\s+/g, "-"),
      children: sectionEntries.map((e) => ({
        title: e.title,
        path: e.path,
        children: [],
      })),
    });
  }

  return nodes.sort((a, b) => a.title.localeCompare(b.title));
}
