import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/header";
import { IndexerRegistrationLoader } from "@/components/indexer-registration-loader";
import { SwrProvider } from "@/components/swr-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "The Graph Indexer Agent UI",
  description: "Dashboard for The Graph Indexer Agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SwrProvider>
            <IndexerRegistrationLoader />
            <Header />
            <main className="container mx-auto p-4 space-y-6">{children}</main>
          </SwrProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
