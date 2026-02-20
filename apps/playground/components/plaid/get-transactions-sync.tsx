"use client";

import { format } from "date-fns";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmountDisplay } from "./shared/amount";

type Transaction = {
  transaction_id: string;
  name: string;
  merchant_name?: string;
  amount: number;
  date: string;
  category?: string[];
  personal_finance_category?: {
    primary?: string;
    detailed?: string;
  };
  iso_currency_code?: string;
  logo_url?: string;
  pending?: boolean;
};

type TransactionsData = {
  added?: Transaction[];
  modified?: Transaction[];
  removed?: { transaction_id: string }[];
  has_more?: boolean;
  next_cursor?: string;
};

const categoryColors: Record<string, string> = {
  FOOD_AND_DRINK: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  SHOPPING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  TRAVEL: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  TRANSFER_IN: "bg-green-500/10 text-green-700 dark:text-green-400",
  TRANSFER_OUT: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  INCOME: "bg-green-500/10 text-green-700 dark:text-green-400",
  RENT_AND_UTILITIES: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  TRANSPORTATION: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  ENTERTAINMENT: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  GENERAL_MERCHANDISE: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  LOAN_PAYMENTS: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function getCategoryBadgeClass(category?: string) {
  if (!category) return "";
  return categoryColors[category] ?? "bg-muted text-muted-foreground";
}

function MerchantAvatar({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string;
}) {
  if (logoUrl) {
    return (
      <img
        alt={name}
        className="size-8 rounded-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove(
            "hidden"
          );
        }}
        src={logoUrl}
      />
    );
  }
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-muted font-medium text-xs uppercase">
      {name.charAt(0)}
    </div>
  );
}

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const txn of transactions) {
    const dateKey = txn.date;
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(txn);
  }
  return Object.entries(groups).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );
}

export function GetTransactionsSyncRenderer({ data }: ToolRendererProps) {
  const parsed = data as TransactionsData | null;
  if (!parsed) {
    return (
      <p className="text-sm text-muted-foreground">No transaction data.</p>
    );
  }

  const added = parsed.added ?? [];
  const modified = parsed.modified ?? [];
  const removed = parsed.removed ?? [];
  const groups = groupByDate(added);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {added.length} added
        </Badge>
        <Badge variant="secondary">
          {modified.length} modified
        </Badge>
        <Badge variant="secondary">
          {removed.length} removed
        </Badge>
      </div>

      {added.length > 0 && (
        <ScrollArea className="max-h-[32rem] pr-3">
          <div className="space-y-4">
            {groups.map(([date, txns]) => (
              <div key={date}>
                <p className="sticky top-0 z-10 bg-background pb-2 text-xs font-medium text-muted-foreground">
                  {formatDate(date)}
                </p>
                <div className="space-y-1">
                  {txns.map((txn) => {
                    const category =
                      txn.personal_finance_category?.primary;
                    return (
                      <div
                        className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                        key={txn.transaction_id}
                      >
                        <MerchantAvatar
                          logoUrl={txn.logo_url}
                          name={txn.merchant_name || txn.name}
                        />
                        <div className="hidden">
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted font-medium text-xs uppercase">
                            {(txn.merchant_name || txn.name).charAt(0)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {txn.merchant_name || txn.name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {category && (
                              <Badge
                                className={`text-[10px] px-1.5 py-0 ${getCategoryBadgeClass(category)}`}
                                variant="secondary"
                              >
                                {category.replace(/_/g, " ").toLowerCase()}
                              </Badge>
                            )}
                            {txn.pending && (
                              <Badge
                                className="text-[10px] px-1.5 py-0"
                                variant="outline"
                              >
                                pending
                              </Badge>
                            )}
                          </div>
                        </div>
                        <AmountDisplay
                          amount={txn.amount}
                          className="shrink-0 text-sm font-medium"
                          currency={txn.iso_currency_code ?? "USD"}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {parsed.has_more && (
        <p className="text-xs text-muted-foreground">
          More transactions available (cursor: {parsed.next_cursor?.slice(0, 20)}...)
        </p>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr + "T00:00:00"), "EEEE, MMM d, yyyy");
  } catch {
    return dateStr;
  }
}
