"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Security = {
  security_id: string;
  ticker_symbol?: string;
  name?: string;
  type?: string;
  close_price?: number;
  close_price_as_of?: string;
};

type Holding = {
  security_id: string;
  account_id: string;
  quantity: number;
  institution_price: number;
  institution_value: number;
  cost_basis?: number;
  iso_currency_code?: string;
};

type HoldingsData = {
  holdings?: Holding[];
  securities?: Security[];
};

function fmt(val: number | null | undefined, currency = "USD") {
  if (val == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(val);
  } catch {
    return `$${val.toFixed(2)}`;
  }
}

function fmtQty(val: number) {
  return val % 1 === 0 ? val.toString() : val.toFixed(4);
}

export function GetInvestmentsHoldingsRenderer({ data }: ToolRendererProps) {
  const parsed = data as HoldingsData | null;
  if (!parsed?.holdings || parsed.holdings.length === 0) {
    return <p className="text-sm text-muted-foreground">No holdings data.</p>;
  }

  const secMap = new Map(
    (parsed.securities ?? []).map((s) => [s.security_id, s])
  );

  let totalValue = 0;
  let totalCost = 0;

  const rows = parsed.holdings.map((h) => {
    const sec = secMap.get(h.security_id);
    const gainLoss =
      h.cost_basis != null ? h.institution_value - h.cost_basis : null;
    totalValue += h.institution_value;
    if (h.cost_basis != null) totalCost += h.cost_basis;
    return { ...h, sec, gainLoss };
  });

  const priceDate = parsed.securities?.find((s) => s.close_price_as_of)
    ?.close_price_as_of;

  return (
    <ScrollArea className="max-h-[32rem] pr-0 sm:pr-3">
      <div className="overflow-x-auto">
      <table className="min-w-[40rem] w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">Security</th>
            <th className="pb-2 pr-3 font-medium">Type</th>
            <th className="pb-2 pr-3 text-right font-medium">Qty</th>
            <th className="pb-2 pr-3 text-right font-medium">
              Price{priceDate ? ` (${priceDate})` : ""}
            </th>
            <th className="pb-2 pr-3 text-right font-medium">Value</th>
            <th className="pb-2 pr-3 text-right font-medium">Cost</th>
            <th className="pb-2 text-right font-medium">Gain/Loss</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr className="border-b last:border-b-0" key={i}>
              <td className="py-2 pr-3">
                <div className="flex flex-col">
                  {r.sec?.ticker_symbol && (
                    <span className="font-medium">
                      {r.sec.ticker_symbol}
                    </span>
                  )}
                  {r.sec?.name && (
                    <span className="truncate text-xs text-muted-foreground">
                      {r.sec.name}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                {r.sec?.type ?? "—"}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {fmtQty(r.quantity)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {fmt(r.institution_price, r.iso_currency_code)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {fmt(r.institution_value, r.iso_currency_code)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {fmt(r.cost_basis, r.iso_currency_code)}
              </td>
              <td
                className={cn(
                  "py-2 text-right tabular-nums",
                  r.gainLoss != null && r.gainLoss >= 0
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                )}
              >
                {r.gainLoss != null
                  ? `${r.gainLoss >= 0 ? "+" : ""}${fmt(r.gainLoss, r.iso_currency_code)}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t font-medium">
            <td className="pt-2 pr-3" colSpan={4}>
              Total
            </td>
            <td className="pt-2 pr-3 text-right tabular-nums">
              {fmt(totalValue)}
            </td>
            <td className="pt-2 pr-3 text-right tabular-nums">
              {totalCost > 0 ? fmt(totalCost) : "—"}
            </td>
            <td
              className={cn(
                "pt-2 text-right tabular-nums",
                totalValue - totalCost >= 0
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              )}
            >
              {totalCost > 0
                ? `${totalValue - totalCost >= 0 ? "+" : ""}${fmt(totalValue - totalCost)}`
                : "—"}
            </td>
          </tr>
        </tfoot>
      </table>
      </div>
    </ScrollArea>
  );
}
