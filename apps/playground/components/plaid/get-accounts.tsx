"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccountTypeIcon } from "./shared/account-type-icon";
import { cn } from "@/lib/utils";

const borderColorByType: Record<string, string> = {
  depository: "border-l-blue-500",
  credit: "border-l-purple-500",
  loan: "border-l-amber-500",
  investment: "border-l-green-500",
  other: "border-l-zinc-500",
};

type Account = {
  account_id: string;
  name: string;
  official_name?: string;
  type: string;
  subtype?: string;
  mask?: string;
  balances: {
    current: number | null;
    available: number | null;
    limit: number | null;
    iso_currency_code?: string;
  };
};

function formatBalance(val: number | null, currency?: string) {
  if (val == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(val);
  } catch {
    return `$${val.toFixed(2)}`;
  }
}

export function GetAccountsRenderer({ data }: ToolRendererProps) {
  const parsed = data as { accounts?: Account[] } | null;
  const accounts = parsed?.accounts;
  if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">No accounts found.</p>;
  }

  return (
    <ScrollArea className="max-h-[32rem] pr-0 sm:pr-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.map((acct) => (
        <Card
          className={cn(
            "border-l-4",
            borderColorByType[acct.type?.toLowerCase()] ?? "border-l-zinc-500"
          )}
          key={acct.account_id}
        >
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <AccountTypeIcon
                className="text-muted-foreground"
                type={acct.type}
              />
              <span className="truncate font-medium text-sm">
                {acct.name}
              </span>
              {acct.subtype && (
                <Badge className="ml-auto shrink-0" variant="secondary">
                  {acct.subtype}
                </Badge>
              )}
            </div>
            {acct.mask && (
              <p className="font-mono text-xs text-muted-foreground">
                ••••{acct.mask}
              </p>
            )}
            <div className="flex flex-wrap items-baseline gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="font-semibold text-lg tabular-nums">
                  {formatBalance(
                    acct.balances.current,
                    acct.balances.iso_currency_code
                  )}
                </p>
              </div>
              {acct.balances.available != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {formatBalance(
                      acct.balances.available,
                      acct.balances.iso_currency_code
                    )}
                  </p>
                </div>
              )}
            </div>
            {acct.balances.limit != null && (
              <p className="text-xs text-muted-foreground">
                Credit limit:{" "}
                {formatBalance(
                  acct.balances.limit,
                  acct.balances.iso_currency_code
                )}
              </p>
            )}
          </CardContent>
        </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
