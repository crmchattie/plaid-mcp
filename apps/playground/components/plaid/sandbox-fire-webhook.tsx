"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { StatusBanner } from "./shared/status-banner";

export function SandboxFireWebhookRenderer({ data, input }: ToolRendererProps) {
  const text = typeof data === "string" ? data : null;
  const params = input as {
    webhook_type?: string;
    webhook_code?: string;
  } | undefined;

  const details: Record<string, React.ReactNode> = {};
  if (params?.webhook_type) details["Type"] = params.webhook_type;
  if (params?.webhook_code) details["Code"] = params.webhook_code;

  return (
    <StatusBanner
      description={text ?? "Webhook fired successfully."}
      details={Object.keys(details).length > 0 ? details : undefined}
      title="Webhook Fired"
      variant="info"
    />
  );
}
