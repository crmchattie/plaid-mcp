"use client";

import { ExternalLinkIcon } from "lucide-react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Response } from "@/components/elements/response";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GetDocPageRenderer({ data, input }: ToolRendererProps) {
  const text = typeof data === "string" ? data : null;
  const params = input as { url?: string } | undefined;

  if (!text) {
    return <p className="text-sm text-muted-foreground">No content.</p>;
  }

  return (
    <div className="space-y-2">
      {params?.url && (
        <a
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          href={params.url}
          rel="noreferrer"
          target="_blank"
        >
          {params.url}
          <ExternalLinkIcon className="size-3" />
        </a>
      )}
      <ScrollArea className="max-h-[40rem]">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Response>{text}</Response>
        </div>
      </ScrollArea>
    </div>
  );
}
