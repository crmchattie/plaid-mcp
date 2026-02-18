const PAGE_TTL = 60 * 60 * 24; // 24 hours

/**
 * Fetches a doc page's Markdown content, using KV as a cache.
 */
export async function getDocPage(
  kv: KVNamespace,
  url: string,
): Promise<string | null> {
  const key = `page:${url}`;

  const cached = await kv.get(key, "text");
  if (cached) return cached;

  const resp = await fetch(url);
  if (!resp.ok) return null;

  const text = await resp.text();
  await kv.put(key, text, { expirationTtl: PAGE_TTL });

  return text;
}
