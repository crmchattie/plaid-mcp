import { PLAID_BASE_URLS, type PlaidEnv } from "@plaid-mcp/shared";

export interface PlaidClientConfig {
  clientId: string;
  secret: string;
  env: PlaidEnv;
}

export interface PlaidError {
  error_type: string;
  error_code: string;
  error_message: string;
  display_message: string | null;
  request_id: string;
}

export interface PlaidResponse<T = Record<string, unknown>> {
  data?: T;
  error?: PlaidError;
  request_id?: string;
}

/**
 * Simple fetch-based Plaid API client for Cloudflare Workers.
 * Injects client_id and secret into every request body.
 */
export class PlaidClient {
  private baseUrl: string;
  private clientId: string;
  private secret: string;

  constructor(config: PlaidClientConfig) {
    this.baseUrl = PLAID_BASE_URLS[config.env];
    this.clientId = config.clientId;
    this.secret = config.secret;
  }

  async request<T = Record<string, unknown>>(
    endpoint: string,
    body: Record<string, unknown> = {},
  ): Promise<PlaidResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        secret: this.secret,
        ...body,
      }),
    });

    const json = (await resp.json()) as Record<string, unknown>;

    if (!resp.ok || json.error_type) {
      return {
        error: json as unknown as PlaidError,
        request_id: json.request_id as string | undefined,
      };
    }

    return {
      data: json as T,
      request_id: json.request_id as string | undefined,
    };
  }
}
