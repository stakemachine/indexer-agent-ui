import { Row } from "@tanstack/react-table";
import Image from "next/image";
import {
  Card,
  Title,
  Text,
  Grid,
  Col,
  Metric,
  Flex,
  Badge,
  List,
  ListItem,
  Bold,
} from "@tremor/react";
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
      <Metric>Dashboard</Metric>
      <Grid numColsLg={6} className="gap-6 mt-3">
        {/* Main section */}
        <Col numColSpanLg={4}>
          <Card className="h-full">
            <div>
              <Flex className="justify-start space-x-6">
                <Image
                  src={indexerData.indexer?.account.image}
                  className="rounded-full w-24"
                  width={128}
                  height={128}
                  alt=""
                />

                <div className="truncate">
                  <div>
                    <Metric>
                      {indexerData.indexer?.defaultDisplayName}.eth
                    </Metric>
                  </div>
                  <div className="mt-3 truncate">
                    <Flex className="justify-between space-x-6 truncate">
                      <div className="truncate">
                        <Flex className="justify-between items-center">
                          <Title>Indexer Address</Title>
                          <Badge color="green">
                            {agentData.indexerRegistration.registered
                              ? "registered"
                              : "unregistered"}
                          </Badge>
                        </Flex>
                        <Text className="truncate">
                          {agentData.indexerRegistration.address}
                        </Text>
                      </div>
                      <div className="truncate">
                        <Flex className="justify-between items-center">
                          <Title>Operator Address</Title>
                          <Badge>TODO ETH</Badge>
                        </Flex>
                        <Text className="truncate">0xTODO</Text>
                      </div>
                    </Flex>
                  </div>
                </div>
              </Flex>
            </div>

            <div className="max-w-xs mt-6">
              <List className="mt-0">
                <ListItem className="space-x-0">
                  <Bold>Indexing Reward Cut</Bold>
                  <span>{indexerData.indexer.indexingRewardCut / 10000}%</span>
                </ListItem>
                <ListItem className="space-x-0">
                  <Bold>Indexing Reward Effective Cut </Bold>
                  <span>
                    {indexerData.indexer.indexingRewardEffectiveCut / 10000}%
                  </span>
                </ListItem>
                <ListItem className="space-x-0">
                  <Bold>Query Fee Cut </Bold>
                  <span>{indexerData.indexer.queryFeeCut / 10000}%</span>
                </ListItem>
                <ListItem className="space-x-0">
                  <Bold>Query Fee Effective Cut </Bold>
                  <span>
                    {indexerData.indexer.queryFeeEffectiveCut / 10000}%
                  </span>
                </ListItem>
                <ListItem className="space-x-0">
                  <Bold>Delegator Parameter Cooldown</Bold>
                  <span>{indexerData.indexer.delegatorParameterCooldown}</span>
                </ListItem>
                <ListItem className="space-x-0">
                  <Bold>Last Delegation Parameter Update</Bold>
                  <div className="tooltip tooltip-left" data-tip="Block number">
                    {indexerData.indexer.lastDelegationParameterUpdate}
                  </div>
                </ListItem>
              </List>
            </div>
          </Card>
        </Col>

        {/* KPI sidebar */}
        <Col numColSpanLg={2}>
          <div className="space-y-6">
            {/* <Card maxWidth="max-w-md">
                            <Block spaceY='space-y-6'>
                                <Block>
                                    <Flex justifyContent="justify-between" alignItems="items-center">
                                        <Title>Indexer Address</Title>
                                        <Badge color="green" text="registered" />
                                    </Flex>
                                    <Text>0x00000e11bFc9759a2645CF75Ba7940296740A679</Text>
                                </Block>
                                <Block>
                                    <Flex justifyContent="justify-between" alignItems="items-center">
                                        <Title>Operator Address</Title>
                                        <Badge text="0.01223 ETH" />
                                    </Flex>
                                    <Text>0x00000e11bFc9759a2645CF75Ba7940296740A679</Text>
                                </Block>
                            </Block>
                        </Card> */}
            <Card className="max-w-md">
              <div className="space-y-6">
                <div>
                  <Flex className="justify-between items-center">
                    <Title>Status URL</Title>
                    <Badge color="green">
                      {agentData.indexerEndpoints.status.healthy
                        ? "healthy"
                        : "unhealthy"}
                    </Badge>
                  </Flex>
                  <Text>{agentData.indexerEndpoints.status.url}</Text>
                </div>
                <div>
                  <Flex className="justify-between items-center">
                    <Title>Service URL</Title>
                    <Badge color="green">
                      {agentData.indexerEndpoints.service.healthy
                        ? "healthy"
                        : "unhealthy"}
                    </Badge>
                  </Flex>
                  <Text>{agentData.indexerEndpoints.service.url}</Text>
                </div>
              </div>
            </Card>
            <Card className="max-w-md">
              <Title>Indexer Location</Title>
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
                className=" rounded-lg shadow-2xl"
              />
            </Card>
          </div>
        </Col>
      </Grid>
      <Grid numCols={4} numColsMd={4} className="gap-6 mt-6">
        <Col>
          <Card className="max-w-md h-full">
            <Text>Total stake</Text>
            <Metric>
              {(
                (indexerData.indexer.stakedTokens -
                  indexerData.indexer.lockedTokens) /
                1000000000000000000
              ).toFixed(0)}{" "}
              GRT
            </Metric>
            {/* <CategoryBar
              categoryPercentageValues={[30, 70]}
              colors={["emerald", "red"]}
              marginTop="mt-4"
              showLabels={false}
              showAnimation={true}
            /> */}
            {/* <Legend
                            categories={["Self Stake", "Delegated"]}
                            colors={["emerald", "red"]}
                            marginTop="mt-3"
                        /> */}
          </Card>
        </Col>
        <Col>
          <Card className="max-w-md h-full">
            <Text>Allocated</Text>
            <Metric>
              {(
                indexerData.indexer.allocatedTokens / 1000000000000000000
              ).toFixed(0)}{" "}
              GRT
            </Metric>
            {/* <ProgressBar percentageValue={90} color="teal" marginTop="mt-2" /> */}
          </Card>
        </Col>
        <Col>
          <Card className="max-w-md h-full">
            <Text>Unallocated</Text>
            <Metric>
              {(
                indexerData.indexer.availableStake / 1000000000000000000
              ).toFixed(0)}{" "}
              GRT
            </Metric>
            {/* <ProgressBar percentageValue={10} color="teal" marginTop="mt-2" /> */}
          </Card>
        </Col>
        <Col>
          <Card className="max-w-md h-full">
            <Text>Delegated capacity</Text>
            <Metric>
              {(
                indexerData.indexer.delegatedCapacity / 1000000000000000000
              ).toFixed(0)}{" "}
              GRT
            </Metric>
            {/* <ProgressBar percentageValue={70} color="teal" marginTop="mt-2" /> */}
          </Card>
        </Col>
        <Col numColSpanLg={4}>
          <div className="card w-full bg-base-100 shadow-xl p-4">
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
        </Col>
        <Col numColSpanLg={4}>
          <div className="card w-full bg-base-100 shadow-xl p-4">
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
        </Col>
      </Grid>
    </>
  );
}
