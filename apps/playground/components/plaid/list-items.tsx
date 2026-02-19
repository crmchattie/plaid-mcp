"use client";

import { LinkIcon } from "lucide-react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ParsedItem = {
  alias: string;
  institution?: string;
  item_id?: string;
  created?: string;
};

function parseItemsText(text: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const match = line.match(
      /- (\w+):\s*institution=([^,]*),\s*item_id=([^,]*),\s*created=(.*)/
    );
    if (match) {
      items.push({
        alias: match[1],
        institution: match[2].trim(),
        item_id: match[3].trim(),
        created: match[4].trim(),
      });
    }
  }
  return items;
}

export function ListItemsRenderer({ data }: ToolRendererProps) {
  // data might be rawText (string) or parsed JSON
  let items: ParsedItem[] = [];

  if (typeof data === "string") {
    items = parseItemsText(data);
  } else if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
    items = (data as { items: ParsedItem[] }).items;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {typeof data === "string" ? data : "No stored items found."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Card key={item.alias}>
          <CardContent className="flex items-start gap-3 p-4">
            <LinkIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium text-sm">{item.alias}</p>
              {item.institution && (
                <Badge variant="secondary">{item.institution}</Badge>
              )}
              {item.item_id && (
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {item.item_id}
                </p>
              )}
              {item.created && (
                <p className="text-xs text-muted-foreground">
                  Created: {item.created}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
