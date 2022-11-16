import { Row } from "@tanstack/react-table";
import { request, gql } from "graphql-request";
import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  Allocation,
  allocationColumns,
} from "../components/Table/Allocations/columns";
import TableComponent from "../components/Table/table";

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

const allocationsQuery = gql`
  query allocationByIndexerQuery($indexer: String) {
    graphNetwork(id: "1") {
      epochCount
      epochLength
      currentEpoch
      maxAllocationEpochs
    }
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
      }
    }
  }
`;

const renderSubComponent = ({ row }: { row: Row<Allocation> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function AllocationsPage() {
  const [subgraphData, setSubgraphData] = useState([]);
  const { data: agentData, error: agentError } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );

  const { data, error } = useSWR(
    () => [
      allocationsQuery,
      agentData.indexerRegistration.address.toLowerCase(),
    ],
    (query, indexer) => request("/api/subgraph", query, { indexer })
  );
  useEffect(() => {
    if (data) {
      setSubgraphData(data?.allocations);
    }
  }, [data]);

  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <span className="text-3xl font-semibold">Allocations</span>
      <div className="card w-full bg-base-100 shadow-xl mt-3">
        <div className="overflow-x-auto">
          <TableComponent
            data={subgraphData}
            columns={allocationColumns}
            renderSubComponent={renderSubComponent}
          />
        </div>
      </div>
    </>
  );
}
