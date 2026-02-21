"use client";

import { ExternalLinkIcon, FileTextIcon } from "lucide-react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type DocResult = {
  title: string;
  url: string;
  section?: string;
  snippet?: string;
};

function parseSearchResults(text: string): DocResult[] {
  const results: DocResult[] = [];
  const blocks = text.split(/(?=###\s)/);

  for (const block of blocks) {
    const titleMatch = block.match(/###\s*(.+)/);
    const urlMatch = block.match(/https?:\/\/[^\s)]+/);
    const title = titleMatch?.[1]?.trim() ?? "";
    const url = urlMatch?.[0] ?? "";
    const sectionMatch = block.match(/Section:\s*(.+)/i);
    // Snippet is remaining text after title and url lines
    const lines = block.split("\n").filter((l) => l.trim());
    const snippet = lines
      .filter(
        (l) =>
          !l.startsWith("###") &&
          !l.match(/^https?:\/\//) &&
          !l.match(/^Section:/i) &&
          !l.match(/^\[.*\]\(.*\)$/)
      )
      .join(" ")
      .trim();

    if (title || url) {
      results.push({
        title: title || url,
        url,
        section: sectionMatch?.[1]?.trim(),
        snippet: snippet || undefined,
      });
    }
  }
  return results;
}

export function SearchDocsRenderer({ data }: ToolRendererProps) {
  if (typeof data !== "string" || !data.trim()) {
    return <p className="text-sm text-muted-foreground">No results.</p>;
  }

  const results = parseSearchResults(data);
  if (results.length === 0) {
    // Fall back to plain text display
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
        {data}
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[32rem] pr-0 sm:pr-3">
      <div className="space-y-2">
        {results.map((result, i) => (
        <Card key={i}>
          <CardContent className="flex items-start gap-3 p-3">
            <FileTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium text-sm">
                {result.url ? (
                  <a
                    className="inline-flex items-center gap-1 hover:underline"
                    href={result.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {result.title}
                    <ExternalLinkIcon className="size-3" />
                  </a>
                ) : (
                  result.title
                )}
              </p>
              {result.section && (
                <Badge className="text-[10px]" variant="secondary">
                  {result.section}
                </Badge>
              )}
              {result.snippet && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {result.snippet}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
