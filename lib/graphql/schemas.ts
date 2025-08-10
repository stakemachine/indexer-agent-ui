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
  latestBlock: z.object({ number: z.number().or(z.string()) }).optional(),
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

export type AgentAllocationsResponse = z.infer<typeof AgentAllocationsResponseSchema>;
export type IndexerDeploymentsResponse = z.infer<typeof IndexerDeploymentsResponseSchema>;
export type IndexingRulesResponse = z.infer<typeof IndexingRulesResponseSchema>;
export type ActionsResponse = z.infer<typeof ActionsResponseSchema>;
