import { Row } from "@tanstack/react-table";
import request, { gql } from "graphql-request";
import useSWR from "swr";
import CreateCostModelForm from "../components/Forms/CreateCostModel";
import CostModelsActionsBatch from "../components/Table/CostModels/batchActions";
import { costModelColumns } from "../components/Table/CostModels/columns";
import TableComponent from "../components/Table/table";
import { COST_MODELS_LIST_QUERY } from "../lib/graphql/queries";
import { CostModel } from "../types/types";
import { useState } from "react";
import { Button, Modal } from "react-daisyui";
import { PlusIcon } from "@heroicons/react/24/solid";

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
  const [visible, setVisible] = useState<boolean>(false);
  const toggleVisible = () => {
    setVisible(!visible);
  };
  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <div className="flex justify-between">
        <span className="text-3xl font-semibold">Cost Models</span>
        <Button
          color="primary"
          startIcon={<PlusIcon className="w-4" />}
          animation={true}
          onClick={toggleVisible}
        >
          New Model
        </Button>
        <Modal
          open={visible}
          onClickBackdrop={toggleVisible}
          className="min-w-96 max-w-screen max-h-screen"
        >
          <Modal.Header className="font-bold">New Cost Model</Modal.Header>

          <Modal.Body>
            <CreateCostModelForm
              mutate={mutate}
              defaultValues={{}}
              toggleVisible={toggleVisible}
            />
          </Modal.Body>
        </Modal>
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
            meta={{ mutate }}
          />
        </div>
      </div>
    </>
  );
}
