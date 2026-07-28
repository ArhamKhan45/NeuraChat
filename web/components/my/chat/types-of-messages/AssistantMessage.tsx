import { MessagePart } from "../ChatMessages";
import CodeBlock from "./CodeBlock";

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

export default function AssistantMessage({ content }: { content: string }) {
  const parts = parseMessageContent(content);

  return (
    <div className="w-full py-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="space-y-4 text-[15px] leading-7 text-foreground">
          {parts.map((part: any, index: number) => {
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
                className="whitespace-pre-wrap break-word"
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
