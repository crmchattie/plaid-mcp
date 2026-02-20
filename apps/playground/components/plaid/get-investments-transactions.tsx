"use client";

import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, CoinsIcon } from "lucide-react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Security = {
  security_id: string;
  ticker_symbol?: string;
  name?: string;
};

type InvestmentTransaction = {
  investment_transaction_id: string;
  security_id?: string;
  date: string;
  name: string;
  type: string;
  subtype?: string;
  amount: number;
  quantity: number;
  price: number;
  iso_currency_code?: string;
};

type InvTxnData = {
  investment_transactions?: InvestmentTransaction[];
  securities?: Security[];
};

function fmt(val: number | null | undefined, currency = "USD") {
  if (val == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);
  } catch {
    return `$${val.toFixed(2)}`;
  }
}

const typeIcons: Record<string, { icon: typeof ArrowUpIcon; color: string }> = {
  buy: { icon: ArrowUpIcon, color: "text-green-600" },
  sell: { icon: ArrowDownIcon, color: "text-red-600" },
  dividend: { icon: CoinsIcon, color: "text-amber-600" },
};

export function GetInvestmentsTransactionsRenderer({ data }: ToolRendererProps) {
  const parsed = data as InvTxnData | null;
  const txns = parsed?.investment_transactions;
  if (!txns || txns.length === 0) {
    return <p className="text-sm text-muted-foreground">No investment transactions.</p>;
  }

  const secMap = new Map(
    (parsed?.securities ?? []).map((s) => [s.security_id, s])
  );

  return (
    <ScrollArea className="max-h-[32rem] pr-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">Date</th>
            <th className="pb-2 pr-3 font-medium">Type</th>
            <th className="pb-2 pr-3 font-medium">Security</th>
            <th className="pb-2 pr-3 text-right font-medium">Qty</th>
            <th className="pb-2 pr-3 text-right font-medium">Price</th>
            <th className="pb-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {txns.map((txn) => {
            const sec = txn.security_id
              ? secMap.get(txn.security_id)
              : null;
            const typeConfig = typeIcons[txn.type?.toLowerCase()] ?? {
              icon: ArrowUpIcon,
              color: "text-muted-foreground",
            };
            const TypeIcon = typeConfig.icon;
            return (
              <tr className="border-b last:border-b-0" key={txn.investment_transaction_id}>
                <td className="py-2 pr-3 text-xs text-muted-foreground">
                  {formatDate(txn.date)}
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-1">
                    <TypeIcon className={cn("size-3.5", typeConfig.color)} />
                    <Badge variant="secondary" className="text-[10px]">
                      {txn.subtype || txn.type}
                    </Badge>
                  </div>
                </td>
                <td className="py-2 pr-3 font-medium">
                  {sec?.ticker_symbol ?? txn.name}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {txn.quantity}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {fmt(txn.price, txn.iso_currency_code)}
                </td>
                <td
                  className={cn(
                    "py-2 text-right tabular-nums",
                    txn.amount < 0
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  )}
                >
                  {fmt(txn.amount, txn.iso_currency_code)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollArea>
  );
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr + "T00:00:00"), "MMM d");
  } catch {
    return dateStr;
  }
}
