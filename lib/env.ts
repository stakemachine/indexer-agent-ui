/* Centralized environment variable validation and typed exports
 * NOTE: Use lazy getters so Next.js build doesn't require runtime envs.
 */

// List required server-only environment variables
const REQUIRED = ["AGENT_ENDPOINT", "AGENT_NETWORK_ENDPOINT", "UI_LOGIN", "UI_PASS"] as const;
type RequiredEnvKey = (typeof REQUIRED)[number];

function read(name: RequiredEnvKey): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value.trim();
}

export const env = Object.freeze({
  get AGENT_ENDPOINT(): string {
    return read("AGENT_ENDPOINT");
  },
  get AGENT_NETWORK_ENDPOINT(): string {
    return read("AGENT_NETWORK_ENDPOINT");
  },
  get UI_LOGIN(): string {
    return read("UI_LOGIN");
  },
  get UI_PASS(): string {
    return read("UI_PASS");
  },
});

// Helper for network-specific subgraph endpoint creation
export function buildNetworkSubgraphEndpoint(network: string): string {
  // basic allowlist sanitation (extend as needed)
  if (!/^[a-z0-9-]+$/i.test(network)) {
    throw new Error(`Invalid network name: ${network}`);
  }
  const base = env.AGENT_NETWORK_ENDPOINT.endsWith("/") ? env.AGENT_NETWORK_ENDPOINT : `${env.AGENT_NETWORK_ENDPOINT}/`;
  return base + network;
}
