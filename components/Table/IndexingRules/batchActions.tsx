import request from "graphql-request";
import toast from "react-hot-toast";
import { DELETE_INDEXING_RULES_MUTATION } from "../../../lib/graphql/queries";
import { IndexingRuleIdentifier } from "../../../types/types";

export default function IndexingRulesActionsBatch(
  rows,
  mutate,
  toggleAllRowsSelected,
) {
  let identifiers: IndexingRuleIdentifier[] = rows.map((row) => ({
    identifier: row.original.identifier,
    protocolNetwork: row.original.protocolNetwork,
  }));
  var variables = {
    identifiers: identifiers,
  };
  return (
    <div className="info">
      <div className="flex w-full gap-x-1">
        <button
          className="btn-sm btn"
          onClick={() => {
            request("/api/agent", DELETE_INDEXING_RULES_MUTATION, variables)
              .then(
                () => (
                  toast.success("Successfully deleted rule(s)."),
                  toggleAllRowsSelected(false),
                  mutate()
                ),
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
