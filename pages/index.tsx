import {
  Card,
  Title,
  Text,
  ColGrid,
  Col,
  Block,
  CategoryBar,
  Metric,
  Flex,
  ProgressBar,
  Badge,
  List,
  ListItem,
  Bold,
} from "@tremor/react";
import request, { gql } from "graphql-request";
import useSWR from "swr";
import IndexerDeploymentsTable from "../components/IndexerDeploymentsTable";

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
  }
}`;

export default function Example() {
  const { data: agentData, error: agentError } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );
  const { data: indexerData, error: indexerError } = useSWR(
    () => [
      indexerInfoQuery,
      agentData.indexerRegistration.address.toLowerCase(),
    ],
    (query, id) => request("/api/subgraph", query, { id })
  );

  if (agentError) return <div>failed to load</div>;
  if (!agentData) return <div>Loading...</div>;

  if (indexerError) return <div>failed to load</div>;
  if (!indexerData) return <div>Loading...</div>;

  return (
    <>
      <Metric>Dashboard</Metric>
      <ColGrid numColsLg={6} gapX="gap-x-6" gapY="gap-y-6" marginTop="mt-3">
        {/* Main section */}
        <Col numColSpanLg={4}>
          <Card hFull={true}>
            <Block>
              <Flex spaceX="space-x-6" justifyContent="justify-between">
                <img
                  src={indexerData.indexer?.account.image}
                  className="rounded-full w-24"
                />

                <Block truncate={true}>
                  <Block>
                    <Metric>
                      {indexerData.indexer?.defaultDisplayName}.eth
                    </Metric>
                  </Block>
                  <Block marginTop="mt-3" truncate={true}>
                    <Flex
                      justifyContent="justify-between"
                      spaceX="space-x-6"
                      truncate={true}
                    >
                      <Block truncate={true}>
                        <Flex
                          justifyContent="justify-between"
                          alignItems="items-center"
                        >
                          <Title>Indexer Address</Title>
                          <Badge
                            color="green"
                            text={
                              agentData.indexerRegistration.registered
                                ? "registered"
                                : "unregistered"
                            }
                          />
                        </Flex>
                        <Text truncate={true}>
                          {agentData.indexerRegistration.address}
                        </Text>
                      </Block>
                      <Block truncate={true}>
                        <Flex
                          justifyContent="justify-between"
                          alignItems="items-center"
                        >
                          <Title>Operator Address</Title>
                          <Badge text="TODO ETH" />
                        </Flex>
                        <Text truncate={true}>0xTODO</Text>
                      </Block>
                    </Flex>
                  </Block>
                </Block>
              </Flex>
            </Block>

            <Block maxWidth="max-w-xs" marginTop="mt-6">
              <List marginTop="mt-0">
                <ListItem spaceX="space-x-0">
                  <Bold>Indexing Reward Cut</Bold>
                  <span>{indexerData.indexer.indexingRewardCut / 10000}%</span>
                </ListItem>
                <ListItem spaceX="space-x-0">
                  <Bold>Indexing Reward Effective Cut </Bold>
                  <span>
                    {indexerData.indexer.indexingRewardEffectiveCut / 10000}%
                  </span>
                </ListItem>
                <ListItem spaceX="space-x-0">
                  <Bold>Query Fee Cut </Bold>
                  <span>{indexerData.indexer.queryFeeCut / 10000}%</span>
                </ListItem>
                <ListItem spaceX="space-x-0">
                  <Bold>Query Fee Effective Cut </Bold>
                  <span>
                    {indexerData.indexer.queryFeeEffectiveCut / 10000}%
                  </span>
                </ListItem>
                <ListItem spaceX="space-x-0">
                  <Bold>Delegator Parameter Cooldown</Bold>
                  <span>{indexerData.indexer.delegatorParameterCooldown}</span>
                </ListItem>
                <ListItem spaceX="space-x-0">
                  <Bold>Last Delegation Parameter Update</Bold>
                  <div className="tooltip tooltip-left" data-tip="Block number">
                    {indexerData.indexer.lastDelegationParameterUpdate}
                  </div>
                </ListItem>
              </List>
            </Block>
          </Card>
        </Col>

        {/* KPI sidebar */}
        <Col numColSpanLg={2}>
          <Block spaceY="space-y-6">
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
            <Card maxWidth="max-w-md">
              <Block spaceY="space-y-6">
                <Block>
                  <Flex
                    justifyContent="justify-between"
                    alignItems="items-center"
                  >
                    <Title>Status URL</Title>
                    <Badge
                      color="green"
                      text={
                        agentData.indexerEndpoints.status.healthy
                          ? "healthy"
                          : "unhealthy"
                      }
                    />
                  </Flex>
                  <Text>{agentData.indexerEndpoints.status.url}</Text>
                </Block>
                <Block>
                  <Flex
                    justifyContent="justify-between"
                    alignItems="items-center"
                  >
                    <Title>Service URL</Title>
                    <Badge
                      color="green"
                      text={
                        agentData.indexerEndpoints.service.healthy
                          ? "healthy"
                          : "unhealthy"
                      }
                    />
                  </Flex>
                  <Text>{agentData.indexerEndpoints.service.url}</Text>
                </Block>
              </Block>
            </Card>
            <Card maxWidth="max-w-md">
              <Title>Indexer Location</Title>
              <img
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
                className=" rounded-lg shadow-2xl"
              />
            </Card>
          </Block>
        </Col>
      </ColGrid>
      <ColGrid
        numCols={4}
        numColsMd={4}
        gapX="gap-x-6"
        gapY="gap-y-6"
        marginTop="mt-6"
      >
        <Col>
          <Card maxWidth="max-w-md" hFull={true}>
            <Text>Total stake</Text>
            <Metric>
              {indexerData.indexer.stakedTokens -
                indexerData.indexer.lockedTokens}{" "}
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
          <Card maxWidth="max-w-md" hFull={true}>
            <Text>Allocated</Text>
            <Metric>{indexerData.indexer.allocatedTokens} GRT</Metric>
            {/* <ProgressBar percentageValue={90} color="teal" marginTop="mt-2" /> */}
          </Card>
        </Col>
        <Col>
          <Card maxWidth="max-w-md" hFull={true}>
            <Text>Unallocated</Text>
            <Metric>{indexerData.indexer.availableStake} GRT</Metric>
            {/* <ProgressBar percentageValue={10} color="teal" marginTop="mt-2" /> */}
          </Card>
        </Col>
        <Col>
          <Card maxWidth="max-w-md" hFull={true}>
            <Text>Available capacity</Text>
            <Metric>{indexerData.indexer.delegatedCapacity} GRT</Metric>
            {/* <ProgressBar percentageValue={70} color="teal" marginTop="mt-2" /> */}
          </Card>
        </Col>
        <Col numColSpanLg={4}>
          <Card>
            <IndexerDeploymentsTable data={agentData.indexerDeployments} />
          </Card>
        </Col>
      </ColGrid>
    </>
  );
}
