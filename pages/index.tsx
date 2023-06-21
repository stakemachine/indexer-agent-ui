import { Row } from "@tanstack/react-table";
import Image from "next/image";
import request, { gql } from "graphql-request";
import useSWR from "swr";
import { activeAllocationColumns } from "../components/Table/Allocations/activeColumns";
import ActiveAllocationsActionsBatch from "../components/Table/Allocations/batchActions";
import {
  IndexerDeployment,
  indexerDeploymentsColumns,
} from "../components/Table/IndexerDeployments/columns";
import TableComponent from "../components/Table/table";
import { EmptyBatchControl } from "../lib/utils";

const renderSubComponent = ({ row }: { row: Row<IndexerDeployment> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

const queryStatus = gql`
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
    }
    indexerAllocations {
      id
      allocatedTokens
      createdAtEpoch
      closedAtEpoch
      subgraphDeployment
      signalledTokens
      stakedTokens
    }
    indexerEndpoints {
      service {
        url
        healthy
        tests {
          test
          error
          possibleActions
        }
      }
      status {
        url
        healthy
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

const indexerInfoQuery = `query indexerByIdQuery($id: String) {
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
    indexingRewardEffectiveCut
    queryFeeEffectiveCut
    delegatorParameterCooldown
    lastDelegationParameterUpdate
    defaultDisplayName
    account {
      image
    }
    allocations(
      first: 1000
      orderBy: createdAt
      orderDirection: desc
      where: { indexer: $id }
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
      }
    }
  }
}`;

export default function IndexPage() {
  const {
    data: agentData,
    error: agentError,
    mutate: agentMutate,
    isValidating: agentIsValidating,
  } = useSWR(queryStatus, (query) => request<any>("/api/agent", query), {
    refreshInterval: 5000,
  });

  const {
    data: indexerData,
    error: indexerError,
    mutate: indexerMutate,
    isValidating: indexerIsValidating,
  } = useSWR(
    () => [
      indexerInfoQuery,
      agentData.indexerRegistration.address.toLowerCase(),
    ],
    ([query, id]) => request<any>("/api/subgraph", query, { id })
  );

  if (agentError) return <div>failed to load</div>;
  if (!agentData) return <div>Loading...</div>;

  if (indexerError) return <div>failed to load</div>;
  if (!indexerData) return <div>Loading...</div>;

  return (
    <>
      <span className="text-3xl font-semibold">Dashboard</span>

      <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-6">
        {/* Main section */}

        <div className="card col-span-1 bg-base-100 shadow-xl lg:col-span-4">
          <div className="relative h-full w-full p-6 text-left">
            <div>
              <div className="flex w-full flex-row items-center justify-start space-x-6">
                <Image
                  src={indexerData.indexer?.account.image}
                  className="w-24 rounded-full"
                  width={128}
                  height={128}
                  alt=""
                />

                <div className="truncate">
                  <div>
                    <p className="font-semibold">
                      {indexerData.indexer?.defaultDisplayName}.eth
                    </p>
                  </div>
                  <div className="mt-3 truncate">
                    <div className="flex w-full flex-row items-center justify-between space-x-6 truncate">
                      <div className="truncate">
                        <div className="flex w-full flex-row items-center justify-between">
                          <p className="font-medium">Indexer Address</p>
                          <div className="badge-success badge text-green-900">
                            {agentData.indexerRegistration.registered
                              ? "registered"
                              : "unregistered"}
                          </div>
                        </div>
                        <p className="truncate font-light">
                          {agentData.indexerRegistration.address}
                        </p>
                      </div>
                      <div className="truncate">
                        <div className="flex w-full flex-row items-center justify-between">
                          <p className="font-medium">Operator Address</p>
                          <div className="badge-info badge text-cyan-900">
                            TODO ETH
                          </div>
                        </div>
                        <p className="truncate font-light">0xTODO</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 max-w-xs">
              <div className=" mt-0 table w-full  divide-y overflow-hidden">
                <div className="flex w-full items-center justify-between space-x-0 truncate py-2 tabular-nums">
                  <b className="font-medium">Indexing Reward Cut</b>
                  <span>{indexerData.indexer.indexingRewardCut / 10000}%</span>
                </div>
                <div className="flex w-full items-center justify-between space-x-0 truncate py-2 tabular-nums">
                  <b className="font-medium">Indexing Reward Effective Cut </b>
                  <span>
                    {indexerData.indexer.indexingRewardEffectiveCut / 10000}%
                  </span>
                </div>
                <div className="flex w-full items-center justify-between space-x-0 truncate py-2 tabular-nums">
                  <b className="font-medium">Query Fee Cut </b>
                  <span>{indexerData.indexer.queryFeeCut / 10000}%</span>
                </div>
                <div className="flex w-full items-center justify-between space-x-0 truncate py-2 tabular-nums">
                  <b className="font-medium">Query Fee Effective Cut </b>
                  <span>
                    {indexerData.indexer.queryFeeEffectiveCut / 10000}%
                  </span>
                </div>
                <div className="flex w-full items-center justify-between space-x-0 truncate py-2 tabular-nums">
                  <b className="font-medium">Delegator Parameter Cooldown</b>
                  <span>{indexerData.indexer.delegatorParameterCooldown}</span>
                </div>
                <div className="flex w-full items-center justify-between space-x-0 truncate py-2 tabular-nums">
                  <b className="font-medium">
                    Last Delegation Parameter Update
                  </b>
                  <div className="tooltip tooltip-left" data-tip="Block number">
                    {indexerData.indexer.lastDelegationParameterUpdate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card col-span-1 gap-6 bg-base-100 p-6 shadow-xl lg:col-span-2">
          <div className="space-y-6">
            <div className="max-w-md">
              <div className="space-y-6">
                <div>
                  <div className="flex w-full flex-row items-center justify-between">
                    <p className="font-medium">Status URL</p>
                    <div className="badge-success badge text-green-900">
                      {agentData.indexerEndpoints.status.healthy
                        ? "healthy"
                        : "unhealthy"}
                    </div>
                  </div>
                  {agentData.indexerEndpoints.status.url}
                </div>
                <div>
                  <div className="flex w-full flex-row items-center justify-between">
                    <p className="font-medium">Service URL</p>
                    <div className="badge-success badge text-green-900">
                      {agentData.indexerEndpoints.service.healthy
                        ? "healthy"
                        : "unhealthy"}
                    </div>
                  </div>
                  {agentData.indexerEndpoints.service.url}
                </div>
              </div>
            </div>
            <div className="card max-w-md">
              <p className="font-medium">Indexer Location</p>
              <Image
                src={
                  "https://static-maps.yandex.ru/1.x/?lang=en-US&ll=" +
                  agentData.indexerRegistration.location.longitude +
                  "," +
                  agentData.indexerRegistration.location.latitude +
                  "&z=10&l=map,skl&size=650,400&pt=" +
                  agentData.indexerRegistration.location.longitude +
                  "," +
                  agentData.indexerRegistration.location.latitude +
                  ",flag"
                }
                alt=""
                width={650}
                height={400}
                className="mt-2 rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="col-span-1">
          <div className="card relative h-full w-full max-w-md bg-base-100 p-6 text-left shadow-xl">
            Total stake
            <p className="text-2xl font-semibold">
              {(
                (indexerData.indexer.stakedTokens -
                  indexerData.indexer.lockedTokens) /
                1000000000000000000
              ).toFixed(0)}{" "}
              GRT
            </p>
          </div>
        </div>
        <div className="col-span-1">
          <div className="card relative h-full w-full max-w-md bg-base-100 p-6 text-left shadow-xl">
            Allocated
            <p className="text-2xl font-semibold">
              {(
                indexerData.indexer.allocatedTokens / 1000000000000000000
              ).toFixed(0)}{" "}
              GRT
            </p>
          </div>
        </div>
        <div className="col-span-1">
          <div className="card relative h-full w-full max-w-md bg-base-100 p-6 text-left shadow-xl">
            Unallocated
            <p className="text-2xl font-semibold">
              {(
                indexerData.indexer.availableStake / 1000000000000000000
              ).toFixed(0)}{" "}
              GRT
            </p>
          </div>
        </div>
        <div className="col-span-1">
          <div className="card relative h-full w-full max-w-md bg-base-100 p-6 text-left shadow-xl">
            Delegated capacity
            <p className="text-2xl font-semibold">
              {(
                indexerData.indexer.delegatedCapacity / 1000000000000000000
              ).toFixed(0)}{" "}
              GRT
            </p>
          </div>
        </div>
      </div>
      <div className="card mt-6 w-full bg-base-100 p-4 shadow-xl">
        <span className="text-xl">Indexer Deployments</span>
        <div className="overflow-x-auto p-4">
          <TableComponent
            data={agentData.indexerDeployments}
            columns={indexerDeploymentsColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={EmptyBatchControl}
            mutate={agentMutate}
            isValidating={agentIsValidating}
            meta=""
          />
        </div>
      </div>
      <div className="card mt-6 w-full bg-base-100 p-4 shadow-xl">
        <span className="text-xl">Active Allocations</span>
        <div className="overflow-x-auto p-4">
          <TableComponent
            data={agentData.indexerAllocations}
            columns={activeAllocationColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={ActiveAllocationsActionsBatch}
            mutate={agentMutate}
            isValidating={agentIsValidating}
            meta=""
          />
        </div>
      </div>
    </>
  );
}
