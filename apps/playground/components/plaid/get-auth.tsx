"use client";

import { ShieldAlertIcon } from "lucide-react";
import type { ToolRendererProps } from "@/lib/plaid/tool-renderers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccountTypeIcon } from "./shared/account-type-icon";
import { MaskedField } from "./shared/masked-field";

type Account = {
  account_id: string;
  name: string;
  type: string;
  subtype?: string;
};

type AchNumber = {
  account_id: string;
  account: string;
  routing: string;
  wire_routing?: string;
};

type EftNumber = {
  account_id: string;
  account: string;
  institution: string;
  branch: string;
};

type InternationalNumber = {
  account_id: string;
  iban: string;
  bic: string;
};

type BacsNumber = {
  account_id: string;
  account: string;
  sort_code: string;
};

type AuthData = {
  accounts?: Account[];
  numbers?: {
    ach?: AchNumber[];
    eft?: EftNumber[];
    international?: InternationalNumber[];
    bacs?: BacsNumber[];
  };
};

export function GetAuthRenderer({ data }: ToolRendererProps) {
  const parsed = data as AuthData | null;
  if (!parsed?.accounts) {
    return <p className="text-sm text-muted-foreground">No auth data.</p>;
  }

  const { accounts, numbers } = parsed;

  return (
    <ScrollArea className="max-h-[32rem] pr-3">
      <div className="space-y-3">
        {accounts.map((acct) => {
        const ach = numbers?.ach?.find((n) => n.account_id === acct.account_id);
        const eft = numbers?.eft?.find((n) => n.account_id === acct.account_id);
        const intl = numbers?.international?.find(
          (n) => n.account_id === acct.account_id
        );
        const bacs = numbers?.bacs?.find(
          (n) => n.account_id === acct.account_id
        );

        return (
          <Card key={acct.account_id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AccountTypeIcon
                  className="text-muted-foreground"
                  type={acct.type}
                />
                {acct.name}
                {acct.subtype && (
                  <Badge className="ml-auto" variant="secondary">
                    {acct.subtype}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {ach && (
                <>
                  <MaskedField label="Routing Number" value={ach.routing} />
                  <MaskedField label="Account Number" value={ach.account} />
                  {ach.wire_routing && (
                    <MaskedField
                      label="Wire Routing"
                      value={ach.wire_routing}
                    />
                  )}
                </>
              )}
              {eft && (
                <>
                  <MaskedField label="Institution" value={eft.institution} />
                  <MaskedField label="Branch" value={eft.branch} />
                  <MaskedField label="Account Number" value={eft.account} />
                </>
              )}
              {intl && (
                <>
                  <MaskedField label="IBAN" value={intl.iban} />
                  <MaskedField label="BIC" value={intl.bic} />
                </>
              )}
              {bacs && (
                <>
                  <MaskedField label="Sort Code" value={bacs.sort_code} />
                  <MaskedField label="Account Number" value={bacs.account} />
                </>
              )}
            </CardContent>
          </Card>
        );
        })}
        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <ShieldAlertIcon className="size-4 shrink-0" />
          <span>These numbers are not visible to the AI assistant</span>
        </div>
      </div>
    </ScrollArea>
  );
}
