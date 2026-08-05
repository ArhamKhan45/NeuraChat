"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import ChatPrompt from "@/components/my/chat/ChatPrompt";
import ChatMessages, {
  type ChatMessage,
} from "@/components/my/chat/ChatMessages";
import { useConversations } from "@/hooks/useConversations";

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

/*
 * Stable reference.
 * This is not recreated on every component render.
 */
const EMPTY_MESSAGES: ChatMessage[] = [];

export default function ChatScreen({
  initialMessages = EMPTY_MESSAGES,
  chatId,
}: ChatScreenProps) {
  const router = useRouter();

  const { getToken, isLoaded, isSignedIn } = useAuth();

  const { createNewConversation, isCreating, removeConversation } =
    useConversations();

  const [activeChatId, setActiveChatId] = React.useState<string | undefined>(
    chatId,
  );

  const [messages, setMessages] = React.useState<ChatMessage[]>(
    () => initialMessages,
  );

  const [isLoadingMessages, setIsLoadingMessages] = React.useState(
    Boolean(chatId) && initialMessages.length === 0,
  );

  const [isGenerating, setIsGenerating] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  /*
   * Keep activeChatId synchronized when the route changes.
   */
  React.useEffect(() => {
    setActiveChatId(chatId);
  }, [chatId]);

  /*
   * Scroll to the latest message.
   */
  React.useEffect(() => {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isGenerating, isCreating]);

  /*
   * Load existing messages only when chatId exists.
   *
   * initialMessages is intentionally not included in the dependencies.
   * It is used only as the initial state value.
   */
  React.useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setMessages([]);
      setIsLoadingMessages(false);
      setError(null);
      return;
    }

    /*
     * New-chat page: there is nothing to fetch yet.
     */
    if (!chatId) {
      setIsLoadingMessages(false);
      setError(null);
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
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(await getResponseError(response));
        }

        const data = (await response.json()) as ApiChatMessage[];

        if (controller.signal.aborted) {
          return;
        }

        setMessages(data.map(mapApiMessageToChatMessage));
      } catch (caughtError: unknown) {
        if (isAbortError(caughtError)) {
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

  /*
   * Abort message generation when the component unmounts.
   */
  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (prompt: string): Promise<void> => {
    const content = prompt.trim();

    if (!content || !isLoaded || !isSignedIn || isGenerating || isCreating) {
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

    let createdConversationId: string | null = null;

    try {
      let conversationId = activeChatId;

      /*
       * Create a conversation before sending the first message.
       */
      if (!conversationId) {
        const newConversation = await createNewConversation(
          createConversationTitle(content),
        );

        if (!newConversation) {
          throw new Error("Could not create a new conversation");
        }

        conversationId = newConversation.id;
        createdConversationId = newConversation.id;

        setActiveChatId(conversationId);

        /*
         * Change this path if your conversation route differs.
         */
        window.history.replaceState(null, "", `/chat/${conversationId}`);
      }

      if (controller.signal.aborted) {
        throw new Error("Message send aborted");
      }

      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token was not found");
      }

      const response = await fetch(
        `${API_BASE_URL}/conversations/${conversationId}/messages`,
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
        const updatedMessages = currentMessages.map((message) =>
          message.id === temporaryUserMessageId ? savedUserMessage : message,
        );

        return [...updatedMessages, assistantMessage];
      });

      router.refresh();
    } catch (caughtError: unknown) {
      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) => message.id !== temporaryUserMessageId,
        ),
      );

      if (createdConversationId) {
        await removeConversation(createdConversationId);
        createdConversationId = null;
        setActiveChatId(undefined);
        window.history.replaceState(null, "", "/chat");
      }

      if (isAbortError(caughtError)) {
        return;
      }

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

  const promptIsBusy = isGenerating || isCreating;

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

        {promptIsBusy ? (
          <div className="w-full py-4">
            <div className="mx-auto w-full max-w-3xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-2 animate-pulse rounded-full bg-current" />

                {isCreating
                  ? "Creating conversation..."
                  : "NeuroChat is thinking..."}
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
          isGenerating={promptIsBusy}
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

function createConversationTitle(content: string): string {
  const normalizedContent = content.replace(/\s+/g, " ").trim();

  const maximumLength = 50;

  if (normalizedContent.length <= maximumLength) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, maximumLength)}...`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function getResponseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: unknown;
    };

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (data.detail !== undefined) {
      return JSON.stringify(data.detail);
    }

    return `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}
