"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { StatusBanner } from "./shared/status-banner";

export function SetDisclosureLevelRenderer({ data, input }: ToolRendererProps) {
  const params = input as { category?: string; level?: string } | undefined;
  const text = typeof data === "string" ? data : null;

  return (
    <StatusBanner
      description={
        text ??
        (params
          ? `${params.category ?? "Category"} disclosure set to ${params.level ?? "updated"}`
          : "Disclosure level updated")
      }
      details={
        params
          ? {
              Category: params.category ?? "—",
              Level: params.level ?? "—",
            }
          : undefined
      }
      title="Disclosure Level Updated"
      variant="success"
    />
  );
}
