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
