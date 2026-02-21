"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccountTypeIcon } from "./shared/account-type-icon";
import { cn } from "@/lib/utils";

type Account = {
  account_id: string;
  name: string;
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

export function GetBalanceRenderer({ data }: ToolRendererProps) {
  const parsed = data as { accounts?: Account[] } | null;
  const accounts = parsed?.accounts;
  if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">No accounts found.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
        </span>
        <span className="text-xs font-medium text-green-700 dark:text-green-400">
          Live balances
        </span>
      </div>
      <ScrollArea className="max-h-[32rem] pr-0 sm:pr-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.map((acct) => {
          const hasLimit = acct.balances.limit != null && acct.balances.limit > 0;
          const usagePercent =
            hasLimit && acct.balances.current != null
              ? Math.min(
                  100,
                  Math.round(
                    (acct.balances.current / acct.balances.limit!) * 100
                  )
                )
              : null;

          return (
            <Card key={acct.account_id}>
              <CardContent className="space-y-3 p-4">
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
                <div className="flex flex-wrap items-baseline gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="font-semibold text-xl tabular-nums">
                      {formatBalance(
                        acct.balances.current,
                        acct.balances.iso_currency_code
                      )}
                    </p>
                  </div>
                  {acct.balances.available != null && (
                    <div>
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="text-lg tabular-nums text-muted-foreground">
                        {formatBalance(
                          acct.balances.available,
                          acct.balances.iso_currency_code
                        )}
                      </p>
                    </div>
                  )}
                </div>
                {usagePercent != null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Used</span>
                      <span>{usagePercent}%</span>
                    </div>
                    <Progress
                      className={cn(
                        "h-2",
                        usagePercent > 80 && "[&>div]:bg-red-500",
                        usagePercent > 50 &&
                          usagePercent <= 80 &&
                          "[&>div]:bg-amber-500"
                      )}
                      value={usagePercent}
                    />
                    <p className="text-xs text-muted-foreground">
                      Limit:{" "}
                      {formatBalance(
                        acct.balances.limit,
                        acct.balances.iso_currency_code
                      )}
                    </p>
                  </div>
                )}
                {acct.balances.iso_currency_code && (
                  <p className="text-xs text-muted-foreground">
                    {acct.balances.iso_currency_code}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      </ScrollArea>
    </div>
  );
}
