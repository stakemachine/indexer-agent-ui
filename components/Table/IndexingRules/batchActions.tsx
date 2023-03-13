import request from "graphql-request";
import toast from "react-hot-toast";
import { DELETE_INDEXING_RULES_MUTATION } from "../../../lib/graphql/queries";

export default function IndexingRulesActionsBatch(
  rows,
  mutate,
  toggleAllRowsSelected
) {
  console.log(JSON.stringify(rows));
  let identifiers = rows.map((row) => row.original.identifier);

  var variables = {
    deployments: identifiers,
  };
  return (
    <div className="info">
      <div className="flex w-full gap-x-1">
        <button
          className="btn btn-sm"
          onClick={() => {
            request("/api/agent", DELETE_INDEXING_RULES_MUTATION, variables)
              .then(
                () => (
                  toast.success("Successfully deleted rule(s)."),
                  toggleAllRowsSelected(false),
                  mutate()
                )
              )
              .catch(() => toast.error("Failed to delete rule(s)."));
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
