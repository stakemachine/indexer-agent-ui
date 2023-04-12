import { Row } from "@tanstack/react-table";
import request, { gql } from "graphql-request";
import useSWR from "swr";
import CreateCostModelForm from "../components/Forms/CreateCostModel";
import CostModelsActionsBatch from "../components/Table/CostModels/batchActions";
import { costModelColumns } from "../components/Table/CostModels/columns";
import TableComponent from "../components/Table/table";
import { COST_MODELS_LIST_QUERY } from "../lib/graphql/queries";
import { CostModel } from "../types/types";

const renderSubComponent = ({ row }: { row: Row<CostModel> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function ModelsPage() {
  const { data, error, mutate, isValidating } = useSWR(
    COST_MODELS_LIST_QUERY,
    (query) => request<any>("/api/agent", query)
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <span className="text-3xl font-semibold">Cost Models</span>
      <div
        tabIndex={0}
        className="collapse-arrow rounded-box collapse m-3 border border-base-300 bg-base-100"
      >
        <input type="checkbox" />
        <div className="collapse-title text-xl font-medium">
          Create cost model
        </div>
        <div className="collapse-content">
          <CreateCostModelForm mutate={mutate} />
        </div>
      </div>
      <div className="card mt-3 w-full bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <TableComponent
            data={data.costModels}
            columns={costModelColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={CostModelsActionsBatch}
            mutate={mutate}
            isValidating={isValidating}
            meta=""
          />
        </div>
      </div>
    </>
  );
}
