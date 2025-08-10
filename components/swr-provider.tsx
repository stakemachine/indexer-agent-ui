"use client";

import type * as React from "react";
import { SWRConfig, type SWRConfiguration } from "swr";
import { toast } from "@/hooks/use-toast";

const defaultFetcher: SWRConfiguration["fetcher"] = async (resource: string, init?: RequestInit) => {
  const res = await fetch(resource, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text}`);
  }
  return res.json();
};

const swrConfig: SWRConfiguration = {
  fetcher: defaultFetcher,
  dedupingInterval: 5_000,
  focusThrottleInterval: 30_000,
  errorRetryInterval: 4_000,
  errorRetryCount: 3,
  revalidateOnReconnect: true,
  revalidateOnFocus: true,
  onError: (err: unknown, key) => {
    const e = err as { status?: number; message?: string };
    if (e.status === 404) return;
    // eslint-disable-next-line no-console
    console.error("SWR global error:", { key, message: e.message });
    try {
      if (e.message) {
        toast({ title: "Data fetch error", description: e.message.substring(0, 140) });
      }
    } catch {
      /* ignore */
    }
  },
};

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
