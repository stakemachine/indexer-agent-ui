import React, { useCallback, useRef, useState } from "react";

import request from "graphql-request";

import CreateActionForm from "../components/Forms/CreateActionForm";
import useSWR from "swr";

import { Action, actionsColumns } from "../components/Table/Actions/columns";
import TableComponent from "../components/Table/table";
import { Row } from "@tanstack/react-table";
import ActionsBatch from "../components/Table/Actions/batchActions";
import { ActionsListResponse } from "../types/types";
import { ACTIONS_LIST_QUERY } from "../lib/graphql/queries";
import { Button, Modal } from "react-daisyui";
import { PlusIcon } from "@heroicons/react/24/solid";

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
    request<ActionsListResponse>("/api/agent", query),
  );
  const ref = useRef<HTMLDialogElement>(null);
  const toggleVisible = () => {
    setVisible(!visible);
  };
  const handleShow = useCallback(() => {
    ref.current?.showModal();
  }, [ref]);
  const [visible, setVisible] = useState<boolean>(false);

  if (agentError) return <div>failed to load</div>;
  if (!agentData) return <div>Loading...</div>;

  return (
    <>
      <div className="flex justify-between">
        <span className="text-3xl font-semibold">Actions Queue</span>
        <Button
          color="primary"
          startIcon={<PlusIcon className="w-4" />}
          animation={true}
          onClick={handleShow}
        >
          New Action
        </Button>
        <Modal
          open={visible}
          backdrop={true}
          className="max-h-fit max-w-fit"
          ref={ref}
        >
          <Modal.Header className="font-bold">New action</Modal.Header>

          <Modal.Body>
            <CreateActionForm
              mutate={mutate}
              defaultValues={{}}
              toggleVisible={handleShow}
            />
          </Modal.Body>
        </Modal>
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
