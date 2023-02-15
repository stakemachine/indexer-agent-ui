import { Row } from "@tanstack/react-table";
import request, { gql } from "graphql-request";
import useSWR from "swr";
import {
  CostModel,
  costModelColumns,
} from "../components/Table/CostModels/columns";
import TableComponent from "../components/Table/table";
import { EmptyBatchControl } from "../lib/utils";

const queryStatus = gql`
  {
    costModels {
      deployment
      model
      variables
    }
  }
`;

const renderSubComponent = ({ row }: { row: Row<CostModel> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function ModelsPage() {
  const { data, error, mutate, isValidating } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <span className="text-3xl font-semibold">Cost Models</span>
      <div className="card w-full bg-base-100 shadow-xl mt-3">
        <div className="overflow-x-auto">
          <TableComponent
            data={data.costModels}
            columns={costModelColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={EmptyBatchControl}
            mutate={mutate}
            isValidating={isValidating}
          />
        </div>
      </div>
    </>
  );
}
