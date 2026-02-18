/**
 * Server-side token vault using Durable Object storage.
 * Keeps access tokens out of LLM context — the LLM only sees opaque item_ref aliases.
 */

export interface VaultEntry {
  access_token: string;
  item_id?: string;
  institution_id?: string;
  created_at: string;
}

// ─── Disclosure preferences ─────────────────────────────────────────────────

export type DisclosureCategory =
  | "transactions"
  | "investments"
  | "liabilities"
  | "identity";

export type DisclosureLevel = "summary" | "detailed";

export type DisclosurePreferences = Record<DisclosureCategory, DisclosureLevel>;

export const DEFAULT_DISCLOSURE: DisclosurePreferences = {
  transactions: "summary",
  investments: "summary",
  liabilities: "summary",
  identity: "summary",
};

const KEY_PREFIX = "vault:token:";
const DISCLOSURE_KEY = "disclosure:preferences";

export class TokenVault {
  constructor(private storage: DurableObjectStorage) {}

  async store(alias: string, entry: VaultEntry): Promise<void> {
    await this.storage.put(`${KEY_PREFIX}${alias}`, entry);
  }

  async resolve(itemRef: string): Promise<string | undefined> {
    const entry = await this.storage.get<VaultEntry>(
      `${KEY_PREFIX}${itemRef}`,
    );
    return entry?.access_token;
  }

  async has(alias: string): Promise<boolean> {
    const entry = await this.storage.get(`${KEY_PREFIX}${alias}`);
    return entry !== undefined;
  }

  async delete(alias: string): Promise<void> {
    await this.storage.delete(`${KEY_PREFIX}${alias}`);
  }

  async list(): Promise<
    Record<string, Omit<VaultEntry, "access_token">>
  > {
    const entries = await this.storage.list<VaultEntry>({
      prefix: KEY_PREFIX,
    });
    const result: Record<string, Omit<VaultEntry, "access_token">> = {};
    for (const [key, entry] of entries) {
      const alias = key.slice(KEY_PREFIX.length);
      const { access_token: _, ...metadata } = entry;
      result[alias] = metadata;
    }
    return result;
  }

  // ─── Disclosure preferences ─────────────────────────────────────────────

  async getDisclosurePreferences(): Promise<DisclosurePreferences> {
    const stored =
      await this.storage.get<Partial<DisclosurePreferences>>(DISCLOSURE_KEY);
    return { ...DEFAULT_DISCLOSURE, ...stored };
  }

  async getDisclosureLevel(
    category: DisclosureCategory,
  ): Promise<DisclosureLevel> {
    const prefs = await this.getDisclosurePreferences();
    return prefs[category];
  }

  async setDisclosureLevel(
    category: DisclosureCategory,
    level: DisclosureLevel,
  ): Promise<DisclosurePreferences> {
    const prefs = await this.getDisclosurePreferences();
    prefs[category] = level;
    await this.storage.put(DISCLOSURE_KEY, prefs);
    return prefs;
  }
}
