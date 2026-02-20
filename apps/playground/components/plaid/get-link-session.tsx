"use client";

import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { StatusBanner } from "./shared/status-banner";

type ItemAddResult = {
  public_token?: string;
  institution_id?: string;
};

type LinkSessionData = {
  link_sessions?: Array<{
    finished?: boolean;
    results?: {
      item_add_results?: ItemAddResult[];
    };
  }>;
  expiration?: string;
  created_at?: string;
  status?: string;
};

export function GetLinkSessionRenderer({ data }: ToolRendererProps) {
  const parsed = data as LinkSessionData | null;

  if (!parsed) {
    return (
      <StatusBanner
        description="No session data returned."
        title="Link Session"
        variant="info"
      />
    );
  }

  const session = parsed.link_sessions?.[0];
  const itemResults = session?.results?.item_add_results ?? [];
  const isComplete = session?.finished === true || itemResults.length > 0;

  if (isComplete) {
    const details: Record<string, React.ReactNode> = {};
    details["Items Connected"] = String(itemResults.length);
    if (itemResults[0]?.institution_id) {
      details["Institution"] = itemResults[0].institution_id;
    }

    return (
      <StatusBanner
        description={`User completed Link and connected ${itemResults.length} item${itemResults.length !== 1 ? "s" : ""}.`}
        details={details}
        title="Link Session Complete"
        variant="success"
      />
    );
  }

  return (
    <StatusBanner
      description="The user has not yet completed the Link flow."
      title="Link Session Pending"
      variant="info"
    />
  );
}
