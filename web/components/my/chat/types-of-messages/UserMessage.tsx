export default function UserMessage({ content }: { content: string }) {
  return (
    <div className="w-full py-3">
      <div className="mx-auto flex w-full max-w-3xl justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-3xl bg-muted px-4 py-2.5 text-[15px] leading-6 text-foreground sm:max-w-[75%]">
          {content}
        </div>
      </div>
    </div>
  );
}
