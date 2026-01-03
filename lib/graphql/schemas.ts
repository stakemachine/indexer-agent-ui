import { z } from "zod";

// Allocation related schemas
export const AllocationSchema = z.object({
  id: z.string(),
  indexer: z.string().optional(),
  protocolNetwork: z.string().optional(),
  allocatedTokens: z.string(),
  createdAtEpoch: z.number().or(z.string()),
  closedAtEpoch: z.number().or(z.string()).nullable().optional(),
  subgraphDeployment: z.string(),
  signalledTokens: z.string().optional(),
  stakedTokens: z.string().optional(),
  ageInEpochs: z.number().or(z.string()).optional(),
});

export const AgentAllocationsResponseSchema = z.object({
  indexerAllocations: z.array(AllocationSchema),
});

export const IndexerDeploymentChainSchema = z.object({
  network: z.string(),
  earliestBlock: z.object({ number: z.number().or(z.string()) }),
  latestBlock: z
    .object({ number: z.number().or(z.string()) })
    .nullable()
    .optional(),
  chainHeadBlock: z.object({ number: z.number().or(z.string()) }),
});

export const IndexerDeploymentSchema = z.object({
  subgraphDeployment: z.string(),
  synced: z.boolean(),
  health: z.union([z.string(), z.boolean()]), // some APIs may return string like "healthy"
  node: z.string(),
  chains: z.array(IndexerDeploymentChainSchema), // allow empty; UI will guard
});

export const IndexerDeploymentsResponseSchema = z.object({
  indexerDeployments: z.array(IndexerDeploymentSchema),
});

export const IndexingRuleSchema = z.object({
  identifier: z.string(),
  identifierType: z.string().nullable().optional(),
  allocationAmount: z.string().nullable().optional(),
  allocationLifetime: z.union([z.number(), z.string()]).nullable().optional(),
  autoRenewal: z.boolean().nullable().optional(),
  parallelAllocations: z.union([z.number(), z.string()]).nullable().optional(),
  maxAllocationPercentage: z.union([z.number(), z.string()]).nullable().optional(),
  minSignal: z.string().nullable().optional(),
  maxSignal: z.string().nullable().optional(),
  minStake: z.string().nullable().optional(),
  minAverageQueryFees: z.string().nullable().optional(),
  custom: z.string().nullable().optional(),
  decisionBasis: z.string().nullable().optional(),
  requireSupported: z.boolean().nullable().optional(),
  safety: z.boolean().nullable().optional(),
  protocolNetwork: z.string(),
});

export const IndexingRulesResponseSchema = z.object({
  indexingRules: z.array(IndexingRuleSchema),
});

export const ActionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string(),
  deploymentID: z.string().nullable().optional(),
  allocationID: z.string().nullable().optional(),
  // Some actions may have a null amount (e.g., certain cancel/delete system actions)
  amount: z.string().nullable().optional(),
  poi: z.string().nullable().optional(),
  force: z.boolean().nullable().optional(),
  source: z.string(),
  reason: z.string(),
  priority: z.union([z.string(), z.number()]),
  status: z.string(),
  failureReason: z.string().nullable().optional(),
  transaction: z.string().nullable().optional(),
  protocolNetwork: z.string(),
});

export const ActionsResponseSchema = z.object({
  actions: z.array(ActionSchema),
});

export const CostModelSchema = z.object({
  deployment: z.string(),
  model: z.string().nullable().optional(),
  variables: z.string().nullable().optional(),
});

export const CostModelsResponseSchema = z.object({
  costModels: z.array(CostModelSchema),
});

// ==================== Provision Management (Horizon) ====================

export const ProvisionSchema = z.object({
  id: z.string(),
  dataService: z.string(),
  indexer: z.string(),
  tokensProvisioned: z.string(),
  tokensAllocated: z.string(),
  tokensThawing: z.string(),
  thawingPeriod: z.string().or(z.number()),
  maxVerifierCut: z.string().or(z.number()),
  protocolNetwork: z.string(),
  idleStake: z.string(),
});

