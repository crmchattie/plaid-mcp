import type { PlaidResponse } from "./plaid-client.js";
import type { TokenVault } from "./token-vault.js";
import type { DisclosureLevel } from "./token-vault.js";

// ─── Basic response formatting ──────────────────────────────────────────────

/**
 * Formats a Plaid API response into MCP tool content.
 */
export function formatResponse(result: PlaidResponse): {
  content: { type: "text"; text: string }[];
} {
  if (result.error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Plaid API Error:\n- Type: ${result.error.error_type}\n- Code: ${result.error.error_code}\n- Message: ${result.error.error_message}\n- Request ID: ${result.request_id ?? "unknown"}`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result.data, null, 2),
      },
    ],
  };
}

// ─── Vault helpers ──────────────────────────────────────────────────────────

/**
 * Resolve an item_ref alias to an access_token, or return an MCP error result.
 */
export async function resolveItemRef(
  vault: TokenVault,
  itemRef: string,
): Promise<
  | { access_token: string }
  | { content: { type: "text"; text: string }[]; isError: true }
> {
  const access_token = await vault.resolve(itemRef);
  if (!access_token) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Unknown item_ref "${itemRef}". Use list_items to see stored references, or exchange_public_token / sandbox_create_public_token to create one.`,
        },
      ],
      isError: true,
    };
  }
  return { access_token };
}

// ─── Dual-audience response ─────────────────────────────────────────────────

interface DualContent {
  type: "text";
  text: string;
  annotations?: { audience?: ("user" | "assistant")[] };
}

/**
 * Returns dual-audience content blocks for sensitive data:
 * - assistant block: safe summary (masked, no PII)
 * - user block: full JSON (shown in client UI, excluded from LLM context)
 */
