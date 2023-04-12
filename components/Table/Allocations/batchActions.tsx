import request from "graphql-request";
import toast from "react-hot-toast";
import { CREATE_ACTION_MUTATION } from "../../../lib/graphql/queries";
import { ActionInput, ActionStatus, ActionType } from "../../../types/types";

export default function ActiveAllocationsActionsBatch(
  rows,
  mutate,
  toggleAllRowsSelected
) {
  let actions: ActionInput[] = [];
  rows.map((row) => {
    let action: ActionInput = {
      type: ActionType.UNALLOCATE,
      deploymentID: row.original.subgraphDeployment,
      source: "Agent UI",
      reason: "manual",
      status: ActionStatus.QUEUED,
      priority: 0,
      allocationID: row.original.id,
    };
    actions = [...actions, action];
  });
  var variables = {
    actions: actions,
  };
  return (
    <div className="info">
      <div className="flex w-full gap-x-1">
        <button
          className="btn-sm btn"
          onClick={() => {
            request("/api/agent", CREATE_ACTION_MUTATION, variables)
              .then(
                () => (
                  toast.success("Successfully created new action(s)."),
                  toggleAllRowsSelected(false),
                  mutate()
                )
              )
              .catch(() => toast.error("Failed to create new action(s)."));
          }}
        >
          Unalocate
        </button>
      </div>
    </div>
  );
}
