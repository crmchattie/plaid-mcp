"use client";

import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type MaskedFieldProps = {
  label: string;
  value: string;
  visibleChars?: number;
  className?: string;
};

export function MaskedField({
  label,
  value,
  visibleChars = 4,
  className,
}: MaskedFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const masked =
    value.length > visibleChars
      ? `${"•".repeat(Math.min(value.length - visibleChars, 8))}${value.slice(-visibleChars)}`
      : value;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [value]);

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">
          {revealed ? value : masked}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => setRevealed((r) => !r)}
          title={revealed ? "Hide" : "Reveal"}
          type="button"
        >
          {revealed ? (
            <EyeOffIcon className="size-3.5" />
          ) : (
            <EyeIcon className="size-3.5" />
          )}
        </button>
        <button
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={handleCopy}
          title="Copy"
          type="button"
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-green-600" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
