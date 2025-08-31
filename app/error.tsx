"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Global error boundary for App Router. Catches errors thrown in Server & Client Components.
// Provides a reset action so Next.js can attempt to re-render the segment.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to monitoring service here (Datadog, Sentry, etc.)
    // eslint-disable-next-line no-console
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="flex flex-row items-center space-x-2">
              <TriangleAlertIcon className="h-5 w-5 text-red-500" />
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground break-words">
                {error.message || "An unexpected error occurred."}
              </p>
              {error.digest && <p className="text-[10px] font-mono text-muted-foreground/70">Digest: {error.digest}</p>}
              <div className="flex space-x-2">
                <Button onClick={() => reset()} size="sm">
                  Try again
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.location.assign("/")}>
                  Go home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
