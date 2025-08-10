import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "../styles/globals.css";
import { AppProviders } from "@/components/app-providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "The Graph Indexer Agent UI",
  description: "Dashboard for The Graph Indexer Agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <AppProviders>
          <main className="container mx-auto p-4 space-y-6">{children}</main>
        </AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
