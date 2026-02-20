"use client";

import { ShieldIcon } from "lucide-react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MaskedField } from "./shared/masked-field";

type IdentityOwner = {
  names?: string[];
  addresses?: { data?: { street?: string; city?: string; region?: string; postal_code?: string; country?: string } }[];
  emails?: { data?: string; primary?: boolean; type?: string }[];
  phone_numbers?: { data?: string; primary?: boolean; type?: string }[];
};

type IdentityAccount = {
  account_id: string;
  name: string;
  owners?: IdentityOwner[];
};

type IdentityData = {
  accounts?: IdentityAccount[];
};

export function GetIdentityRenderer({ data }: ToolRendererProps) {
  const parsed = data as IdentityData | null;
  if (!parsed?.accounts || parsed.accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">No identity data.</p>;
  }

  return (
    <ScrollArea className="max-h-[32rem] pr-3">
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <ShieldIcon className="size-4 shrink-0" />
          <span>Personal information is masked by default for privacy</span>
        </div>
        {parsed.accounts.map((acct) =>
        acct.owners?.map((owner, oi) => (
          <Card key={`${acct.account_id}-${oi}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {owner.names?.[0] ?? acct.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {owner.addresses?.map((addr, ai) => {
                const d = addr.data;
                const full = d
                  ? [d.street, d.city, d.region, d.postal_code, d.country]
                      .filter(Boolean)
                      .join(", ")
                  : "";
                return full ? (
                  <MaskedField
                    key={ai}
                    label="Address"
                    value={full}
                    visibleChars={6}
                  />
                ) : null;
              })}
              {owner.emails?.map((email, ei) => (
                <MaskedField
                  key={ei}
                  label={`Email${email.primary ? " (primary)" : ""}`}
                  value={email.data ?? ""}
                  visibleChars={8}
                />
              ))}
              {owner.phone_numbers?.map((phone, pi) => (
                <MaskedField
                  key={pi}
                  label={`Phone${phone.primary ? " (primary)" : ""}`}
                  value={phone.data ?? ""}
                  visibleChars={4}
                />
              ))}
            </CardContent>
          </Card>
        ))
        )}
      </div>
    </ScrollArea>
  );
}
