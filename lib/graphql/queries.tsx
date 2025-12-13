import { gql } from "graphql-request";

export const AGENT_STATUS_QUERY = gql`
  query getStatus($protocolNetwork: String!) {
    indexerRegistration(protocolNetwork: $protocolNetwork) {
      url
      address
      registered
      location {
        latitude
        longitude
      }
      protocolNetwork
    }
    indexerDeployments {
      subgraphDeployment
      synced
      health
      fatalError {
        handler
        message
      }
      node
      chains {
        network
        latestBlock {
          number
        }
        chainHeadBlock {
          number
        }
        earliestBlock {
          number
        }
      }
      protocolNetwork
    }
    indexerAllocations(protocolNetwork: $protocolNetwork) {
      id
      indexer
      protocolNetwork
      allocatedTokens
      createdAtEpoch
      closedAtEpoch
      subgraphDeployment
      signalledTokens
      stakedTokens
      ageInEpochs
    }
    indexerEndpoints(protocolNetwork: $protocolNetwork) {
      service {
        url
        healthy
        protocolNetwork
        tests {
          test
          error
          possibleActions
        }
      }
      status {
        url
        healthy
        protocolNetwork
        tests {
          test
          error
          possibleActions
        }
      }
    }
    indexingRules(merged: true) {
      identifier
      identifierType
      allocationAmount
      allocationLifetime
      autoRenewal
      parallelAllocations
      maxAllocationPercentage
      minSignal
      maxSignal
      minStake
      minAverageQueryFees
      custom
      decisionBasis
      requireSupported
    }

    costModels {
      deployment
      model
      variables
    }

    actions(filter: {}) {
      id
      type
      deploymentID
      allocationID
      amount
      poi
      force
      source
      reason
      priority
      status
      failureReason
      transaction
    }
  }
`;

export const AGENT_INDEXER_DEPLOYMENTS_QUERY = gql`
  query getIndexerDeployments($protocolNetwork: String!) {
    indexerDeployments(protocolNetwork: $protocolNetwork) {
      subgraphDeployment
      synced
      health
      fatalError {
        handler
        message
      }
      node
      chains {
        network
        latestBlock {
          number
        }
        chainHeadBlock {
          number
        }
        earliestBlock {
          number
        }
      }
      protocolNetwork
    }
  }
`;

export const AGENT_ALLOCATIONS_QUERY = gql`
  query getAgentAllocations($protocolNetwork: String!) {
    indexerAllocations(protocolNetwork: $protocolNetwork) {
      id
      indexer
      protocolNetwork
      allocatedTokens
      createdAtEpoch
      closedAtEpoch
      subgraphDeployment
      signalledTokens
      stakedTokens
      ageInEpochs
    }
  }
`;

export const APPROVE_ACTIONS_MUTATION = gql`
  mutation approveActions($actionIDs: [Int!]!) {
    approveActions(actionIDs: $actionIDs) {
      id
      type
      allocationID
      deploymentID
      amount
      poi
      force
      source
      reason
      priority
      transaction
      status
    }
  }
`;

export const CANCEL_ACTIONS_MUTATION = gql`
  mutation cancelActions($actionIDs: [Int!]!) {
    cancelActions(actionIDs: $actionIDs) {
      id
      type
      allocationID
      deploymentID
      amount
      poi
      force
      source
      reason
      priority
      transaction
      status
    }
  }
`;

export const DELETE_ACTIONS_MUTATION = gql`
  mutation deleteActions($actionIDs: [Int!]!) {
    deleteActions(actionIDs: $actionIDs) {
      id
      type
      allocationID
      deploymentID
      amount
      poi
      force
      source
      reason
      priority
      transaction
      status
    }
  }
`;

export const CREATE_ACTION_MUTATION = gql`
  mutation queueActions($actions: [ActionInput!]!) {
    queueActions(actions: $actions) {
      id
      type
      deploymentID
      allocationID
      amount
      poi
      force
      source
      reason
      priority
      status
      protocolNetwork
      isLegacy
    }
  }
`;

export const AGENT_DISPUTES_QUERY = gql`
  {
    disputes(status: "potential", minClosedEpoch: 100) {
      allocationID
      allocationIndexer
      allocationAmount
      allocationProof
      closedEpoch
      closedEpochStartBlockHash
      closedEpochStartBlockNumber
      closedEpochReferenceProof
      previousEpochStartBlockHash
      previousEpochStartBlockNumber
      previousEpochReferenceProof
      status
    }
  }
`;

export const GRAPH_NETWORK_INFO_QUERY = gql`
  {
    graphNetwork(id: 1) {
      totalSupply
      totalTokensStaked
      totalDelegatedTokens
      totalTokensSignalled
      totalTokensAllocated
      networkGRTIssuance
      epochLength
      currentEpoch
      epochLength
      maxAllocationEpochs
    }
  }
`;

