import React from "react";

import request from "graphql-request";

import CreateActionForm from "../components/Forms/CreateActionForm";
import useSWR from "swr";

import { Action, actionsColumns } from "../components/Table/Actions/columns";
import TableComponent from "../components/Table/table";
import { Row } from "@tanstack/react-table";
import ActionsBatch from "../components/Table/Actions/batchActions";
import { ActionsListResponse } from "../types/types";
import { ACTIONS_LIST_QUERY } from "../lib/graphql/queries";

const renderSubComponent = ({ row }: { row: Row<Action> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function ActionsPage() {
  const {
    data: agentData,
    error: agentError,
    mutate,
    isValidating,
  } = useSWR(ACTIONS_LIST_QUERY, (query) =>
    request<ActionsListResponse>("/api/agent", query)
  );

  if (agentError) return <div>failed to load</div>;
  if (!agentData) return <div>Loading...</div>;

  return (
    <>
      <span className="text-3xl font-semibold">Actions Queue</span>

      <div
        tabIndex={0}
        className="collapse-arrow rounded-box collapse m-3 border border-base-300 bg-base-100"
      >
        <input type="checkbox" />
        <div className="collapse-title text-xl font-medium">Create action</div>
        <div className="collapse-content">
          <CreateActionForm
            mutate={mutate}
            defaultValues={{}}
            toggleVisible={() => {}}
          />
        </div>
      </div>
      <div className="card mt-3 w-full bg-base-100 shadow-xl">
        <div className="m-3">
          <TableComponent
            data={agentData.actions}
            columns={actionsColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={ActionsBatch}
            mutate={mutate}
            isValidating={isValidating}
            meta=""
          />
        </div>
      </div>
    </>
  );
}
