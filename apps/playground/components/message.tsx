"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import { Suspense, useState } from "react";
import type { Vote } from "@/lib/db/schema";
import {
  extractToolName,
  formatToolTitle,
  parseToolOutput,
} from "@/lib/plaid/tool-output";
import { TOOL_RENDERERS } from "@/lib/plaid/tool-renderers";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { MessageContent } from "./elements/message";
import { Response } from "./elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file",
  );

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.parts?.some(
              (p) => p.type === "text" && p.text?.trim(),
            ),
            "w-full":
              (message.role === "assistant" &&
                (message.parts?.some(
                  (p) => p.type === "text" && p.text?.trim(),
                ) ||
                  message.parts?.some((p) => p.type.startsWith("tool-")))) ||
              mode === "edit",
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user" && mode !== "edit",
          })}
        >
          {attachmentsFromMessage.length > 0 && (
            <div
              className="flex flex-row justify-end gap-2"
              data-testid={"message-attachments"}
            >
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  attachment={{
                    name: attachment.filename ?? "file",
                    contentType: attachment.mediaType,
                    url: attachment.url,
                  }}
                  key={attachment.url}
                />
              ))}
            </div>
          )}

          {message.parts?.map((part, index) => {
            const { type } = part;
            const key = `message-${message.id}-part-${index}`;

            if (type === "reasoning") {
              const hasContent = part.text?.trim().length > 0;
              const isStreaming = "state" in part && part.state === "streaming";
              if (hasContent || isStreaming) {
                return (
                  <MessageReasoning
                    isLoading={isLoading || isStreaming}
                    key={key}
                    reasoning={part.text || ""}
                  />
                );
              }
            }

            if (type === "text") {
              if (mode === "view") {
                return (
                  <div key={key}>
                    <MessageContent
                      className={cn({
                        "wrap-break-word w-fit rounded-2xl px-3 py-2 text-right text-white":
                          message.role === "user",
                        "bg-transparent px-0 py-0 text-left":
                          message.role === "assistant",
                      })}
                      data-testid="message-content"
                      style={
                        message.role === "user"
                          ? { backgroundColor: "#006cff" }
                          : undefined
                      }
                    >
                      <Response>{sanitizeText(part.text)}</Response>
                    </MessageContent>
                  </div>
                );
              }

              if (mode === "edit") {
                return (
                  <div
                    className="flex w-full flex-row items-start gap-3"
                    key={key}
                  >
                    <div className="size-8" />
                    <div className="min-w-0 flex-1">
                      <MessageEditor
                        key={message.id}
                        message={message}
                        regenerate={regenerate}
                        setMessages={setMessages}
                        setMode={setMode}
                      />
                    </div>
                  </div>
                );
              }
            }

            // Generic tool invocation rendering (MCP tools)
            if (type.startsWith("tool-")) {
              const toolPart = part as unknown as {
                type: `tool-${string}`;
                toolCallId: string;
                state: "input-streaming" | "input-available" | "approval-requested" | "approval-responded" | "output-available" | "output-error" | "output-denied";
                input?: Record<string, unknown>;
                output?: Record<string, unknown>;
                errorText?: string;
                approval?: { id: string; approved?: boolean };
              };
              const { toolCallId, state } = toolPart;

              const toolName = extractToolName(toolPart.type);
              const CustomRenderer = TOOL_RENDERERS[toolName];
              const parsed = toolPart.output
                ? parseToolOutput(toolPart.output)
                : null;
              const hasCustomRender =
                CustomRenderer &&
                parsed &&
                !parsed.isError &&
                (parsed.userData != null || parsed.rawText != null);

              return (
                <Tool defaultOpen={true} key={toolCallId}>
                  <ToolHeader
                    state={state}
                    type={toolPart.type}
                    title={formatToolTitle(toolName)}
                  />
                  <ToolContent>
                    {(state === "input-available" ||
                      state === "approval-requested" ||
                      state === "approval-responded") &&
                      toolPart.input && <ToolInput input={toolPart.input} />}
                    {state === "output-available" &&
                      toolPart.output &&
                      (hasCustomRender ? (
                        <ToolOutput
                          errorText={toolPart.errorText}
                          output={
                            <Suspense
                              fallback={
                                <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words p-4 text-xs">
                                  Loading...
                                </pre>
                              }
                            >
                              <div className="p-4">
                                <CustomRenderer
                                  data={
                                    parsed.userData ?? parsed.rawText
                                  }
                                  input={toolPart.input}
                                  toolName={toolName}
                                />
                              </div>
                            </Suspense>
                          }
                        />
                      ) : (
                        <ToolOutput
                          errorText={toolPart.errorText}
                          output={
                            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words p-4 text-xs">
                              {typeof toolPart.output === "string"
                                ? toolPart.output
                                : JSON.stringify(toolPart.output, null, 2)}
                            </pre>
                          }
                        />
                      ))}
                    {state === "approval-requested" &&
                      toolPart.approval?.id && (
                        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                          <button
                            className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: toolPart.approval!.id,
                                approved: false,
                                reason: "User denied tool execution",
                              });
                            }}
                            type="button"
                          >
                            Deny
                          </button>
                          <button
                            className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: toolPart.approval!.id,
                                approved: true,
                              });
                            }}
                            type="button"
                          >
                            Allow
                          </button>
                        </div>
                      )}
                  </ToolContent>
                </Tool>
              );
            }

            return null;
          })}

          {!isReadonly && (
            <MessageActions
              chatId={chatId}
              isLoading={isLoading}
              key={`action-${message.id}`}
              message={message}
              setMode={setMode}
              vote={vote}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
  return (
    <div
      className="group/message fade-in w-full animate-in duration-300"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <div className="animate-pulse">
            <SparklesIcon size={14} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Thinking</span>
            <span className="inline-flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
