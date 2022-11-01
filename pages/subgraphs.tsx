import React, { useState } from "react";
import { request, gql } from "graphql-request";

import useSWR from "swr";

import { Card, Title, Text, Metric } from "@tremor/react";
import SubgraphsTable from "../components/SubgraphsTable";

const queryStatus = gql`
  {
    subgraphs(
      first: 1000
      orderBy: currentSignalledTokens
      orderDirection: desc
      where: { active: true }
    ) {
      id
      displayName
      image
      signalAmount
      signalledTokens
      currentSignalledTokens
      currentVersion {
        description
        subgraphDeployment {
          originalName
          ipfsHash
          stakedTokens
          signalledTokens
          signalAmount
          pricePerShare
          indexingRewardAmount
          network {
            id
          }
          indexerAllocations(
            first: 1
            where: {
              indexer: "0x00000e11bfc9759a2645cf75ba7940296740a679"
              status: "Active"
            }
          ) {
            id
            allocatedTokens
          }
        }
      }
    }
  }
`;

export default function SubgraphsPage() {
  const { data, error } = useSWR(queryStatus, (query) =>
    request("/api/subgraph", query)
  );

  if (error) return <p>Error</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <>
      <Metric>Subgraphs</Metric>
      <Card marginTop="mt-3">
        <SubgraphsTable data={data.subgraphs} />
      </Card>
    </>
  );
}