export const AGENT_INDEXER_REGISTRATION_QUERY = gql`
  query getIndexerRegistration($protocolNetwork: String!) {
    indexerRegistration(protocolNetwork: $protocolNetwork) {
      url
      address
      registered
      location {
        latitude
        longitude
      }
    }
    indexerEndpoints(protocolNetwork: $protocolNetwork) {
      service {
        url
        healthy
        protocolNetwork
        tests {
          test
          error
          possibleActions
        }
      }
      status {
        url
        healthy
        protocolNetwork
        tests {
          test
          error
          possibleActions
        }
      }
    }
  }
`;

export const INDEXER_INFO_BY_ID_QUERY = gql`
  query indexerByIdQuery($id: String) {
    indexer(id:$id){
      id
      createdAt
      account {
        id
      }
      url
      geoHash
      defaultDisplayName
      stakedTokens
      allocatedTokens
      unstakedTokens
      lockedTokens
      tokensLockedUntil
      delegatedTokens
      tokenCapacity
      delegatedCapacity
      availableStake
      allocationCount
      totalAllocationCount
      queryFeesCollected
      queryFeeRebates
      rewardsEarned
      indexerIndexingRewards
      delegatorIndexingRewards
      indexerRewardsOwnGenerationRatio
      transferredToL2
      firstTransferredToL2At
      firstTransferredToL2AtBlockNumber
      firstTransferredToL2AtTx
      lastTransferredToL2At
      lastTransferredToL2AtBlockNumber
      lastTransferredToL2AtTx
      stakedTokensTransferredToL2
      idOnL2
      idOnL1
      ownStakeRatio
      delegatedStakeRatio
      delegatorShares
      delegationExchangeRate
      indexingRewardCut
      indexingRewardEffectiveCut
      overDelegationDilution
      delegatorQueryFees
      queryFeeCut
      queryFeeEffectiveCut
      delegatorParameterCooldown
      lastDelegationParameterUpdate
      forcedClosures
    }
}
`;

export const INDEXER_OPERATORS_QUERY = gql`
  query getIndexerOperators($indexer: String) {
    graphAccounts(where: { operatorOf_: {indexer: $indexer}}) {
      id
    }
}`;

export const ALLOCATIONS_BY_INDEXER_QUERY = gql`
  query allocationByIndexerQuery($indexer: String) {
    allocations(
      first: 1000
      orderBy: createdAt
      orderDirection: desc
      where: { indexer: $indexer }
    ) {
      id
      allocatedTokens
      createdAtEpoch
      closedAtEpoch
      createdAt
      closedAt
      status
      isLegacy
      indexingRewards
      indexingIndexerRewards
      indexingDelegatorRewards
      queryFeesCollected
      poi
      provision {
        dataService {
          id
        }
      }
      subgraphDeployment {
        manifest {
          network
        }
        ipfsHash
        originalName
        stakedTokens
        signalledTokens
        versions(first: 1, orderBy: version, orderDirection: desc) {
          subgraph {
            metadata {
              displayName
              description
            }
          }
        }
      }
    }
  }
`;

export const SUBGRAPHS_BY_STATUS_QUERY = gql`
  query subgraphsByStatusQuery($indexer: String) {
    subgraphs(
      first: 1000
      orderBy: currentSignalledTokens
      orderDirection: desc
      where: { active: true, entityVersion: 2, currentVersion_not: null }
    ) {
      metadata {
        id
        displayName
        image
        description
      }    
      signalAmount
      signalledTokens
      active
      currentSignalledTokens
      currentVersion {
        subgraphDeployment {
          manifest {
            network
            poweredBySubstreams
          }
          originalName
          ipfsHash
          stakedTokens
          createdAt
          deniedAt
          signalledTokens
          signalAmount
          pricePerShare
          indexingRewardAmount
          queryFeesAmount
          indexerAllocations(
            first: 1
            where: { indexer: $indexer, status: "Active" }
          ) {
            id
            allocatedTokens
          }
        }
      }
    }
    graphNetwork(id: 1) {
      totalTokensSignalled
      networkGRTIssuancePerBlock
      totalTokensAllocated
    }
  }
`;

export const ACTIONS_LIST_QUERY = gql`
  {
    actions(filter: {}) {
      id
      type
      deploymentID
      allocationID
      amount
      poi
      force
      source
      reason
      priority
      status
      failureReason
      transaction
      protocolNetwork
    }
  }
`;

export const COST_MODELS_LIST_QUERY = gql`
  {
    costModels {
      deployment
      model
      variables
    }
  }
`;

