import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchDocs } from "./tools/search-docs.js";
import { registerGetDocPage } from "./tools/get-doc-page.js";
import { registerListSections } from "./tools/list-sections.js";

interface Env {
  DOCS_KV: KVNamespace;
  MCP_AGENT: DurableObjectNamespace<PlaidDocsMcp>;
}

export class PlaidDocsMcp extends McpAgent<Env> {
  server = new McpServer({
    name: "plaid-docs",
    version: "1.0.0",
  });

  async init() {
    const kv = this.env.DOCS_KV;
    registerSearchDocs(this.server, kv);
    registerGetDocPage(this.server, kv);
    registerListSections(this.server, kv);
  }
}

export default PlaidDocsMcp.serve("/mcp", { binding: "MCP_AGENT" });
