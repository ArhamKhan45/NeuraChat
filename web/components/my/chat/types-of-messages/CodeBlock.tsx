"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
export default function CodeBlock({
  language,
  code,
}: {
  language?: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

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
