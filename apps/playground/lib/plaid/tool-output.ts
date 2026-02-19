/**
 * Utility functions for parsing MCP tool outputs.
 *
 * Handles three response patterns:
 * 1. Dual-audience tools (accounts, transactions, etc.) — userData is parsed Plaid JSON
 * 2. Single-block JSON tools (link token, transfers, item) — userData is parsed JSON
 * 3. Plain-text tools (vault list, docs, sandbox confirmations) — rawText is the string
 */

export type ParsedToolOutput = {
  /** Parsed JSON from the audience:["user"] block, or null */
  userData: unknown | null;
  /** Raw text from the first content block (for text-only tools like docs/vault) */
  rawText: string | null;
  /** Whether the tool reported an error */
  isError: boolean;
};

/** Strips the "tool-" prefix from a toolPart.type string */
export function extractToolName(type: string): string {
  return type.startsWith("tool-") ? type.slice(5) : type;
}

/** Formats a tool name for display: replaces _ with spaces, title-cases */
export function formatToolTitle(toolName: string): string {
  return toolName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Parses a CallToolResult structure into a normalized ParsedToolOutput */
export function parseToolOutput(output: unknown): ParsedToolOutput {
  const result: ParsedToolOutput = {
    userData: null,
    rawText: null,
    isError: false,
  };

  if (!output || typeof output !== "object") {
    return result;
  }

  const obj = output as Record<string, unknown>;

  // Check error flag
  if (obj.isError) {
    result.isError = true;
  }

  // Check if output has content array (MCP CallToolResult format)
  const content = obj.content;
  if (Array.isArray(content)) {
    // Look for a block with annotations.audience including "user"
    for (const block of content) {
      if (
        block &&
        typeof block === "object" &&
        block.annotations &&
        typeof block.annotations === "object" &&
        Array.isArray(block.annotations.audience) &&
        block.annotations.audience.includes("user") &&
        typeof block.text === "string"
      ) {
        try {
          result.userData = JSON.parse(block.text);
        } catch {
          result.rawText = block.text;
        }
        return result;
      }
    }

    // No user-audience block found — take the first text block
    for (const block of content) {
      if (block && typeof block === "object" && typeof block.text === "string") {
        try {
          result.userData = JSON.parse(block.text);
        } catch {
          result.rawText = block.text;
        }
        return result;
      }
    }

    return result;
  }

  // Not a content-array structure — try to use the output directly
  // This handles cases where the output is already parsed JSON
  if (typeof obj === "object" && !Array.isArray(obj)) {
    result.userData = obj;
  }

  return result;
}
