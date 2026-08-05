"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";

import ChatPrompt from "@/components/my/chat/ChatPrompt";
import ChatMessages, {
  type ChatMessage,
} from "@/components/my/chat/ChatMessages";

interface ChatScreenProps {
  initialMessages?: ChatMessage[];
  chatId?: string;
}

interface ApiChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface SendMessageResponse {
  user_message: ApiChatMessage;
  assistant_message: ApiChatMessage;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ChatScreen({
  initialMessages = [],
  chatId,
}: ChatScreenProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [messages, setMessages] =
    React.useState<ChatMessage[]>(initialMessages);

  const [isLoadingMessages, setIsLoadingMessages] = React.useState(
    initialMessages.length === 0,
  );

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isGenerating]);

  React.useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !chatId) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    const controller = new AbortController();

    const loadMessages = async (): Promise<void> => {
      setIsLoadingMessages(true);
      setError(null);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token was not found");
        }

        const response = await fetch(
          `${API_BASE_URL}/conversations/${chatId}/messages`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(await getResponseError(response));
        }

        const data = (await response.json()) as ApiChatMessage[];

        setMessages(data.map(mapApiMessageToChatMessage));
      } catch (caughtError: unknown) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load messages",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingMessages(false);
        }
      }
    };

    void loadMessages();

    return () => {
      controller.abort();
    };
  }, [chatId, getToken, isLoaded, isSignedIn]);

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (prompt: string): Promise<void> => {
    const content = prompt.trim();

    if (!content || !chatId || !isLoaded || !isSignedIn || isGenerating) {
      return;
    }

    const temporaryUserMessageId = crypto.randomUUID();

    const temporaryUserMessage: ChatMessage = {
      id: temporaryUserMessageId,
      role: "user",
      content,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      temporaryUserMessage,
    ]);

    setIsGenerating(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token was not found");
      }

      const response = await fetch(
        `${API_BASE_URL}/conversations/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(await getResponseError(response));
      }

      const data = (await response.json()) as SendMessageResponse;

      const savedUserMessage = mapApiMessageToChatMessage(data.user_message);

      const assistantMessage = mapApiMessageToChatMessage(
        data.assistant_message,
      );

      setMessages((currentMessages) => {
        const messagesWithSavedUserMessage = currentMessages.map((message) =>
          message.id === temporaryUserMessageId ? savedUserMessage : message,
        );

        return [...messagesWithSavedUserMessage, assistantMessage];
      });
    } catch (caughtError: unknown) {
      if (
        caughtError instanceof DOMException &&
        caughtError.name === "AbortError"
      ) {
        setMessages((currentMessages) =>
          currentMessages.filter(
            (message) => message.id !== temporaryUserMessageId,
          ),
        );

        return;
      }

      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) => message.id !== temporaryUserMessageId,
        ),
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not send message",
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = (): void => {
    abortControllerRef.current?.abort();
  };

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-4"
      >
        {isLoadingMessages ? (
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 py-6 text-sm text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-current" />
            Loading messages...
          </div>
        ) : (
          <ChatMessages messages={messages} />
        )}

        {isGenerating ? (
          <div className="w-full py-4">
            <div className="mx-auto w-full max-w-3xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-2 animate-pulse rounded-full bg-current" />
                NeuroChat is thinking...
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mx-auto w-full max-w-3xl py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      <div className="shrink-0">
        <ChatPrompt
          onSubmit={handleSubmit}
          onStop={handleStop}
          isGenerating={isGenerating}
        />
      </div>
    </section>
  );
}

function mapApiMessageToChatMessage(message: ApiChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
  };
}

async function getResponseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string;
    };

    return data.detail ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}
