"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/header";
import { IndexerRegistrationLoader } from "@/components/indexer-registration-loader";
import { SwrProvider } from "@/components/swr-provider";

interface AppProvidersProps {
  children: React.ReactNode;
}

// Central place for all top-level client providers. Keeps layout.tsx as a Server Component.
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SwrProvider>
          <IndexerRegistrationLoader />
          <Header />
          {children}
        </SwrProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
