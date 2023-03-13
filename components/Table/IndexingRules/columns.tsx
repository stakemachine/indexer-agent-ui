import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ethers } from "ethers";
import { NormalizeGRT } from "../../../lib/utils";
import { IndexingRule } from "../../../types/types";

import { IndeterminateCheckbox } from "../table";

const columnHelper = createColumnHelper<IndexingRule>();

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
      <div className="px-1 w-6">
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
];
