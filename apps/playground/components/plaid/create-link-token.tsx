"use client";

import {
  CheckCircle2Icon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  LandmarkIcon,
  LoaderIcon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import type { PlaidLinkOnSuccess, PlaidLinkOnExit } from "react-plaid-link";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { usePlaidLinkContext } from "@/lib/plaid/link-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// ── Product definitions ──────────────────────────────────────────────

const PLAID_PRODUCTS = [
  {
    id: "transactions",
    label: "Transactions",
    description: "Transaction history and spending",
  },
  {
    id: "auth",
    label: "Auth",
    description: "Account and routing numbers",
  },
  {
    id: "identity",
    label: "Identity",
    description: "Account holder information",
  },
  {
    id: "investments",
    label: "Investments",
    description: "Holdings and investment transactions",
  },
  {
    id: "liabilities",
    label: "Liabilities",
    description: "Credit cards, loans, mortgages",
  },
] as const;

// ── Types ────────────────────────────────────────────────────────────

type LinkTokenData = {
  link_token?: string;
  expiration?: string;
  request_id?: string;
  hosted_link_url?: string;
};

type LinkState = "idle" | "open" | "success" | "exited" | "recreating";

// ── Helpers ──────────────────────────────────────────────────────────

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sorted1 = [...a].sort();
  const sorted2 = [...b].sort();
  return sorted1.every((v, i) => v === sorted2[i]);
}

// ── Component ────────────────────────────────────────────────────────

export function CreateLinkTokenRenderer({ data, input }: ToolRendererProps) {
  const parsed = data as LinkTokenData | null;
  const toolInput = input as { products?: string[] } | null;
  const originalProducts = toolInput?.products ?? [];

  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    originalProducts.length > 0
      ? [...originalProducts]
      : PLAID_PRODUCTS.map((p) => p.id),
  );
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const [connectedInstitution, setConnectedInstitution] = useState<
    string | null
  >(null);
  const [copied, setCopied] = useState(false);
  const { sendChatMessage } = usePlaidLinkContext();

  const productsChanged = useMemo(
    () => !arraysEqual(selectedProducts, originalProducts),
    [selectedProducts, originalProducts],
  );

  const toggleProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((p) => p !== productId)
        : [...prev, productId];
      return next.length > 0 ? next : prev;
    });
  }, []);

  // ── Plaid Link callbacks ───────────────────────────────────────────

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    (publicToken, metadata) => {
      setLinkState("success");
      const institutionName = metadata.institution?.name ?? "a bank";
      setConnectedInstitution(institutionName);

      if (sendChatMessage) {
        sendChatMessage({
          role: "user" as const,
          parts: [
            {
              type: "text",
              text: `I've connected ${institutionName} through Plaid Link. Please exchange this public token: ${publicToken}`,
            },
          ],
        });
      }
    },
    [sendChatMessage],
  );

  const onExit = useCallback<PlaidLinkOnExit>(
    (_error, _metadata) => {
      if (linkState !== "success") {
        setLinkState("exited");
      }
    },
    [linkState],
  );

  const { open, ready } = usePlaidLink({
    token: parsed?.link_token ?? null,
    onSuccess,
    onExit,
  });

  // ── Handlers ───────────────────────────────────────────────────────

  const handleConnect = useCallback(() => {
    if (productsChanged) {
      setLinkState("recreating");
      if (sendChatMessage) {
        sendChatMessage({
          role: "user" as const,
          parts: [
            {
              type: "text",
              text: `Create a new link token with products: ${selectedProducts.join(", ")}`,
            },
          ],
        });
      }
    } else {
      setLinkState("open");
      open();
    }
  }, [productsChanged, selectedProducts, open, sendChatMessage]);

  const handleRetry = useCallback(() => {
    setLinkState("open");
    open();
  }, [open]);

  const handleCopy = useCallback(async () => {
    if (!parsed?.link_token) return;
    try {
      await navigator.clipboard.writeText(parsed.link_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [parsed?.link_token]);

  // ── Guard ──────────────────────────────────────────────────────────

  if (!parsed?.link_token) {
    return <p className="text-sm text-muted-foreground">No link token data.</p>;
  }

  // ── Expiration ─────────────────────────────────────────────────────

  const expirationDate = parsed.expiration
    ? new Date(parsed.expiration)
    : null;

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        {/* ── Success state ─────────────────────────────────────── */}
        {linkState === "success" && (
          <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <CheckCircle2Icon className="size-5 shrink-0 text-green-700 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {connectedInstitution
                  ? `${connectedInstitution} connected`
                  : "Bank connected"}
              </p>
              <p className="text-xs text-green-700/70 dark:text-green-400/70">
                Exchanging token for account access...
              </p>
            </div>
          </div>
        )}

        {/* ── Recreating state ──────────────────────────────────── */}
        {linkState === "recreating" && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <LoaderIcon className="size-5 shrink-0 animate-spin text-blue-700 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Updating products...
              </p>
              <p className="text-xs text-blue-700/70 dark:text-blue-400/70">
                Creating a new link token with your selected products.
              </p>
            </div>
          </div>
        )}

        {/* ── Exited state ──────────────────────────────────────── */}
        {linkState === "exited" && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <XCircleIcon className="size-5 shrink-0 text-amber-700 dark:text-amber-400" />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Connection cancelled
              </p>
              <Button onClick={handleRetry} size="sm" variant="outline">
                <RefreshCwIcon className="size-3.5" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* ── Product picker + Connect ──────────────────────────── */}
        {(linkState === "idle" || linkState === "exited") && (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Select data to access
              </p>
              <div className="grid gap-1.5">
                {PLAID_PRODUCTS.map((product) => {
                  const checked = selectedProducts.includes(product.id);
                  return (
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors",
                        checked
                          ? "border-primary/30 bg-primary/5"
                          : "border-transparent bg-muted/50 opacity-60 hover:opacity-80",
                      )}
                      key={product.id}
                    >
                      <input
                        checked={checked}
                        className="sr-only"
                        onChange={() => toggleProduct(product.id)}
                        type="checkbox"
                      />
                      <div
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {checked && <CheckIcon className="size-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">
                          {product.label}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {product.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!ready && !productsChanged}
              onClick={handleConnect}
            >
              <LandmarkIcon className="size-4" />
              {productsChanged
                ? "Update & Connect"
                : ready
                  ? "Connect Bank Account"
                  : "Loading Plaid Link..."}
            </Button>

            {/* Hosted Link fallback */}
            {parsed.hosted_link_url && (
              <a
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                href={parsed.hosted_link_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLinkIcon className="size-3" />
                Open in browser instead
              </a>
            )}
          </>
        )}

        {/* ── Token details (collapsible) ───────────────────────── */}
        {linkState !== "recreating" && (
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDownIcon className="size-3" />
              Token details
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
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
                    <CheckIcon className="size-3.5 text-green-600" />
                  ) : (
                    <CopyIcon className="size-3.5" />
                  )}
                </button>
              </div>
              {expirationDate && (
                <p className="text-xs text-muted-foreground">
                  Expires{" "}
                  {formatDistanceToNow(expirationDate, { addSuffix: true })}
                </p>
              )}
              {parsed.request_id && (
                <p className="text-xs text-muted-foreground">
                  Request ID: {parsed.request_id}
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
