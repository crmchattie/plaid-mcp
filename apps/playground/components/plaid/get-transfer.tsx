"use client";

import { ArrowDownIcon, ArrowUpIcon, CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useState } from "react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type TransferData = {
  transfer?: {
    id?: string;
    amount?: string;
    type?: string;
    network?: string;
    status?: string;
    created?: string;
    description?: string;
    iso_currency_code?: string;
  };
};

function fmt(val: string | number | undefined, currency = "USD") {
  if (val == null) return "—";
  const num = typeof val === "string" ? parseFloat(val) : val;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

const statusColors: Record<string, string> = {
  posted: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
  cancelled: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
};

export function GetTransferRenderer({ data }: ToolRendererProps) {
  const parsed = data as TransferData | null;
  const transfer = parsed?.transfer;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!transfer?.id) return;
    try {
      await navigator.clipboard.writeText(transfer.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [transfer?.id]);

  if (!transfer) {
    return <p className="text-sm text-muted-foreground">No transfer data.</p>;
  }

  const isDebit = transfer.type === "debit";
  const DirectionIcon = isDebit ? ArrowUpIcon : ArrowDownIcon;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <DirectionIcon
            className={`size-5 ${isDebit ? "text-red-600" : "text-green-600"}`}
          />
          <span className="font-semibold text-xl tabular-nums">
            {fmt(transfer.amount, transfer.iso_currency_code)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {transfer.network && (
            <Badge variant="outline">{transfer.network}</Badge>
          )}
          {transfer.status && (
            <Badge
              className={statusColors[transfer.status] ?? ""}
              variant="secondary"
            >
              {transfer.status}
            </Badge>
          )}
          {transfer.type && (
            <Badge variant="secondary">{transfer.type}</Badge>
          )}
        </div>

        {transfer.id && (
          <div className="flex items-center gap-2">
            <code className="truncate rounded bg-muted px-2 py-1 font-mono text-xs">
              {transfer.id}
            </code>
            <button
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              type="button"
            >
              {copied ? (
                <CheckIcon className="size-3.5 text-green-600" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </button>
          </div>
        )}

        {transfer.created && (
          <p className="text-xs text-muted-foreground">
            Created: {transfer.created}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
