import request from "graphql-request";
import toast from "react-hot-toast";
import { DELETE_COST_MODELS_MUTATION } from "../../../lib/graphql/queries";

export default function CostModelsActionsBatch(
  rows,
  mutate,
  toggleAllRowsSelected
) {
  console.log(JSON.stringify(rows));
  let deployments = rows.map((row) => row.original.deployment);

  var variables = {
    deployments: deployments,
  };
  return (
    <div className="info">
      <div className="flex w-full gap-x-1">
        <button
          className="btn btn-sm"
          onClick={() => {
            request("/api/agent", DELETE_COST_MODELS_MUTATION, variables)
              .then(
                () => (
                  toast.success("Successfully deleted cost model(s)."),
                  toggleAllRowsSelected(false),
                  mutate()
                )
              )
              .catch(() => toast.error("Failed to delete cost model(s)."));
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
