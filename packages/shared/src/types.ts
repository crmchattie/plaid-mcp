/** Plaid API environment names */
export type PlaidEnv = "sandbox" | "production";

/** Maps Plaid environment names to base URLs */
export const PLAID_BASE_URLS: Record<PlaidEnv, string> = {
  sandbox: "https://sandbox.plaid.com",
  production: "https://production.plaid.com",
};

/** A doc page entry parsed from llms.txt */
export interface DocEntry {
  title: string;
  url: string;
  /** Path relative to plaid.com, e.g. "docs/auth" */
  path: string;
  /** Top-level section, e.g. "Auth", "Transactions" */
  section: string;
}

/** Search result returned by the docs search tool */
export interface DocSearchResult {
  title: string;
  url: string;
  snippet: string;
}

/** Sections tree node for list_sections */
export interface SectionNode {
  title: string;
  path: string;
  children: SectionNode[];
}
