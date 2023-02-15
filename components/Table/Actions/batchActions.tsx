import request from "graphql-request";
import toast from "react-hot-toast";
import {
  APPROVE_ACTIONS_MUTATION,
  CANCEL_ACTIONS_MUTATION,
  DELETE_ACTIONS_MUTATION,
} from "../../../lib/graphql/queries";

export default function ActionsBatch(rows, mutate, toggleAllRowsSelected) {
  let actionIDs = rows.map((row) => row.original.id);
  var variables = {
    actionIDs: actionIDs,
  };
  return (
    <div className="info">
      <div className="flex w-full gap-x-1">
        <button
          className="btn btn-sm"
          onClick={() => {
            request("/api/agent", APPROVE_ACTIONS_MUTATION, variables)
              .then(
                () => (
                  toast.success("Successfully approved action(s)."),
                  toggleAllRowsSelected(false),
                  mutate()
                )
              )
              .catch(() => toast.error("Failed to approve action(s)."));
          }}
        >
          Approve
        </button>
        <button
          className="btn btn-sm"
          onClick={() => {
            request("/api/agent", CANCEL_ACTIONS_MUTATION, variables)
              .then(
                () => (
                  toast.success("Successfully canceled action(s)."),
                  toggleAllRowsSelected(false),
                  mutate()
                )
              )
              .catch(() => toast.error("Failed to cancel action(s)."));
          }}
        >
          Cancel
        </button>
        <button
          className="btn btn-sm"
          onClick={() => {
            request("/api/agent", DELETE_ACTIONS_MUTATION, variables)
              .then(
                () => (
                  toast.success("Successfully deleted action(s)."),
                  toggleAllRowsSelected(false),
                  mutate()
                )
              )
              .catch(() => toast.error("Failed to delete action(s)."));
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