export const SET_COST_MODEL_MUTATION = gql`
  mutation setCostModel($costModel: CostModelInput!) {
    setCostModel(costModel: $costModel) {
      deployment
      model
      variables
    }
  }
`;

export const INDEXING_RULES_LIST_QUERY = gql`
  {
    indexingRules(merged: true) {
      identifier
      identifierType
      allocationAmount
      allocationLifetime
      autoRenewal
      parallelAllocations
      maxAllocationPercentage
      minSignal
      maxSignal
      minStake
      minAverageQueryFees
      custom
      decisionBasis
      requireSupported
      safety
      protocolNetwork
    }
  }
`;

export const SET_INDEXING_RULE_MUTATION = gql`
  mutation setIndexingRule($rule: IndexingRuleInput!) {
    setIndexingRule(rule: $rule) {
      identifier
      identifierType
      allocationAmount
      allocationLifetime
      autoRenewal
      parallelAllocations
      maxAllocationPercentage
      minSignal
      maxSignal
      minStake
      minAverageQueryFees
      custom
      decisionBasis
      requireSupported
      safety
    }
  }
`;

export const DELETE_INDEXING_RULES_MUTATION = gql`
  mutation deleteIndexingRules($identifiers: [IndexingRuleIdentifier!]!) {
    deleteIndexingRules(identifiers: $identifiers)
  }
`;

export const DELETE_COST_MODELS_MUTATION = gql`
  mutation deleteCostModels($deployments: [String!]!) {
    deleteCostModels(deployments: $deployments) {
      deployment
      model
      variables
    }
  }
`;

// UI: Current epoch widget
export const CURRENT_EPOCH_QUERY = gql`
  query CurrentEpochQuery {
    graphNetwork(id: 1) {
      currentL1BlockNumber
    }
    epoches(first: 1, orderDirection: desc, orderBy: startBlock) {
      id
      startBlock
      endBlock
    }
  }
`;

// Indexer performance query for QoS subgraph
// Example gateway_id: mainnet-arbitrum
export const INDEXER_PERFORMANCE_QUERY = gql`
  query IndexerPerformanceQuery(
    $indexer: String!
    $day_start: BigInt
    $gateway_id: String!
  ) {
    indexerDailyDataPoints(
      first: 1000
      orderBy: dayNumber
      orderDirection: desc
      where: {
          gateway_id: $gateway_id
          indexer: $indexer
          dayStart_gte: $day_start
      }
  ) {
        dayNumber
        chain_id
        gateway_id
        dayStart
        avg_indexer_blocks_behind
        avg_indexer_latency_ms
        avg_query_fee
        max_indexer_blocks_behind
        max_indexer_latency_ms
        max_query_fee
        num_indexer_200_responses
        query_count
        proportion_indexer_200_responses
    }
}
  `;

// Query to get ENS names for a list of indexer addresses
export const INDEXER_ENS_QUERY = gql`
query IndexersENSQuery($addresses: [String!]!) {
    domains(
        where: { resolvedAddress_in: $addresses }
        orderBy: createdAt
        orderDirection: asc
        first: 1000
    ) {
        name
        resolvedAddress {
            id
        }
        labelName
    }
}
`;

// ==================== Provision Management (Horizon) ====================

export const PROVISIONS_QUERY = gql`
  query provisions($protocolNetwork: String!) {
    provisions(protocolNetwork: $protocolNetwork) {
      id
      dataService
      indexer
      tokensProvisioned
      tokensAllocated
      tokensThawing
      thawingPeriod
      maxVerifierCut
      protocolNetwork
      idleStake
    }
  }
`;

export const THAW_REQUESTS_QUERY = gql`
  query thawRequests($protocolNetwork: String!) {
    thawRequests(protocolNetwork: $protocolNetwork) {
      id
      fulfilled
      shares
      thawingUntil
      protocolNetwork
    }
  }
`;

export const ADD_TO_PROVISION_MUTATION = gql`
  mutation addToProvision($protocolNetwork: String!, $amount: String!) {
    addToProvision(protocolNetwork: $protocolNetwork, amount: $amount) {
      dataService
      protocolNetwork
      tokensProvisioned
    }
  }
`;

export const THAW_FROM_PROVISION_MUTATION = gql`
  mutation thawFromProvision($protocolNetwork: String!, $amount: String!) {
    thawFromProvision(protocolNetwork: $protocolNetwork, amount: $amount) {
      dataService
      protocolNetwork
      tokensThawing
      thawingPeriod
      thawingUntil
    }
  }
`;

export const REMOVE_FROM_PROVISION_MUTATION = gql`
  mutation removeFromProvision($protocolNetwork: String!) {
    removeFromProvision(protocolNetwork: $protocolNetwork) {
      indexer
      tokensProvisioned
      tokensThawing
      tokensRemoved
      protocolNetwork
    }
  }
`;