export function formatSensitiveResponse(
  result: PlaidResponse,
  summarize: (data: Record<string, unknown>, level: DisclosureLevel) => string,
  level: DisclosureLevel = "summary",
): { content: DualContent[] } {
  if (result.error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Plaid API Error:\n- Type: ${result.error.error_type}\n- Code: ${result.error.error_code}\n- Message: ${result.error.error_message}\n- Request ID: ${result.request_id ?? "unknown"}`,
        },
      ],
    };
  }

  const data = result.data!;
  return {
    content: [
      {
        type: "text" as const,
        text: summarize(data, level),
        annotations: { audience: ["assistant"] },
      },
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
        annotations: { audience: ["user"] },
      },
    ],
  };
}

// ─── Summary generators ─────────────────────────────────────────────────────
// Each produces a safe string the LLM can use without seeing raw data.

interface PlaidAccount {
  name?: string;
  type?: string;
  subtype?: string;
  mask?: string;
  account_id?: string;
  balances?: {
    current?: number | null;
    available?: number | null;
    iso_currency_code?: string | null;
  };
  owners?: unknown[];
}

export function summarizeAccounts(data: Record<string, unknown>, _level?: DisclosureLevel): string {
  const accounts = (data.accounts ?? []) as PlaidAccount[];
  const lines = accounts.map(
    (a) => `- ${a.name ?? "Unknown"} (${a.subtype ?? a.type ?? "unknown"}, ****${a.mask ?? "????"})`,
  );
  return `Retrieved ${accounts.length} account(s):\n${lines.join("\n")}`;
}

export function summarizeAuth(data: Record<string, unknown>, _level?: DisclosureLevel): string {
  const accounts = (data.accounts ?? []) as PlaidAccount[];
  const numbers = data.numbers as Record<string, unknown[]> | undefined;
  const achCount = numbers?.ach?.length ?? 0;
  return `Retrieved auth data for ${accounts.length} account(s) (${achCount} ACH routing numbers). Account details redacted.`;
}

export function summarizeBalance(data: Record<string, unknown>, _level?: DisclosureLevel): string {
  const accounts = (data.accounts ?? []) as PlaidAccount[];
  const lines = accounts.map((a) => {
    const cur = a.balances?.current;
    const avail = a.balances?.available;
    const iso = a.balances?.iso_currency_code ?? "USD";
    const curStr = cur != null ? `current=${cur.toFixed(2)} ${iso}` : "current=N/A";
    const availStr = avail != null ? `available=${avail.toFixed(2)} ${iso}` : "available=N/A";
    return `- ${a.name ?? "Unknown"} (****${a.mask ?? "????"}): ${curStr}, ${availStr}`;
  });
  return `Real-time balances for ${accounts.length} account(s):\n${lines.join("\n")}`;
}

export function summarizeIdentity(
  data: Record<string, unknown>,
  level: DisclosureLevel = "summary",
): string {
  const accounts = (data.accounts ?? []) as PlaidAccount[];
  const ownerSet = new Set<string>();
  for (const a of accounts) {
    if (a.owners) {
      for (const o of a.owners as Array<{ names?: string[] }>) {
        for (const n of o.names ?? []) ownerSet.add(n);
      }
    }
  }

  if (level === "detailed") {
    const firstNames = [...ownerSet].map((n) => n.split(" ")[0]);
    const nameList = firstNames.length > 0 ? firstNames.join(", ") : "none";
    return `Retrieved identity info for ${accounts.length} account(s). First names: ${nameList}. Addresses, SSNs, phones, and emails are redacted.`;
  }

  return `Retrieved identity info for ${accounts.length} account(s) with ${ownerSet.size} owner(s). Personal details redacted.`;
}

interface PlaidTransaction {
  merchant_name?: string | null;
  name?: string;
  amount?: number;
  date?: string;
  personal_finance_category?: { primary?: string; detailed?: string };
}

export function summarizeTransactionsSync(
  data: Record<string, unknown>,
  level: DisclosureLevel = "summary",
): string {
  const added = (data.added as PlaidTransaction[] | undefined) ?? [];
  const modified = (data.modified as unknown[] | undefined)?.length ?? 0;
  const removed = (data.removed as unknown[] | undefined)?.length ?? 0;
  const hasMore = data.has_more ? "More pages available." : "No more pages.";

  if (level === "detailed" && added.length > 0) {
    const lines = added.map((t) => {
      const merchant = t.merchant_name ?? t.name ?? "Unknown";
      const amt = t.amount != null ? `$${Math.abs(t.amount).toFixed(2)}` : "N/A";
      const date = t.date ?? "N/A";
      const cat = t.personal_finance_category?.primary ?? "uncategorized";
      return `- ${date} | ${merchant} | ${amt} | ${cat}`;
    });
    return `Transaction sync: ${added.length} added, ${modified} modified, ${removed} removed. ${hasMore}\n${lines.join("\n")}`;
  }

  return `Transaction sync: ${added.length} added, ${modified} modified, ${removed} removed. ${hasMore}`;
}

interface PlaidHolding {
  security_id?: string;
  quantity?: number;
  institution_value?: number;
  iso_currency_code?: string;
}

interface PlaidSecurity {
  security_id?: string;
  ticker_symbol?: string | null;
  name?: string | null;
}

export function summarizeInvestmentsHoldings(
  data: Record<string, unknown>,
  level: DisclosureLevel = "summary",
): string {
  const holdings = (data.holdings as PlaidHolding[] | undefined) ?? [];
  const accounts = (data.accounts as unknown[] | undefined)?.length ?? 0;
  const securities = (data.securities as PlaidSecurity[] | undefined) ?? [];

  if (level === "detailed" && holdings.length > 0) {
    const secMap = new Map(securities.map((s) => [s.security_id, s]));
    const lines = holdings.map((h) => {
      const sec = secMap.get(h.security_id);
      const ticker = sec?.ticker_symbol ?? sec?.name ?? "Unknown";
      const qty = h.quantity != null ? h.quantity.toString() : "N/A";
      const val = h.institution_value != null ? `$${h.institution_value.toFixed(2)}` : "N/A";
      return `- ${ticker}: ${qty} shares, value ${val}`;
    });
    return `Retrieved ${holdings.length} investment holding(s) across ${accounts} account(s):\n${lines.join("\n")}`;
  }

  return `Retrieved ${holdings.length} investment holding(s) across ${accounts} account(s) covering ${securities.length} securities.`;
}

interface PlaidInvestmentTransaction {
  name?: string;
  amount?: number;
  date?: string;
  type?: string;
  subtype?: string;
}

export function summarizeInvestmentsTransactions(
  data: Record<string, unknown>,
  level: DisclosureLevel = "summary",
): string {
  const txns = (data.investment_transactions as PlaidInvestmentTransaction[] | undefined) ?? [];
  const accounts = (data.accounts as unknown[] | undefined)?.length ?? 0;
  const total = (data.total_investment_transactions as number | undefined) ?? txns.length;

  if (level === "detailed" && txns.length > 0) {
    const lines = txns.map((t) => {
      const name = t.name ?? "Unknown";
      const amt = t.amount != null ? `$${Math.abs(t.amount).toFixed(2)}` : "N/A";
      const date = t.date ?? "N/A";
      const type = t.subtype ?? t.type ?? "unknown";
      return `- ${date} | ${name} | ${amt} | ${type}`;
    });
    return `Retrieved ${txns.length} investment transaction(s) across ${accounts} account(s) (${total} total available):\n${lines.join("\n")}`;
  }

  return `Retrieved ${txns.length} investment transaction(s) across ${accounts} account(s) (${total} total available).`;
}

interface PlaidCreditLiability {
  account_id?: string;
  last_statement_balance?: number;
  minimum_payment_amount?: number;
  aprs?: Array<{ apr_percentage?: number; apr_type?: string }>;
}

interface PlaidStudentLiability {
  account_id?: string;
  outstanding_interest_amount?: number;
  last_payment_amount?: number;
  interest_rate_percentage?: number;
  loan_name?: string;
}

interface PlaidMortgageLiability {
  account_id?: string;
  current_late_fee?: number;
  last_payment_amount?: number;
  interest_rate_percentage?: number;
  loan_type_description?: string;
}

export function summarizeLiabilities(
  data: Record<string, unknown>,
  level: DisclosureLevel = "summary",
): string {
  const liabilities = data.liabilities as Record<string, unknown[]> | undefined;
  const parts: string[] = [];
  if (liabilities?.credit) parts.push(`${liabilities.credit.length} credit card(s)`);
  if (liabilities?.student) parts.push(`${liabilities.student.length} student loan(s)`);
  if (liabilities?.mortgage) parts.push(`${liabilities.mortgage.length} mortgage(s)`);
  if (parts.length === 0) return "Retrieved liabilities: none found.";

  if (level === "detailed") {
    const lines: string[] = [];
    for (const c of (liabilities?.credit ?? []) as PlaidCreditLiability[]) {
      const bal = c.last_statement_balance != null ? `$${c.last_statement_balance.toFixed(2)}` : "N/A";
      const minPay = c.minimum_payment_amount != null ? `$${c.minimum_payment_amount.toFixed(2)}` : "N/A";
      const apr = c.aprs?.[0]?.apr_percentage != null ? `${c.aprs[0].apr_percentage}%` : "N/A";
      lines.push(`- Credit: balance ${bal}, min payment ${minPay}, APR ${apr}`);
    }
    for (const s of (liabilities?.student ?? []) as PlaidStudentLiability[]) {
      const name = s.loan_name ?? "Student loan";
      const rate = s.interest_rate_percentage != null ? `${s.interest_rate_percentage}%` : "N/A";
      const lastPay = s.last_payment_amount != null ? `$${s.last_payment_amount.toFixed(2)}` : "N/A";
      lines.push(`- ${name}: rate ${rate}, last payment ${lastPay}`);
    }
    for (const m of (liabilities?.mortgage ?? []) as PlaidMortgageLiability[]) {
      const type = m.loan_type_description ?? "Mortgage";
      const rate = m.interest_rate_percentage != null ? `${m.interest_rate_percentage}%` : "N/A";
      const lastPay = m.last_payment_amount != null ? `$${m.last_payment_amount.toFixed(2)}` : "N/A";
      lines.push(`- ${type}: rate ${rate}, last payment ${lastPay}`);
    }
    return `Retrieved liabilities: ${parts.join(", ")}.\n${lines.join("\n")}`;
  }

  return `Retrieved liabilities: ${parts.join(", ")}.`;
}
