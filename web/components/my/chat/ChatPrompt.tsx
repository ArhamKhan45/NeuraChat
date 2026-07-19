"use client";

import * as React from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ChatPromptProps {
  onSubmit?: (prompt: string) => void | Promise<void>;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export default function ChatPrompt({
  onSubmit,
  onStop,
  disabled = false,
  isGenerating = false,
}: ChatPromptProps) {
  const [prompt, setPrompt] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isDisabled = disabled || isSubmitting;
  const canSubmit = prompt.trim().length > 0 && !isDisabled && !isGenerating;

  const resizeTextarea = React.useCallback(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "24px";

    const nextHeight = Math.min(textarea.scrollHeight, 200);

    textarea.style.height = `${nextHeight}px`;
  }, []);

  React.useEffect(() => {
    resizeTextarea();
  }, [prompt, resizeTextarea]);

  const handleSubmit = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isDisabled || isGenerating) return;

    try {
      setIsSubmitting(true);

      await onSubmit?.(trimmedPrompt);

      setPrompt("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "24px";
      }
    } finally {
      setIsSubmitting(false);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex min-h-14 items-end gap-1 rounded-[28px] border border-border bg-muted px-2 py-2 shadow-sm focus-within:ring-1 focus-within:ring-ring">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isDisabled}
          aria-label="Attach file"
          className="size-10 shrink-0 rounded-full bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <Paperclip className="size-5" />
        </Button>

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message NeuroChat"
          disabled={isDisabled}
          rows={1}
          className="my-2 max-h-50 min-h-6 flex-1 resize-none overflow-y-auto bg-transparent px-2 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />

        {isGenerating ? (
          <Button
            type="button"
            size="icon"
            onClick={onStop}
            aria-label="Stop generating"
            className="size-10 shrink-0 rounded-full"
          >
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            aria-label="Send message"
            className="size-10 shrink-0 rounded-full"
          >
            <ArrowUp className="size-5 stroke-[2.5]" />
          </Button>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        NeuroChat can make mistakes. Check important information.
      </p>
    </div>
  );
}
