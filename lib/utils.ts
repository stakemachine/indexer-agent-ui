import { type ClassValue, clsx } from "clsx";
import { formatEther } from "ethers";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Caip2ByChainAlias: { [key: string]: string } = {
  mainnet: "eip155:1",
  goerli: "eip155:5",
  gnosis: "eip155:100",
  hardhat: "eip155:1337",
  "arbitrum-one": "eip155:42161",
  "arbitrum-goerli": "eip155:421613",
  avalanche: "eip155:43114",
  matic: "eip155:137",
  celo: "eip155:42220",
  optimism: "eip155:10",
  fantom: "eip155:250",
};

export function resolveChainAlias(id: string): string {
  const aliasMatches = Object.keys(Caip2ByChainAlias).filter((name) => Caip2ByChainAlias[name] === id);
  if (aliasMatches.length === 1) {
    return aliasMatches[0];
  }
  return id;
}

// Numeric formatting helpers
export type FormatGRTOptions = {
  decimals?: number; // number of fractional digits to keep
  withSymbol?: boolean; // append " GRT"
  locale?: string; // Intl locale; defaults to environment
};

function toWeiBigInt(input: string | number | bigint): bigint | null {
  try {
    if (typeof input === "bigint") return input;
    if (typeof input === "number") return BigInt(Math.trunc(input));
    // assume decimal string in wei
    if (typeof input === "string") return BigInt(input);
  } catch {
    return null;
  }
  return null;
}

export function formatGRT(wei: string | number | bigint, opts: FormatGRTOptions = {}): string {
  const { decimals = 2, withSymbol = false, locale } = opts;
  const bi = toWeiBigInt(wei);
  if (bi == null) return withSymbol ? `0 GRT` : "0";
  const asEthStr = formatEther(bi);
  const asNum = Number.parseFloat(asEthStr);
  if (!Number.isFinite(asNum)) return withSymbol ? `0 GRT` : "0";
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.max(0, decimals),
  });
  const out = nf.format(asNum);
  return withSymbol ? `${out} GRT` : out;
}

export function formatPercent(value: number | string, decimals = 2, locale?: string): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0%";
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.max(0, decimals),
  });
  return `${nf.format(num)}%`;
}
