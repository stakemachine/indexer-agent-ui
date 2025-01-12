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
      stakedTokens
      allocatedTokens
      lockedTokens
      delegatedTokens
      tokenCapacity
      delegatedCapacity
      availableStake
      indexingRewardCut
      queryFeeCut
      account {
        id
      }
      indexingRewardEffectiveCut
      queryFeeEffectiveCut
      delegatorParameterCooldown
      lastDelegationParameterUpdate
      defaultDisplayName
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
      indexingRewards
      indexingIndexerRewards
      indexingDelegatorRewards
      queryFeesCollected
      poi
      subgraphDeployment {
        manifest {
          network
        }
        ipfsHash
        originalName
        stakedTokens
        signalledTokens
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
