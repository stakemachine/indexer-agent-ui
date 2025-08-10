import type { Variables } from "graphql-request";
import { GraphQLClient } from "graphql-request";
import type { ZodTypeAny } from "zod";
import { z } from "zod"; // runtime schema creation

/**
 * Creates a typed GraphQL fetcher bound to a base endpoint. Supply a Zod schema to validate the response.
 * Returned fetcher is compatible with SWR: (key) => Promise<Data>
 */
export function createSchemaFetcher<Schema extends ZodTypeAny>(options: {
  endpoint: string;
  schema: Schema;
  /** Optional transform applied after schema parse */
  transform?: (data: z.infer<Schema>) => unknown;
}) {
  const client = new GraphQLClient(options.endpoint);
  // reference z to ensure runtime import isn't tree-shaken when schemas are provided dynamically
  void z.null();
  return async (query: string, variables?: Variables | undefined) => {
    try {
      const raw = await client.request(query, variables as Variables);
      const parsed = options.schema.parse(raw);
      return options.transform ? options.transform(parsed) : parsed;
    } catch (err) {
      // Normalize into a fresh Error instance (avoid mutating original which can have read-only message)
      let baseMessage: string;
      if (typeof err === "string") {
        baseMessage = err.slice(0, 500);
      } else if (err instanceof Error) {
        baseMessage = err.message || err.name || "GraphQL error";
      } else {
        baseMessage = (err as { message?: unknown }).message?.toString() || String(err);
      }
      if (!baseMessage.startsWith("[GQL]")) baseMessage = `[GQL] ${baseMessage}`;
      const wrapped = new Error(baseMessage);
      // Preserve original error metadata when possible
      if (err instanceof Error) {
        wrapped.name = err.name || wrapped.name;
        // Attach stack only if exists and different
        if (err.stack) {
          wrapped.stack = err.stack;
        }
      }
      // Provide original as cause (Node 16+/V8 supports this; harmless otherwise)
      try {
        Object.defineProperty(wrapped, "cause", { value: err, enumerable: false, configurable: true });
      } catch {
        /* ignore */
      }
      throw wrapped;
    }
  };
}

/** Wrap a normal JSON fetch with Zod validation */
export function jsonWithSchema<Schema extends ZodTypeAny>(url: string, schema: Schema, init?: RequestInit) {
  return fetch(url, init).then(async (r) => {
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`Request failed ${r.status}: ${text}`);
    }
    const json = await r.json();
    return schema.parse(json);
  });
}

export class ValidationError extends Error {
  issues: string[];
  constructor(message: string, issues: string[]) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

// Safe parse helper producing either { data } or throwing ValidationError for uniform SWR error flow
export function safeParse<Schema extends ZodTypeAny>(schema: Schema, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new ValidationError("Schema validation failed", issues);
  }
  return result.data;
}
