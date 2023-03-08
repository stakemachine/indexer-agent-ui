import { gql } from "graphql-request";

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
      networkGRTIssuance
      epochLength
      currentEpoch
      epochLength
      maxAllocationEpochs
    }
  }
`;

export const AGENT_INDEXER_REGISTRATION_QUERY = gql`
  {
    indexerRegistration {
      url
      address
      registered
      location {
        latitude
        longitude
      }
    }
  }
`;

export const INDEXER_INFO_BY_ID_QUERY = gql`
  query indexerByIdQuery($id: String) {
    indexer(id: $id) {
      defaultDisplayName
      account {
        image
      }
    }
  }
`;

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
        ipfsHash
        originalName
        stakedTokens
        signalledTokens
        network {
          id
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
      where: { active: true, entityVersion: 2 }
    ) {
      id
      displayName
      image
      signalAmount
      signalledTokens
      active
      currentSignalledTokens
      currentVersion {
        description
        subgraphDeployment {
          originalName
          ipfsHash
          stakedTokens
          createdAt
          deniedAt
          signalledTokens
          signalAmount
          pricePerShare
          indexingRewardAmount
          network {
            id
          }
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
    }
  }
`;
