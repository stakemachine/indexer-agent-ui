import BigNumber from "bignumber.js";
export interface ActionsListResponse {
  actions: ActionInput[];
}

export interface ActionInput {
  type: ActionType;
  deploymentID: string;
  allocationID?: string;
  amount?: string;
  poi?: string;
  force?: boolean;
  source: string;
  reason: string;
  status: ActionStatus;
  priority: number | undefined;
}

export interface AllocationsListResponse {
  allocations: Allocation[];
}

export interface Allocation {
  id: string;
  allocatedTokens: bigint;
  createdAtEpoch: number;
  closedAtEpoch: number | null;
  createdAt: string;
  closedAt: string;
  status: string;
  indexingRewards: bigint;
  indexingIndexerRewards: bigint;
  indexingDelegatorRewards: bigint;
  queryFeesCollected: bigint;
  poi: string | null;
  subgraphDeployment: {
    ipfsHash: string;
    originalName: string;
    stakedTokens: bigint;
    signalledTokens: bigint;
    network: {
      id: string;
    };
  };
}

export interface IndexerRegistration {
  indexerRegistration: {
    url: string;
    address: string;
    registered: boolean;
    location: {
      latitude: string;
      longitude: string;
    };
  };
}

export interface GraphNetworkResponse {
  graphNetwork: GraphNetwork;
}

export interface GraphNetwork {
  totalSupply: string;
  totalTokensStaked: string;
  totalTokensSignalled: string;
  totalDelegatedTokens: string;
  networkGRTIssuance: string;
  epochLength: number;
  currentEpoch: number;
  maxAllocationEpochs: number;
  issuancePerYear?: BigNumber;
}

export interface Indexer {
  indexer: {
    defaultDisplayName: string;
    account: {
      image: string;
    };
  };
}

export enum ActionStatus {
  QUEUED = "queued",
  APPROVED = "approved",
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELED = "canceled",
}

export enum ActionType {
  ALLOCATE = "allocate",
  UNALLOCATE = "unallocate",
  REALLOCATE = "reallocate",
}
