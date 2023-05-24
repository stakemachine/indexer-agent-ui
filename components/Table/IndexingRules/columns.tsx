import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { ColumnDef, RowData, createColumnHelper } from "@tanstack/react-table";
import { ethers } from "ethers";
import { IndexingRule } from "../../../types/types";

import { IndeterminateCheckbox } from "../table";
import CreateIndexingRuleForm from "../../Forms/CreateIndexingRule";
import { KeyedMutator } from "swr";
import { useState } from "react";
import { Modal } from "react-daisyui";

const columnHelper = createColumnHelper<IndexingRule>();

declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    mutate: KeyedMutator<any>;
  }
}

export const indexingRuleColumns: ColumnDef<IndexingRule>[] = [
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
  columnHelper.accessor((row) => row.identifier, {
    header: "Identifier",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.identifierType, {
    header: "Identifier Type",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.allocationAmount, {
    header: "Allocation amount",
    cell: (info) => ethers.formatEther(info.getValue()),
  }),
  // columnHelper.accessor((row) => row.allocationLifetime, {
  //   header: "Allocation lifetime",
  //   enableGlobalFilter: false,
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor((row) => row.autoRenewal, {
  //   header: "Auto Renewal",
  //   enableGlobalFilter: false,
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor((row) => row.maxAllocationPercentage, {
  //   header: "Max Allocation Percentage",
  //   enableGlobalFilter: false,
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor((row) => row.minSignal, {
  //   header: "Min signal",
  //   enableGlobalFilter: false,
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor((row) => row.maxSignal, {
  //   header: "Max signal",
  //   enableGlobalFilter: false,
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor((row) => row.minStake, {
  //   header: "Min stake",
  //   enableGlobalFilter: false,
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor((row) => row.minAverageQueryFees, {
  //   header: "Min average query fees",
  //   enableGlobalFilter: false,
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor((row) => row.custom, {
  //   header: "Custom",
  //   enableGlobalFilter: false,
  //   cell: (info) => info.getValue(),
  // }),
  // columnHelper.accessor((row) => row.requireSupported, {
  //   header: "Require Supported",
  //   enableGlobalFilter: false,
  //   cell: (info) => info.getValue(),
  // }),
  columnHelper.accessor((row) => row.decisionBasis, {
    header: "decisionBasis",
    enableGlobalFilter: false,
    cell: (info) => info.getValue(),
  }),
  columnHelper.display({
    id: "actions",
    cell: function Cell(props) {
      const [visible, setVisible] = useState<boolean>(false);

      const toggleVisible = () => {
        setVisible(!visible);
      };
      const rule = props.row.original;
      return (
        <>
          <div className="flex flex-row space-x-2">
            <PencilSquareIcon
              className="h-6 w-6 hover:cursor-pointer"
              onClick={toggleVisible}
            />

            <Modal open={visible} onClickBackdrop={toggleVisible}>
              <Modal.Header className="font-bold">Edit rule</Modal.Header>

              <Modal.Body>
                <CreateIndexingRuleForm
                  mutate={props.table.options.meta.mutate}
                  defaultValues={{
                    ...rule,
                    allocationAmount: ethers.formatEther(rule.allocationAmount),
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
