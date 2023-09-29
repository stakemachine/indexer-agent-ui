import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { SubgraphDeploymentID } from "../../../lib/subgraphs";
import { CostModel } from "../../../types/types";
import { IndeterminateCheckbox } from "../table";

import { useState } from "react";
import { Modal } from "react-daisyui";

import CreateCostModelForm from "../../Forms/CreateCostModel";

const columnHelper = createColumnHelper<CostModel>();

export const costModelColumns: ColumnDef<CostModel>[] = [
  {
    id: "select",
    size: 1,
    header: ({ table }) => (
      <IndeterminateCheckbox
        {...{
          checked: table.getIsAllRowsSelected(),
          indeterminate: table.getIsSomeRowsSelected(),
          onChange: table.getToggleAllRowsSelectedHandler(),
        }}
      />
    ),
    cell: ({ row }) => (
      <div className="w-6 px-1">
        <IndeterminateCheckbox
          {...{
            checked: row.getIsSelected(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
          }}
        />
      </div>
    ),
  },
  {
    id: "expander",
    size: 1,
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <button
          {...{
            onClick: row.getToggleExpandedHandler(),
            style: { cursor: "pointer" },
          }}
        >
          {row.getIsExpanded() ? (
            <ChevronDownIcon className="h-6 w-6" />
          ) : (
            <ChevronRightIcon className="h-6 w-6" />
          )}
        </button>
      ) : (
        ""
      );
    },
  },
  columnHelper.accessor((row) => row.deployment, {
    header: "DeploymentID",
    cell: (info) => new SubgraphDeploymentID(info.getValue()).ipfsHash,
  }),
  columnHelper.accessor((row) => row.model, {
    header: "Model",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.variables, {
    header: "Variables",
    cell: (info) => info.getValue(),
  }),
  columnHelper.display({
    id: "actions",
    cell: function Cell(props) {
      const [visible, setVisible] = useState<boolean>(false);

      const toggleVisible = () => {
        setVisible(!visible);
      };
      const model = props.row.original;

      return (
        <>
          <div className="flex flex-row space-x-2">
            <PencilSquareIcon
              className="h-6 w-6 hover:cursor-pointer"
              onClick={toggleVisible}
            />

            <Modal open={visible} backdrop={true}>
              <Modal.Header className="font-bold">Edit model</Modal.Header>

              <Modal.Body>
                <CreateCostModelForm
                  mutate={props.table.options.meta.mutate}
                  defaultValues={{
                    ...model,
                    deployment: new SubgraphDeploymentID(
                      props.row.original.deployment,
                    ).ipfsHash,
                  }}
                  toggleVisible={toggleVisible}
                />
              </Modal.Body>
            </Modal>
          </div>
        </>
      );
    },
  }),
];
