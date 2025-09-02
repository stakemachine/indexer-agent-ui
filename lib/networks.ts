import { env } from "@/lib/env";
import { Caip2ByChainAlias } from "@/lib/utils";

export type Network = {
  id: string;
  label: string;
  caip2?: string;
  rewards?: {
    ethNode: string;
    contractAddress: string;
  };
};

// Canonical list of networks supported by the UI.
// id must match the protocolNetwork identifier expected by the agent/subgraphs.
export const NETWORKS: Network[] = [
  {
    id: "arbitrum-one",
    label: "Arbitrum One",
    caip2: Caip2ByChainAlias["arbitrum-one"],
    rewards: {
      ethNode: env.ARBITRUM_RPC_URL || "https://arbitrum-one.public.blastapi.io",
      contractAddress: "0x971b9d3d0ae3eca029cab5ea1fb0f72c85e6a525",
    },
  },
  { id: "mainnet", label: "Ethereum Mainnet", caip2: Caip2ByChainAlias.mainnet },
  { id: "sepolia", label: "Sepolia", caip2: Caip2ByChainAlias.sepolia },
  { id: "arbitrum-sepolia", label: "Arbitrum Sepolia", caip2: Caip2ByChainAlias["arbitrum-sepolia"] },
];
