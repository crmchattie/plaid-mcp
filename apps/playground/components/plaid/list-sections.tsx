"use client";

import { ChevronDownIcon, FolderIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { cn } from "@/lib/utils";

type DocSection = {
  name: string;
  pages: string[];
};

function parseSectionsText(text: string): DocSection[] {
  const sections: DocSection[] = [];
  let current: DocSection | null = null;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this is a section header (not indented, or starts with a non-dash)
    if (!trimmed.startsWith("-") && !trimmed.startsWith("*") && !trimmed.startsWith(" ")) {
      if (current) sections.push(current);
      current = { name: trimmed.replace(/:$/, ""), pages: [] };
    } else if (current) {
      const pageName = trimmed.replace(/^[-*]\s*/, "").trim();
      if (pageName) current.pages.push(pageName);
    }
  }
  if (current) sections.push(current);
  return sections;
}

function SectionAccordion({ section }: { section: DocSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border">
      <button
        className="flex w-full items-center gap-2 p-3 text-sm font-medium hover:bg-muted/50"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <FolderIcon className="size-4 text-muted-foreground" />
        <span className="flex-1 text-left">{section.name}</span>
        <span className="text-xs text-muted-foreground">
          {section.pages.length}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="border-t px-3 py-2">
          {section.pages.map((page, i) => (
            <div
              className="flex items-center gap-2 py-1 text-sm text-muted-foreground"
              key={i}
            >
              <FileTextIcon className="size-3.5" />
              <span>{page}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ListSectionsRenderer({ data }: ToolRendererProps) {
  if (typeof data !== "string" || !data.trim()) {
    return <p className="text-sm text-muted-foreground">No sections.</p>;
  }

  const sections = parseSectionsText(data);
  if (sections.length === 0) {
    return (
      <div className="whitespace-pre-wrap text-sm text-muted-foreground">
        {data}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, i) => (
        <SectionAccordion key={i} section={section} />
      ))}
    </div>
  );
}