export const ProvisionsResponseSchema = z.object({
  provisions: z.array(ProvisionSchema),
});

export const ThawRequestSchema = z.object({
  id: z.string(),
  fulfilled: z.string().or(z.boolean()), // Agent returns string, but could be boolean
  shares: z.string(),
  thawingUntil: z.string().or(z.number()),
  protocolNetwork: z.string(),
});

export const ThawRequestsResponseSchema = z.object({
  thawRequests: z.array(ThawRequestSchema),
});

export const AddToProvisionResultSchema = z.object({
  addToProvision: z.object({
    dataService: z.string(),
    protocolNetwork: z.string(),
    tokensProvisioned: z.string(),
  }),
});

export const ThawFromProvisionResultSchema = z.object({
  thawFromProvision: z.object({
    dataService: z.string(),
    protocolNetwork: z.string(),
    tokensThawing: z.string(),
    thawingPeriod: z.string().or(z.number()),
    thawingUntil: z.string(),
  }),
});

export const RemoveFromProvisionResultSchema = z.object({
  removeFromProvision: z.object({
    indexer: z.string(),
    tokensProvisioned: z.string(),
    tokensThawing: z.string(),
    tokensRemoved: z.string(),
    protocolNetwork: z.string(),
  }),
});

// ==================== Delegators ====================

export const DelegatorSchema = z.object({
  id: z.string(),
  totalStakedTokens: z.string(),
  totalUnstakedTokens: z.string(),
  stakesCount: z.number(),
  activeStakesCount: z.number(),
  createdAt: z.number(),
  totalRealizedRewards: z.string(),
});

export const DelegatedStakeSchema = z.object({
  id: z.string(),
  delegator: DelegatorSchema,
  indexer: z.object({
    id: z.string(),
  }),
  stakedTokens: z.string(),
  shareAmount: z.string(),
  lockedTokens: z.string(),
  lockedUntil: z.number(),
  realizedRewards: z.string(),
  createdAt: z.number(),
  lastDelegatedAt: z.number().nullable().optional(),
  lastUndelegatedAt: z.number().nullable().optional(),
  unstakedTokens: z.string(),
});

export const DelegatedStakesResponseSchema = z.object({
  indexer: z
    .object({
      delegatedTokens: z.string(),
      delegatorShares: z.string(),
    })
    .nullable(),
  delegatedStakes: z.array(DelegatedStakeSchema),
});

export const DelegatorCountResponseSchema = z.object({
  delegatedStakes: z.array(z.object({ id: z.string() })),
});

export type AgentAllocationsResponse = z.infer<typeof AgentAllocationsResponseSchema>;
export type IndexerDeploymentsResponse = z.infer<typeof IndexerDeploymentsResponseSchema>;
export type IndexingRulesResponse = z.infer<typeof IndexingRulesResponseSchema>;
export type ActionsResponse = z.infer<typeof ActionsResponseSchema>;
export type CostModelsResponse = z.infer<typeof CostModelsResponseSchema>;
export type ProvisionsResponse = z.infer<typeof ProvisionsResponseSchema>;
export type ThawRequestsResponse = z.infer<typeof ThawRequestsResponseSchema>;
export type AddToProvisionResult = z.infer<typeof AddToProvisionResultSchema>;
export type ThawFromProvisionResult = z.infer<typeof ThawFromProvisionResultSchema>;
export type RemoveFromProvisionResult = z.infer<typeof RemoveFromProvisionResultSchema>;
export type DelegatedStakesResponse = z.infer<typeof DelegatedStakesResponseSchema>;
export type DelegatorCountResponse = z.infer<typeof DelegatorCountResponseSchema>;
export type Delegator = z.infer<typeof DelegatorSchema>;
export type DelegatedStake = z.infer<typeof DelegatedStakeSchema>;
