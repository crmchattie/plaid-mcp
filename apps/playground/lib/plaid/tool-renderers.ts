import type { ComponentType } from "react";

// Batch 1 — Critical
import { GetAccountsRenderer } from "@/components/plaid/get-accounts";
import { GetBalanceRenderer } from "@/components/plaid/get-balance";
import { GetTransactionsSyncRenderer } from "@/components/plaid/get-transactions-sync";
import { GetAuthRenderer } from "@/components/plaid/get-auth";
import { CreateLinkTokenRenderer } from "@/components/plaid/create-link-token";
import { GetLinkSessionRenderer } from "@/components/plaid/get-link-session";
import { GetLiabilitiesRenderer } from "@/components/plaid/get-liabilities";
import { GetInvestmentsHoldingsRenderer } from "@/components/plaid/get-investments-holdings";

// Batch 2 — High
import { GetIdentityRenderer } from "@/components/plaid/get-identity";
import { GetInvestmentsTransactionsRenderer } from "@/components/plaid/get-investments-transactions";
import { ListItemsRenderer } from "@/components/plaid/list-items";
import { GetDisclosureSettingsRenderer } from "@/components/plaid/get-disclosure-settings";
import { SetDisclosureLevelRenderer } from "@/components/plaid/set-disclosure-level";
import { GetDocPageRenderer } from "@/components/plaid/get-doc-page";
import { SearchDocsRenderer } from "@/components/plaid/search-docs";
import { ListSectionsRenderer } from "@/components/plaid/list-sections";

// Batch 3 — Medium
import { GetItemRenderer } from "@/components/plaid/get-item";
import { CreateTransferRenderer } from "@/components/plaid/create-transfer";
import { GetTransferRenderer } from "@/components/plaid/get-transfer";
import { ListTransfersRenderer } from "@/components/plaid/list-transfers";
import { ExchangePublicTokenRenderer } from "@/components/plaid/exchange-public-token";
import { RemoveItemRenderer } from "@/components/plaid/remove-item";
import { RemoveStoredItemRenderer } from "@/components/plaid/remove-stored-item";

// Batch 4 — Sandbox
import { SandboxCreatePublicTokenRenderer } from "@/components/plaid/sandbox-create-public-token";
import { SandboxResetLoginRenderer } from "@/components/plaid/sandbox-reset-login";
import { SandboxFireWebhookRenderer } from "@/components/plaid/sandbox-fire-webhook";

export type ToolRendererProps = {
  /** Parsed userData or rawText from the tool output */
  data: unknown;
  /** Tool call parameters */
  input?: unknown;
  /** The tool name (without "tool-" prefix) */
  toolName: string;
};

/**
 * Registry of custom tool renderers, keyed by tool name.
 * Falls back to generic JSON display if no renderer is registered.
 */
export const TOOL_RENDERERS: Record<
  string,
  ComponentType<ToolRendererProps>
> = {
  // Batch 1 — Critical
  get_accounts: GetAccountsRenderer,
  get_balance: GetBalanceRenderer,
  get_transactions_sync: GetTransactionsSyncRenderer,
  get_auth: GetAuthRenderer,
  create_link_token: CreateLinkTokenRenderer,
  get_link_session: GetLinkSessionRenderer,
  get_liabilities: GetLiabilitiesRenderer,
  get_investments_holdings: GetInvestmentsHoldingsRenderer,

  // Batch 2 — High
  get_identity: GetIdentityRenderer,
  get_investments_transactions: GetInvestmentsTransactionsRenderer,
  list_items: ListItemsRenderer,
  get_disclosure_settings: GetDisclosureSettingsRenderer,
  set_disclosure_level: SetDisclosureLevelRenderer,
  get_doc_page: GetDocPageRenderer,
  search_docs: SearchDocsRenderer,
  list_sections: ListSectionsRenderer,

  // Batch 3 — Medium
  get_item: GetItemRenderer,
  create_transfer: CreateTransferRenderer,
  get_transfer: GetTransferRenderer,
  list_transfers: ListTransfersRenderer,
  exchange_public_token: ExchangePublicTokenRenderer,
  remove_item: RemoveItemRenderer,
  remove_stored_item: RemoveStoredItemRenderer,

  // Batch 4 — Sandbox
  sandbox_create_public_token: SandboxCreatePublicTokenRenderer,
  sandbox_reset_login: SandboxResetLoginRenderer,
  sandbox_fire_webhook: SandboxFireWebhookRenderer,
};
