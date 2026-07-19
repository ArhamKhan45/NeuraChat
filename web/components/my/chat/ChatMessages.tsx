"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
}

interface MessagePart {
  type: "text" | "code";
  content: string;
  language?: string;
}

function parseMessageContent(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const codeBlockRegex = /```([\w+-]*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBeforeCode = content.slice(lastIndex, match.index);

    if (textBeforeCode.trim()) {
      parts.push({
        type: "text",
        content: textBeforeCode.trim(),
      });
    }

    parts.push({
      type: "code",
      language: match[1] || "code",
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.slice(lastIndex);

  if (remainingText.trim()) {
    parts.push({
      type: "text",
      content: remainingText.trim(),
    });
  }

  return parts;
}

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-zinc-950 text-zinc-100">
      <div className="flex h-11 items-center justify-between border-b border-white/10 bg-zinc-900 px-4">
        <span className="text-xs font-medium text-zinc-400">
          {language || "code"}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-2 px-2 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <pre className="min-w-max p-4 font-mono text-sm leading-6">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function AssistantMessage({ content }: { content: string }) {
  const parts = parseMessageContent(content);

  return (
    <div className="w-full py-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="space-y-4 text-[15px] leading-7 text-foreground">
          {parts.map((part, index) => {
            if (part.type === "code") {
              return (
                <CodeBlock
                  key={`${part.type}-${index}`}
                  language={part.language}
                  code={part.content}
                />
              );
            }

            return (
              <p
                key={`${part.type}-${index}`}
                className="whitespace-pre-wrap break-words"
              >
                {part.content}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="w-full py-3">
      <div className="mx-auto flex w-full max-w-3xl justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl bg-muted px-4 py-2.5 text-[15px] leading-6 text-foreground sm:max-w-[75%]">
          {content}
        </div>
      </div>
    </div>
  );
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            How can I help you?
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Ask anything about your project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-6 pt-2">
      {messages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} content={message.content} />
        ) : (
          <AssistantMessage key={message.id} content={message.content} />
        ),
      )}
    </div>
  );
}
