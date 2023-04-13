import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { CutAddress, NormalizeGRT } from "../../../lib/utils";
import { IndeterminateCheckbox } from "../table";
import { ethers } from "ethers";

export type ActiveAllocation = {
  id: string;
  allocatedTokens: number;
  createdAtEpoch: number;
  closedAtEpoch: number;
  subgraphDeployment: string;
  signalledTokens: number;
  stakedTokens: number;
};

function stakedTokensAccessor(row: ActiveAllocation) {
  return Number(
    Number(ethers.formatEther(row.stakedTokens).toString()).toFixed(0)
  );
}

function signalledTokensAccessor(row: ActiveAllocation) {
  return Number(
    Number(ethers.formatEther(row.signalledTokens).toString()).toFixed(0)
  );
}

const columnHelper = createColumnHelper<ActiveAllocation>();

export const activeAllocationColumns: ColumnDef<ActiveAllocation>[] = [
  {
    id: "select",
    size: 1,
    header: ({ table }) => (
      <div className="w-6 px-1">
        <IndeterminateCheckbox
          {...{
            checked: table.getIsAllRowsSelected(),
            indeterminate: table.getIsSomeRowsSelected(),
            onChange: table.getToggleAllRowsSelectedHandler(),
          }}
        />
      </div>
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
  columnHelper.accessor((row) => row.id, {
    header: "Allocation ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.subgraphDeployment, {
    header: "Deployment ID",
  }),
  columnHelper.accessor(signalledTokensAccessor, {
    header: "Signalled",
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor(stakedTokensAccessor, {
    header: "Staked",
    enableColumnFilter: false,
    enableGlobalFilter: false,
  }),
  columnHelper.accessor((row) => row.allocatedTokens, {
    header: "Allocated",
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (info) =>
      Number(Number(ethers.formatEther(info.getValue()).toString()).toFixed(0)),
  }),
  columnHelper.accessor("createdAtEpoch", {
    enableGlobalFilter: false,
    enableColumnFilter: false,
    header: () => <span>Created at Epoch</span>,
    cell: (info) => info.getValue(),
  }),
];
