"use client";

import { cn } from "@/lib/utils";

type AmountDisplayProps = {
  amount: number;
  currency?: string;
  className?: string;
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Math.abs(amount));
  } catch {
    return `${currency} ${Math.abs(amount).toFixed(2)}`;
  }
};

export function AmountDisplay({
  amount,
  currency = "USD",
  className,
}: AmountDisplayProps) {
  const formatted = formatCurrency(amount, currency);
  // In Plaid's convention: positive = debit (money out), negative = credit (money in)
  const isCredit = amount < 0;

  return (
    <span
      className={cn(
        "tabular-nums",
        isCredit
          ? "text-green-700 dark:text-green-400"
          : "text-red-700 dark:text-red-400",
        className
      )}
    >
      {isCredit ? `−${formatted}` : formatted}
    </span>
  );
}
