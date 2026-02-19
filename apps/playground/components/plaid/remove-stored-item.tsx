"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { StatusBanner } from "./shared/status-banner";

export function RemoveStoredItemRenderer({ data }: ToolRendererProps) {
  const text = typeof data === "string" ? data : null;
  return (
    <StatusBanner
      description={text ?? "The stored item reference has been removed."}
      title="Stored Item Removed"
      variant="success"
    />
  );
}
