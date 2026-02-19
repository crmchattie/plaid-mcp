"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useState } from "react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type LinkTokenData = {
  link_token?: string;
  expiration?: string;
  request_id?: string;
};

export function CreateLinkTokenRenderer({ data }: ToolRendererProps) {
  const parsed = data as LinkTokenData | null;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!parsed?.link_token) return;
    try {
      await navigator.clipboard.writeText(parsed.link_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [parsed?.link_token]);

  if (!parsed?.link_token) {
    return <p className="text-sm text-muted-foreground">No link token data.</p>;
  }

  const expirationDate = parsed.expiration
    ? new Date(parsed.expiration)
    : null;
  const now = new Date();
  const totalMs = expirationDate ? expirationDate.getTime() - now.getTime() : 0;
  // Link tokens typically last 4 hours (14400000ms)
  const maxMs = 4 * 60 * 60 * 1000;
  const progressPercent =
    totalMs > 0 ? Math.min(100, Math.round((totalMs / maxMs) * 100)) : 0;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Link Token
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
              {parsed.link_token}
            </code>
            <button
              className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={handleCopy}
              title="Copy token"
              type="button"
            >
              {copied ? (
                <CheckIcon className="size-4 text-green-600" />
              ) : (
                <CopyIcon className="size-4" />
              )}
            </button>
          </div>
        </div>

        {expirationDate && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Expires</span>
              <span>
                {formatDistanceToNow(expirationDate, { addSuffix: true })}
              </span>
            </div>
            <Progress className="h-1.5" value={progressPercent} />
          </div>
        )}

        {parsed.request_id && (
          <p className="text-xs text-muted-foreground">
            Request ID: {parsed.request_id}
          </p>
        )}

        <p className="text-xs text-muted-foreground italic">
          Use this token to initialize Plaid Link in your application.
        </p>
      </CardContent>
    </Card>
  );
}
