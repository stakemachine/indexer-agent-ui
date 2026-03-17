import type { Variables } from "graphql-request";
import { GraphQLClient } from "graphql-request";
import type { ZodTypeAny } from "zod";
import { z } from "zod"; // runtime schema creation

// Maximum number of characters to include from an error message
const MAX_ERROR_MESSAGE_LENGTH = 500;

/**
 * Creates a typed GraphQL fetcher bound to a base endpoint. Supply a Zod schema to validate the response.
 * Returned fetcher is compatible with SWR: (key) => Promise<Data>
 */
export function createSchemaFetcher<Schema extends ZodTypeAny>(options: {
  endpoint: string;
  schema: Schema;
  /** Optional transform applied after schema parse */
  transform?: (data: z.infer<Schema>) => unknown;
}): (query: string, variables?: Variables | undefined) => Promise<z.infer<Schema>> {
  const client = new GraphQLClient(options.endpoint);
  return async (query: string, variables?: Variables | undefined): Promise<z.infer<Schema>> => {
    try {
      const raw = await client.request(query, variables as Variables);
      const parsed = options.schema.parse(raw) as z.infer<Schema>;
      return options.transform ? (options.transform(parsed) as z.infer<Schema>) : parsed;
    } catch (err) {
      // Normalize into a fresh Error instance (avoid mutating original which can have read-only message)
      let baseMessage = extractErrorMessage(err);
      if (!baseMessage.startsWith("[GQL]")) baseMessage = `[GQL] ${baseMessage}`;
      const wrapped = new Error(baseMessage);
      // Preserve original error metadata when possible
      if (err instanceof Error) {
        if (err.name) {
          wrapped.name = err.name;
        }
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
      const text = await r
        .text()
        .catch((err) => `Unable to read response body: ${err instanceof Error ? err.message : String(err)}`);
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

// Helper function to extract an error message as a string for unknown error types
function extractErrorMessage(err: unknown): string {
  if (typeof err === "string") {
    return err.length > MAX_ERROR_MESSAGE_LENGTH ? err.slice(0, MAX_ERROR_MESSAGE_LENGTH) + "..." : err;
  } else if (err instanceof Error) {
    return err.message || err.name || "GraphQL error";
  } else if (err && typeof err === "object" && "message" in err) {
    // message may be any type; try toString
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (err as any).message?.toString() ?? String(err);
    return msg.length > MAX_ERROR_MESSAGE_LENGTH ? msg.slice(0, MAX_ERROR_MESSAGE_LENGTH) + "..." : msg;
  } else {
    const msg = String(err);
    return msg.length > MAX_ERROR_MESSAGE_LENGTH ? msg.slice(0, MAX_ERROR_MESSAGE_LENGTH) + "..." : msg;
  }
}
