import { Row } from "@tanstack/react-table";
import request, { gql } from "graphql-request";
import useSWR from "swr";
import {
  IndexingRule,
  indexingRuleColumns,
} from "../components/Table/IndexingRules/columns";
import TableComponent from "../components/Table/table";
import { EmptyBatchControl } from "../lib/utils";
const queryStatus = gql`
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
    }
  }
`;

const renderSubComponent = ({ row }: { row: Row<IndexingRule> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function RulesPage() {
  const { data, error } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <>
      <span className="text-3xl font-semibold">Indexing Rules</span>
      <div className="card w-full bg-base-100 shadow-xl mt-3">
        <div className="overflow-x-auto">
          <TableComponent
            data={data.indexingRules}
            columns={indexingRuleColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={EmptyBatchControl}
          />
        </div>
      </div>
    </>
  );
}
