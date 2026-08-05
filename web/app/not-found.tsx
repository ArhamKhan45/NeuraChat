import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <div className="mb-6 rounded-full border bg-muted p-6">
          <span className="text-5xl font-bold">404</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>

        <p className="mt-3 text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={cn(buttonVariants())}>
            <Home className="mr-2 size-4" />
            Go Home
          </Link>

          <Link
            href="/"
            className={cn(
              buttonVariants({
                variant: "outline",
              }),
            )}
          >
            <ArrowLeft className="mr-2 size-4" />
            Go Back
          </Link>
        </div>
      </div>
    </main>
  );
}
