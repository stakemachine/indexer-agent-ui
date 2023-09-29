import { Row } from "@tanstack/react-table";
import { request } from "graphql-request";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { allocationColumns } from "../components/Table/Allocations/columns";
import TableComponent from "../components/Table/table";
import {
  AGENT_INDEXER_REGISTRATION_QUERY,
  ALLOCATIONS_BY_INDEXER_QUERY,
} from "../lib/graphql/queries";
import { EmptyBatchControl } from "../lib/utils";
import {
  Allocation,
  AllocationsListResponse,
  IndexerRegistration,
} from "../types/types";
import { useReadLocalStorage } from "usehooks-ts";

const renderSubComponent = ({ row }: { row: Row<Allocation> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function AllocationsPage() {
  const selectedNetwork = useReadLocalStorage("network");
  const variables = {
    protocolNetwork: selectedNetwork,
  };
  const [subgraphData, setSubgraphData] = useState([]);
  const { data: agentData, error: agentError } = useSWR(
    AGENT_INDEXER_REGISTRATION_QUERY,
    (query) => request<IndexerRegistration>("/api/agent", query, variables),
  );

  const { data, error, mutate, isValidating } = useSWR(
    () => [
      ALLOCATIONS_BY_INDEXER_QUERY,
      agentData.indexerRegistration.address.toLowerCase(),
    ],
    ([query, indexer]) =>
      request<AllocationsListResponse>(
        "/api/subgraph/" + selectedNetwork,
        query,
        { indexer },
      ),
  );
  useEffect(() => {
    if (data) {
      setSubgraphData(data?.allocations);
    }
  }, [data]);

  if (error) {
    return <div>failed to load</div>;
  }
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <span className="text-3xl font-semibold">Allocations</span>
      <div className="card mt-3 w-full bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <TableComponent
            data={subgraphData}
            columns={allocationColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={EmptyBatchControl}
            mutate={mutate}
            isValidating={isValidating}
            meta={{ mutate }}
          />
        </div>
      </div>
    </>
  );
}
