"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type CreditLiability = {
  account_id?: string;
  aprs?: { apr_percentage: number; apr_type: string }[];
  is_overdue?: boolean;
  last_payment_amount?: number;
  last_statement_balance?: number;
  minimum_payment_amount?: number;
  next_payment_due_date?: string;
};

type StudentLiability = {
  account_id?: string;
  loan_name?: string;
  interest_rate_percentage?: number;
  origination_date?: string;
  expected_payoff_date?: string;
  monthly_payment?: number;
  loan_status?: { type?: string };
  outstanding_interest_amount?: number;
};

type MortgageLiability = {
  account_id?: string;
  interest_rate?: { percentage?: number; type?: string };
  last_payment_amount?: number;
  loan_type_description?: string;
  origination_principal_amount?: number;
  current_late_fee?: number;
  escrow_balance?: number;
  has_pmi?: boolean;
  next_monthly_payment?: number;
  origination_date?: string;
  maturity_date?: string;
};

type LiabilitiesData = {
  liabilities?: {
    credit?: CreditLiability[];
    student?: StudentLiability[];
    mortgage?: MortgageLiability[];
  };
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

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        className="flex w-full items-center gap-2 py-2 text-sm font-medium"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <ChevronDownIcon
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            !open && "-rotate-90"
          )}
        />
        {title}
        <Badge className="ml-1" variant="secondary">
          {count}
        </Badge>
      </button>
      {open && <div className="space-y-3 pb-2">{children}</div>}
    </div>
  );
}

function aprColor(apr: number) {
  if (apr < 15) return "text-green-700 dark:text-green-400";
  if (apr <= 25) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

export function GetLiabilitiesRenderer({ data }: ToolRendererProps) {
  const parsed = data as LiabilitiesData | null;
  const liabilities = parsed?.liabilities;
  if (!liabilities) {
    return (
      <p className="text-sm text-muted-foreground">No liabilities data.</p>
    );
  }

  const credit = liabilities.credit ?? [];
  const student = liabilities.student ?? [];
  const mortgage = liabilities.mortgage ?? [];

  if (credit.length === 0 && student.length === 0 && mortgage.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No liabilities found.</p>
    );
  }

  return (
    <ScrollArea className="max-h-[32rem] pr-3">
      <div className="space-y-2">
        {credit.length > 0 && (
        <Section count={credit.length} title="Credit Cards">
          {credit.map((c, i) => {
            const mainApr = c.aprs?.find(
              (a) => a.apr_type === "purchase_apr"
            ) ?? c.aprs?.[0];
            return (
              <Card key={c.account_id ?? i}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    {mainApr && (
                      <div>
                        <p className="text-xs text-muted-foreground">APR</p>
                        <p
                          className={cn(
                            "font-semibold text-lg tabular-nums",
                            aprColor(mainApr.apr_percentage)
                          )}
                        >
                          {mainApr.apr_percentage}%
                        </p>
                      </div>
                    )}
                    {c.is_overdue && (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Min payment</p>
                      <p className="tabular-nums">{fmt(c.minimum_payment_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Statement balance</p>
                      <p className="tabular-nums">{fmt(c.last_statement_balance)}</p>
                    </div>
                  </div>
                  {c.next_payment_due_date && (
                    <p className="text-xs text-muted-foreground">
                      Due: {c.next_payment_due_date}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Section>
      )}

      {student.length > 0 && (
        <Section count={student.length} title="Student Loans">
          {student.map((s, i) => (
            <Card key={s.account_id ?? i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {s.loan_name ?? "Student Loan"}
                  {s.loan_status?.type && (
                    <Badge className="ml-2" variant="secondary">
                      {s.loan_status.type}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="tabular-nums">
                      {s.interest_rate_percentage != null
                        ? `${s.interest_rate_percentage}%`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly payment</p>
                    <p className="tabular-nums">{fmt(s.monthly_payment)}</p>
                  </div>
                </div>
                {s.origination_date && s.expected_payoff_date && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{s.origination_date}</span>
                      <span>{s.expected_payoff_date}</span>
                    </div>
                    <Progress className="h-1.5" value={50} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </Section>
      )}

      {mortgage.length > 0 && (
        <Section count={mortgage.length} title="Mortgages">
          {mortgage.map((m, i) => (
            <Card key={m.account_id ?? i}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  {m.interest_rate?.percentage != null && (
                    <span className="font-semibold text-lg tabular-nums">
                      {m.interest_rate.percentage}%
                    </span>
                  )}
                  {m.interest_rate?.type && (
                    <Badge variant="secondary">{m.interest_rate.type}</Badge>
                  )}
                  {m.has_pmi && (
                    <Badge variant="outline">PMI</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly payment</p>
                    <p className="tabular-nums">{fmt(m.next_monthly_payment)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Escrow</p>
                    <p className="tabular-nums">{fmt(m.escrow_balance)}</p>
                  </div>
                </div>
                {m.origination_principal_amount != null && (
                  <p className="text-xs text-muted-foreground">
                    Original: {fmt(m.origination_principal_amount)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </Section>
        )}
      </div>
    </ScrollArea>
  );
}
