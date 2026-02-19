"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { StatusBanner } from "./shared/status-banner";

export function RemoveItemRenderer({ data }: ToolRendererProps) {
  const text = typeof data === "string" ? data : null;
  return (
    <StatusBanner
      description={text ?? "The item has been removed from Plaid."}
      title="Item Removed"
      variant="success"
    />
  );
}
