"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { StatusBanner } from "./shared/status-banner";

export function ExchangePublicTokenRenderer({ data }: ToolRendererProps) {
  const text = typeof data === "string" ? data : null;
  const parsed =
    data && typeof data === "object"
      ? (data as { item_ref?: string; access_token?: string })
      : null;

  const details: Record<string, React.ReactNode> = {};
  if (parsed?.item_ref) {
    details["Item Reference"] = (
      <code className="rounded bg-muted px-1.5 py-0.5">{parsed.item_ref}</code>
    );
  }

  return (
    <StatusBanner
      description={text ?? "Public token exchanged successfully."}
      details={Object.keys(details).length > 0 ? details : undefined}
      title="Token Exchanged"
      variant="success"
    />
  );
}
