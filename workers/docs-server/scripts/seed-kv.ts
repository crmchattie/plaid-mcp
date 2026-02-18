/**
 * Seed KV script: parses llms.txt, fetches each page, and uploads to KV.
 *
 * Usage:
 *   npx tsx scripts/seed-kv.ts
 *
 * Requires wrangler to be configured with the correct KV namespace ID.
 * Uses `wrangler kv key put` to upload each page.
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";

const LLMS_TXT_URL = "https://plaid.com/docs/llms.txt";
const KV_NAMESPACE_BINDING = "DOCS_KV";

interface DocEntry {
  title: string;
  url: string;
  path: string;
}

function parseLlmsTxt(content: string): DocEntry[] {
  const entries: DocEntry[] = [];

  for (const line of content.split("\n")) {
    const linkMatch = line.match(
      /^-\s+\[([^\]]+)\]\((https:\/\/plaid\.com\/([^)]+)\/index\.html\.md)\)/,
    );
    if (linkMatch) {
      const [, title, url, path] = linkMatch;
      entries.push({ title, url, path });
    }
  }

  return entries;
}

async function main() {
  console.log(`Fetching ${LLMS_TXT_URL}...`);
  const llmsResp = await fetch(LLMS_TXT_URL);
  if (!llmsResp.ok) {
    console.error(`Failed to fetch llms.txt (HTTP ${llmsResp.status})`);
    process.exit(1);
  }
  const content = await llmsResp.text();
  const entries = parseLlmsTxt(content);

  console.log(`Found ${entries.length} doc pages to seed.`);

  // Seed the index
  const indexJson = JSON.stringify(entries);
  execSync(
    `wrangler kv key put --remote --binding=${KV_NAMESPACE_BINDING} "_index" '${indexJson.replace(/'/g, "'\\''")}'`,
    { stdio: "inherit" },
  );
  console.log("Seeded _index key.");

  // Seed individual pages (with rate limiting)
  let succeeded = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const resp = await fetch(entry.url);
      if (!resp.ok) {
        console.warn(`  SKIP ${entry.path} (HTTP ${resp.status})`);
        failed++;
        continue;
      }

      const text = await resp.text();
      const kvKey = `page:${entry.url}`;

      // Write to a temp file to avoid shell escaping issues
      const tmpFile = `/tmp/plaid-kv-seed-${Date.now()}.txt`;
      writeFileSync(tmpFile, text);

      execSync(
        `wrangler kv key put --remote --binding=${KV_NAMESPACE_BINDING} "${kvKey}" --path="${tmpFile}"`,
        { stdio: "inherit" },
      );

      unlinkSync(tmpFile);
      succeeded++;
      console.log(`  OK ${entry.path} (${succeeded}/${entries.length})`);

      // Small delay to be kind to Plaid's servers
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.warn(`  FAIL ${entry.path}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone. Succeeded: ${succeeded}, Failed: ${failed}`);
}

main().catch(console.error);
