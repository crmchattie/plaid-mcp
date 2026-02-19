"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";

type DisclosureLevel = "summary" | "detailed";

type DisclosureSettings = {
  transactions?: DisclosureLevel;
  investments?: DisclosureLevel;
  liabilities?: DisclosureLevel;
  identity?: DisclosureLevel;
};

const categories = ["transactions", "investments", "liabilities", "identity"] as const;

function parseDisclosureText(text: string): DisclosureSettings | null {
  const settings: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const match = line.match(/(\w+):\s*(summary|detailed)/i);
    if (match) {
      settings[match[1].toLowerCase()] = match[2].toLowerCase();
    }
  }
  return Object.keys(settings).length > 0
    ? (settings as unknown as DisclosureSettings)
    : null;
}

export function GetDisclosureSettingsRenderer({ data }: ToolRendererProps) {
  let settings: DisclosureSettings | null = null;

  if (typeof data === "string") {
    settings = parseDisclosureText(data);
  } else if (data && typeof data === "object") {
    settings = data as DisclosureSettings;
  }

  if (!settings) {
    return (
      <p className="text-sm text-muted-foreground">
        {typeof data === "string" ? data : "No disclosure settings."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const level = settings![cat] as string | undefined;
        if (!level) return null;
        return (
          <div
            className="flex items-center justify-between rounded-md border px-3 py-2"
            key={cat}
          >
            <span className="text-sm capitalize">{cat}</span>
            <Badge
              variant={level === "detailed" ? "default" : "secondary"}
            >
              {level}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
