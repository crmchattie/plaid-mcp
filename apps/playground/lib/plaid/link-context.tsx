"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { ChatMessage } from "@/lib/types";

type PlaidLinkContextType = {
  sendChatMessage: UseChatHelpers<ChatMessage>["sendMessage"] | null;
};

const PlaidLinkContext = createContext<PlaidLinkContextType>({
  sendChatMessage: null,
});

export function PlaidLinkProvider({
  sendMessage,
  children,
}: {
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ sendChatMessage: sendMessage }),
    [sendMessage],
  );
  return (
    <PlaidLinkContext.Provider value={value}>
      {children}
    </PlaidLinkContext.Provider>
  );
}

export function usePlaidLinkContext() {
  return useContext(PlaidLinkContext);
}
