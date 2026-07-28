import { Loader2 } from "lucide-react";

interface FullScreenLoaderProps {
  message?: string;
}

export default function FullScreenLoader({
  message = "Loading...",
}: FullScreenLoaderProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />

        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
