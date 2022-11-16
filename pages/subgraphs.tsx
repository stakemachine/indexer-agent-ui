import { Row } from "@tanstack/react-table";

import request, { gql } from "graphql-request";
import useSWR from "swr";

import {
  Subgraph,
  SubgraphColumns,
} from "../components/Table/Subgraphs/columns";
import TableComponent from "../components/Table/table";

const subgraphsQuery = gql`
  query allocationByIndexerQuery($indexer: String) {
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
  }
`;

const renderSubComponent = ({ row }: { row: Row<Subgraph> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function ReactTablePage() {
  const { data: agentData, error: agentError } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );

  const { data, error } = useSWR(
    () => [subgraphsQuery, agentData.indexerRegistration.address.toLowerCase()],
    (query, indexer) => request("/api/subgraph", query, { indexer })
  );

  if (error) return <p>Error</p>;
  if (!data) return <p>Loading...</p>;
  return (
    <>
      <span className="text-3xl font-semibold">Subgraphs</span>
      <div className="card w-full bg-base-100 shadow-xl mt-3">
        <div className="overflow-x-auto">
          <TableComponent
            data={data.subgraphs}
            columns={SubgraphColumns}
            renderSubComponent={renderSubComponent}
          />
        </div>
      </div>
    </>
  );
}
