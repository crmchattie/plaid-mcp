"use client";

import { format } from "date-fns";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Transfer = {
  id: string;
  amount: string;
  type: string;
  network?: string;
  status: string;
  created: string;
  iso_currency_code?: string;
};

type ListTransfersData = {
  transfers?: Transfer[];
};

function fmt(val: string | undefined, currency = "USD") {
  if (!val) return "—";
  const num = parseFloat(val);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

const statusColors: Record<string, string> = {
  posted: "bg-green-500/10 text-green-700",
  pending: "bg-amber-500/10 text-amber-700",
  failed: "bg-red-500/10 text-red-700",
  cancelled: "bg-zinc-500/10 text-zinc-700",
};

export function ListTransfersRenderer({ data }: ToolRendererProps) {
  const parsed = data as ListTransfersData | null;
  const transfers = parsed?.transfers;
  if (!transfers || transfers.length === 0) {
    return <p className="text-sm text-muted-foreground">No transfers found.</p>;
  }

  return (
    <ScrollArea className="max-h-[32rem] pr-0 sm:pr-3">
      <div className="overflow-x-auto">
      <table className="min-w-[32rem] w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">Date</th>
            <th className="pb-2 pr-3 font-medium">ID</th>
            <th className="pb-2 pr-3 text-right font-medium">Amount</th>
            <th className="pb-2 pr-3 font-medium">Type</th>
            <th className="pb-2 pr-3 font-medium">Network</th>
            <th className="pb-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((t) => (
            <tr className="border-b last:border-b-0" key={t.id}>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                {formatDate(t.created)}
              </td>
              <td className="py-2 pr-3 font-mono text-xs">
                {t.id.slice(0, 12)}...
              </td>
              <td
                className={cn(
                  "py-2 pr-3 text-right tabular-nums",
                  t.type === "debit"
                    ? "text-red-700 dark:text-red-400"
                    : "text-green-700 dark:text-green-400"
                )}
              >
                {fmt(t.amount, t.iso_currency_code)}
              </td>
              <td className="py-2 pr-3">
                <Badge variant="secondary" className="text-[10px]">
                  {t.type}
                </Badge>
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                {t.network ?? "—"}
              </td>
              <td className="py-2">
                <Badge
                  className={cn(
                    "text-[10px]",
                    statusColors[t.status] ?? ""
                  )}
                  variant="secondary"
                >
                  {t.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </ScrollArea>
  );
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "MMM d, HH:mm");
  } catch {
    return dateStr;
  }
}
