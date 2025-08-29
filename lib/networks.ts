import { Caip2ByChainAlias } from "@/lib/utils";

export type Network = {
  id: string;
  label: string;
  caip2?: string;
};

// Canonical list of networks supported by the UI.
// id must match the protocolNetwork identifier expected by the agent/subgraphs.
export const NETWORKS: Network[] = [
  { id: "arbitrum-one", label: "Arbitrum One", caip2: Caip2ByChainAlias["arbitrum-one"] },
  { id: "mainnet", label: "Ethereum Mainnet", caip2: Caip2ByChainAlias.mainnet },
  { id: "sepolia", label: "Sepolia", caip2: Caip2ByChainAlias.sepolia },
  { id: "arbitrum-sepolia", label: "Arbitrum Sepolia", caip2: Caip2ByChainAlias["arbitrum-sepolia"] },
];
