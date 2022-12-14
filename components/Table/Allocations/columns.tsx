import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { CutAddress, NormalizeGRT } from "../../../lib/utils";
import { IndeterminateCheckbox } from "../table";

export type Allocation = {
  id: string;
  allocatedTokens: bigint;
  createdAtEpoch: number;
  closedAtEpoch: number | null;
  createdAt: string;
  closedAt: string;
  status: string;
  indexingRewards: bigint;
  indexingIndexerRewards: bigint;
  indexingDelegatorRewards: bigint;
  queryFeesCollected: bigint;
  poi: string | null;
  subgraphDeployment: {
    ipfsHash: string;
    originalName: string;
  };
};

const columnHelper = createColumnHelper<Allocation>();

export const allocationColumns: ColumnDef<Allocation>[] = [
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
  columnHelper.accessor((row) => row.id, {
    id: "network",
    header: () => <span>ID</span>,
    cell: (info) => (info.getValue() ? CutAddress(info.getValue()) : ""),
  }),
  columnHelper.accessor("allocatedTokens", {
    header: "Allocated Tokens",
    cell: (info) => NormalizeGRT(info.getValue()) + " GRT",
  }),
  columnHelper.accessor("createdAtEpoch", {
    enableGlobalFilter: false,
    header: () => <span>Created at Epoch</span>,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("closedAtEpoch", {
    enableGlobalFilter: false,
    header: () => <span>Closed at Epoch</span>,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("indexingRewards", {
    cell: (info) => (
      <>
        <span>{NormalizeGRT(info.getValue())} GRT</span>
        {/* <br />
        <span>
          {NormalizeGRT(info.row.original.indexingIndexerRewards)} GRT
        </span>
        <br />
        <span>
          {NormalizeGRT(info.row.original.indexingDelegatorRewards)} GRT
        </span> */}
      </>
    ),
  }),
  columnHelper.accessor("queryFeesCollected", {}),
  columnHelper.accessor("poi", {
    cell: (info) => (info.getValue() ? CutAddress(info.getValue()) : ""),
  }),
  columnHelper.accessor("status", {
    header: () => <span>Status</span>,
    cell: (info) => info.getValue(),
  }),
];
