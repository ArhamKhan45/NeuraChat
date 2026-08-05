"use client";

import UserMessage from "./types-of-messages/UserMessage";
import AssistantMessage from "./types-of-messages/AssistantMessage";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export interface MessagePart {
  type: "text" | "code";
  content: string;
  language?: string;
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
