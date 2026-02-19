"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useState } from "react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ItemData = {
  item?: {
    item_id?: string;
    institution_id?: string;
    available_products?: string[];
    billed_products?: string[];
    products?: string[];
    webhook?: string;
    error?: { error_type?: string; error_message?: string } | null;
    consent_expiration_time?: string;
    update_type?: string;
  };
  status?: {
    transactions?: { last_successful_update?: string; last_failed_update?: string };
    investments?: { last_successful_update?: string };
  };
};

function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [value]);

  return (
    <span className="inline-flex items-center gap-1">
      <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
        {value.length > 30 ? `${value.slice(0, 30)}...` : value}
      </code>
      <button
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
        title="Copy"
        type="button"
      >
        {copied ? (
          <CheckIcon className="size-3 text-green-600" />
        ) : (
          <CopyIcon className="size-3" />
        )}
      </button>
    </span>
  );
}

function relTime(dateStr?: string) {
  if (!dateStr) return null;
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function GetItemRenderer({ data }: ToolRendererProps) {
  const parsed = data as ItemData | null;
  const item = parsed?.item;
  if (!item) {
    return <p className="text-sm text-muted-foreground">No item data.</p>;
  }

  const products = [
    ...(item.billed_products ?? []),
    ...(item.products ?? []),
  ];

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {item.institution_id && (
          <div>
            <p className="text-xs text-muted-foreground">Institution</p>
            <p className="text-sm font-medium">{item.institution_id}</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {products.map((p) => (
              <Badge key={p} variant="secondary">
                {p}
              </Badge>
            ))}
          </div>
        )}

        {item.webhook && (
          <div>
            <p className="text-xs text-muted-foreground">Webhook</p>
            <CopyableCode value={item.webhook} />
          </div>
        )}

        {item.error && (
          <div className="rounded-md bg-red-500/10 p-2 text-xs text-red-700 dark:text-red-400">
            <p className="font-medium">{item.error.error_type}</p>
            <p>{item.error.error_message}</p>
          </div>
        )}

        {parsed?.status?.transactions?.last_successful_update && (
          <p className="text-xs text-muted-foreground">
            Last transaction update:{" "}
            {relTime(parsed.status.transactions.last_successful_update)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
