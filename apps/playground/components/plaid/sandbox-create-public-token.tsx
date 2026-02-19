"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { StatusBanner } from "./shared/status-banner";

export function SandboxCreatePublicTokenRenderer({ data }: ToolRendererProps) {
  const text = typeof data === "string" ? data : null;
  const parsed =
    data && typeof data === "object"
      ? (data as {
          item_ref?: string;
          institution?: string;
          products?: string[];
          public_token?: string;
        })
      : null;

  const details: Record<string, React.ReactNode> = {};
  if (parsed?.item_ref) {
    details["Item Reference"] = (
      <code className="rounded bg-muted px-1.5 py-0.5">{parsed.item_ref}</code>
    );
  }
  if (parsed?.institution) {
    details["Institution"] = parsed.institution;
  }
  if (parsed?.products?.length) {
    details["Products"] = parsed.products.join(", ");
  }

  return (
    <StatusBanner
      description={text ?? "Sandbox public token created."}
      details={Object.keys(details).length > 0 ? details : undefined}
      title="Sandbox Token Created"
      variant="info"
    />
  );
}
