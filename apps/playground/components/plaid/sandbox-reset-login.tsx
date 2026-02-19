"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { StatusBanner } from "./shared/status-banner";

export function SandboxResetLoginRenderer({ data }: ToolRendererProps) {
  const text = typeof data === "string" ? data : null;
  return (
    <StatusBanner
      description={
        text ?? "Login reset — item is now in error state."
      }
      title="Login Reset"
      variant="warning"
    />
  );
}
