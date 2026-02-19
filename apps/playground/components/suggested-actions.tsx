"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { LockIcon } from "lucide-react";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { usePlaidCredentials } from "@/lib/plaid/credentials-context";
import { cn } from "@/lib/utils";
import { Suggestion } from "./elements/suggestion";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

const docsSuggestions = [
  "What products does Plaid offer?",
  "Search Plaid docs for transactions sync",
];

const apiSuggestions = [
  "Create a sandbox item and get the accounts",
  "Get account balances for my linked item",
];

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const { isConfigured } = usePlaidCredentials();

  const handleClick = (suggestion: string) => {
    window.history.pushState({}, "", `/chat/${chatId}`);
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: suggestion }],
    });
  };

  return (
    <div className="flex w-full flex-col gap-4" data-testid="suggested-actions">
      <div className="space-y-2">
        <motion.p
          animate={{ opacity: 1 }}
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.05 }}
        >
          Documentation
        </motion.p>
        <div className="grid w-full gap-2 sm:grid-cols-2">
          {docsSuggestions.map((suggestion, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
              key={suggestion}
              transition={{ delay: 0.05 * index }}
            >
              <Suggestion
                className="h-auto w-full whitespace-normal p-3 text-left"
                onClick={handleClick}
                suggestion={suggestion}
              >
                {suggestion}
              </Suggestion>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <motion.p
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.15 }}
        >
          API Tools
          {!isConfigured && <LockIcon className="size-3" />}
        </motion.p>
        <div
          className={cn(
            "grid w-full gap-2 sm:grid-cols-2",
            !isConfigured && "pointer-events-none opacity-50"
          )}
        >
          {apiSuggestions.map((suggestion, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
              key={suggestion}
              transition={{ delay: 0.05 * (index + 2) }}
            >
              {!isConfigured ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Suggestion
                        className="h-auto w-full whitespace-normal p-3 text-left"
                        disabled
                        suggestion={suggestion}
                      >
                        {suggestion}
                      </Suggestion>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Set credentials to use API tools
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Suggestion
                  className="h-auto w-full whitespace-normal p-3 text-left"
                  onClick={handleClick}
                  suggestion={suggestion}
                >
                  {suggestion}
                </Suggestion>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
