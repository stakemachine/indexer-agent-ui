import React, { useEffect, useState } from "react";

import request, { gql } from "graphql-request";

import CreateActionForm from "../components/Forms/CreateActionForm";
import useSWR, { useSWRConfig } from "swr";

import { Action, actionsColumns } from "../components/Table/Actions/columns";
import TableComponent from "../components/Table/table";
import { Row } from "@tanstack/react-table";
import ActionsBatch from "../components/Table/Actions/batchActions";

const queryStatus = gql`
  {
    actions(filter: {}) {
      id
      type
      deploymentID
      allocationID
      amount
      poi
      force
      source
      reason
      priority
      status
      failureReason
      transaction
    }
  }
`;

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
  } = useSWR(queryStatus, (query) => request("/api/agent", query));

  if (agentError) return <div>failed to load</div>;
  if (!agentData) return <div>Loading...</div>;

  return (
    <>
      <span className="text-3xl font-semibold">Actions Queue</span>

      <div
        tabIndex={0}
        className="collapse collapse-arrow border-base-300 bg-base-100 m-3 rounded-box border"
      >
        <input type="checkbox" />
        <div className="collapse-title text-xl font-medium">Create action</div>
        <div className="collapse-content">
          <CreateActionForm mutate={mutate} />
        </div>
      </div>
      <div className="card w-full bg-base-100 shadow-xl mt-3">
        <div className="m-3">
          <TableComponent
            data={agentData.actions}
            columns={actionsColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={ActionsBatch}
            mutate={mutate}
            isValidating={isValidating}
          />
        </div>
      </div>
    </>
  );
}
