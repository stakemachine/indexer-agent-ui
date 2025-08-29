"use client";

import type * as React from "react";
import { SWRConfig, type SWRConfiguration } from "swr";
import { toast } from "@/hooks/use-toast";
import { ValidationError } from "@/lib/fetchers";

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
    const keySummaryPre = summarizeKey(key);
    // Suppress noise: sometimes err is literally the serialized SWR key string (possibly with different whitespace)
    if (typeof err === "string") {
      const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
      const errNorm = normalize(err);
      const keyStr = typeof key === "string" ? key : "";
      const keyNorm = keyStr ? normalize(keyStr) : "";
      if (err === keyStr || err === keySummaryPre || (keyNorm && errNorm === keyNorm)) {
        return; // ignore pointless key echo errors
      }
      // Heuristic: if the error looks like a pure GraphQL selection (starts with '{' or 'query') and is long → suppress
      if (/^[{]?\s*(query|mutation)?[\s{]/.test(errNorm) && errNorm.length > 20) {
        return;
      }
    }
    // Same suppression for Error objects whose .message mirrors the key (common noisy case)
    if (err instanceof Error) {
      const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
      const keyStr = typeof key === "string" ? key : "";
      const keyNorm = keyStr ? normalize(keyStr) : "";
      const msgNorm = normalize(err.message || "");
      if (msgNorm && (msgNorm === keyNorm || msgNorm === normalize(keySummaryPre))) {
        return;
      }
      if (/^[{]?\s*(query|mutation)?[\s{]/.test(msgNorm) && msgNorm.length > 20 && !/error|exception/i.test(msgNorm)) {
        return;
      }
    }
    // Generic object with a query-like message string (not an Error instance)
    if (typeof err === "object" && err && !(err instanceof Error)) {
      const maybeMsg = (err as { message?: unknown }).message;
      if (typeof maybeMsg === "string") {
        const msgNorm = maybeMsg.replace(/\s+/g, " ").trim();
        if (/^[{]?\s*(query|mutation)?[\s{]/.test(msgNorm) && msgNorm.length > 20) {
          return;
        }
      }
    }
    if (err instanceof ValidationError) {
      // Validation errors are developer-surface; log compact, toast once.
      // eslint-disable-next-line no-console
      console.warn("SWR validation error", { key: summarizeKey(key), issues: err.issues });
      toast({ title: "Schema validation failed", description: err.issues.slice(0, 3).join("; ") });
      return;
    }
    // Trivial tagged GraphQL noise like [GQL] gql
    if (err instanceof Error) {
      const msg = err.message.trim();
      if (/^\[GQL]\s+gql$/i.test(msg)) return;
    }
    const e = err as { status?: number; message?: string };
    if (e.status === 404) return;
    const graphQLErrMsg = extractGraphQLErrMessage(err);
    const keySummary = summarizeKey(key);
    // Suppress trivial token-only echoes (e.g., key: 'gql', message: 'gql')
    const trivialTokens = new Set(["gql", "query", "mutation"]);
    if (
      !graphQLErrMsg &&
      trivialTokens.has(keySummary) &&
      typeof e.message === "string" &&
      trivialTokens.has(e.message.trim())
    ) {
      return;
    }
    const displayMessage = deriveDisplayMessage({ original: e.message, graphQL: graphQLErrMsg, keySummary, err });
    // Suppress entirely if the derived message adds no value beyond the key
    if (!graphQLErrMsg && (displayMessage === keySummary || !displayMessage)) {
      return;
    }
    // eslint-disable-next-line no-console
    console.error("SWR global error:", { key: keySummary, message: displayMessage, raw: err });
    if (displayMessage && displayMessage !== keySummary) {
      try {
        toast({ title: "Data fetch error", description: displayMessage.substring(0, 140) });
      } catch {
        /* ignore */
      }
    }
  },
};

function summarizeKey(key: string | unknown): string {
  if (typeof key !== "string") return "unknown-key";
  // SWR stable-hash array keys often start with @"<query>"; extract first word after 'query' if present
  if (key.startsWith('@"')) {
    const match = key.match(/query\s+(\w+)/);
    const name = match ? match[1] : "gql";
    const networkMatch = key.match(/#protocolNetwork:"([^"]+)/);
    const network = networkMatch ? networkMatch[1] : undefined;
    return network ? `${name}:${network}` : name;
  }
  return key.length > 50 ? `${key.slice(0, 47)}…` : key;
}

function extractGraphQLErrMessage(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null;
  const response = (err as { response?: { errors?: Array<{ message?: string }> } }).response;
  const errors = response?.errors;
  if (Array.isArray(errors) && errors.length) {
    return errors
      .map((e) => (e && typeof e.message === "string" ? e.message : ""))
      .filter(Boolean)
      .join(" | ")
      .trim();
  }
  return null;
}

function deriveDisplayMessage({
  original,
  graphQL,
  keySummary,
  err,
}: {
  original?: string;
  graphQL: string | null;
  keySummary: string;
  err: unknown;
}): string {
  if (graphQL) return graphQL;
  // graphql-request network error shape may include response.status & statusText
  const http = (err as { response?: { status?: number; statusText?: string } }).response;
  if (http?.status && http.statusText) return `${http.status} ${http.statusText}`;
  if (original && original !== keySummary) return original;
  return "Request failed"; // generic fallback, avoids echoing the key
}

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}

// Helper to create a fetcher that validates arbitrary JSON endpoints with a schema (non-GraphQL)
export function createValidatedJsonFetcher<Schema>(schema: {
  safeParse: (
    data: unknown,
  ) =>
    | { success: true; data: Schema }
    | { success: false; error: { issues: { path: (string | number)[]; message: string }[] } };
}) {
  return async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed ${res.status}`);
    const json = await res.json();
    const result = schema.safeParse(json);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValidationError("Schema validation failed", issues);
    }
    return result.data;
  };
}
