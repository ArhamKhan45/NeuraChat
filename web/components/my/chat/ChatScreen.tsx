"use client";

import * as React from "react";

import ChatPrompt from "@/components/my/chat/ChatPrompt";
import ChatMessages, {
  type ChatMessage,
} from "@/components/my/chat/ChatMessages";

interface ChatScreenProps {
  initialMessages?: ChatMessage[];
}

export default function ChatScreen({ initialMessages = [] }: ChatScreenProps) {
  const [messages, setMessages] =
    React.useState<ChatMessage[]>(initialMessages);

  const [isGenerating, setIsGenerating] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const container = scrollRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isGenerating]);

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (prompt: string) => {
    if (isGenerating) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsGenerating(true);

      await waitForMockResponse(600, controller.signal);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: getMockAssistantResponse(prompt),
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("Failed to generate response:", error);

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Something went wrong while generating the response. Please try again.",
      };

      setMessages((currentMessages) => [...currentMessages, errorMessage]);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-4"
      >
        <ChatMessages messages={messages} />

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

function waitForMockResponse(
  delay: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, delay);

    const handleAbort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException("Request aborted", "AbortError"));
    };

    if (signal.aborted) {
      handleAbort();
      return;
    }

    signal.addEventListener("abort", handleAbort, {
      once: true,
    });
  });
}

function getMockAssistantResponse(prompt: string): string {
  const normalizedPrompt = prompt.trim().toLowerCase();

  if (
    normalizedPrompt === "hi" ||
    normalizedPrompt === "hello" ||
    normalizedPrompt === "hey"
  ) {
    return "Hi! How can I help you today?";
  }

  if (
    normalizedPrompt.includes("code block") ||
    normalizedPrompt.includes("test code")
  ) {
    return `Here is a test response containing normal text and multiple code blocks.

First, a React component:

\`\`\`tsx
interface ButtonProps {
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function CustomButton({
  title,
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
    >
      {title}
    </button>
  );
}
\`\`\`

Now a Python example:

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("Arham"))
\`\`\`

And a JSON example:

\`\`\`json
{
  "name": "NeuroChat",
  "status": "working"
}
\`\`\`

Each block should display its language and copy button.`;
  }

  if (
    normalizedPrompt.includes("react") ||
    normalizedPrompt.includes("component") ||
    normalizedPrompt.includes("button")
  ) {
    return `You can create a reusable React component by defining typed props and passing the required values from the parent.

\`\`\`tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function CustomButton({
  label,
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
\`\`\`

You can reuse this component anywhere in your application by passing a label and click handler.`;
  }

  if (
    normalizedPrompt.includes("python") ||
    normalizedPrompt.includes("fastapi")
  ) {
    return `Here is a simple FastAPI route:

\`\`\`python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
\`\`\`

Run the server with:

\`\`\`bash
uvicorn main:app --reload
\`\`\``;
  }

  return `I understand your question.

This is currently a mock response used to test the chat interface. Type **"test code block"** to verify React, Python, and JSON code block rendering.

Later, replace this mock function with the response returned by your FastAPI chat endpoint.`;
}
