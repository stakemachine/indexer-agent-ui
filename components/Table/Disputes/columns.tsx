import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { POIDispute } from "../../../types/types";

import { IndeterminateCheckbox } from "../table";

const columnHelper = createColumnHelper<POIDispute>();

export const disputeColumns: ColumnDef<POIDispute>[] = [
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
  columnHelper.accessor((row) => row.allocationID, {
    header: "AllocationID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.allocationIndexer, {
    header: "Allocation Indexer",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.allocationAmount, {
    header: "Allocation Amount",
    cell: (info) => info.getValue(),
  }),
];
