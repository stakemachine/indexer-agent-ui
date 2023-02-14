import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { IndeterminateCheckbox } from "../table";
import { INDEXER_ERROR_MESSAGES } from "../../../lib/errors";
import { CutAddress } from "../../../lib/utils";
export interface Action {
  id: string;
  type: string;
  deploymentID: string;
  allocationID: string;
  amount: string | null;
  poi: string | null;
  force: boolean | null;
  source: string;
  reason: string;
  priority: number;
  status: string;
  failureReason: string;
  transaction: string;
}

const columnHelper = createColumnHelper<Action>();

export const actionsColumns: ColumnDef<Action>[] = [
  {
    id: "select",
    size: 1,
    header: ({ table }) => (
      <div className="px-1 w-6">
        <IndeterminateCheckbox
          {...{
            checked: table.getIsAllPageRowsSelected(),
            indeterminate: table.getIsSomePageRowsSelected(),
            onChange: table.getToggleAllPageRowsSelectedHandler(),
          }}
        />
      </div>
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
    header: "ID",
    enableGlobalFilter: false,
    enableColumnFilter: false,
    maxSize: 0,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.deploymentID, {
    header: "Deployment ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.type, {
    header: "Action",
    maxSize: 10,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.allocationID, {
    header: "Allocation ID",
    enableGlobalFilter: false,
    cell: (info) => (info.getValue() ? CutAddress(info.getValue()) : ""),
  }),
  columnHelper.accessor((row) => row.amount, {
    header: "Amount",
    enableGlobalFilter: false,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.poi, {
    header: "POI",
    enableGlobalFilter: false,
    cell: (info) => (info.getValue() ? CutAddress(info.getValue()) : ""),
  }),
  columnHelper.accessor((row) => row.status, {
    header: "Status",
    maxSize: 10,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (info) => (
      <div
        className={
          {
            queued: "badge badge-info",
            approved: "badge badge-accent",
            pending: "badge badge-warning",
            success: "badge badge-success",
            failed: "badge badge-error",
            canceled: "badge badge-neutral",
          }[info.getValue()]
        }
      >
        {info.getValue() === "failed" ? (
          <div
            className="tooltip"
            data-tip={
              INDEXER_ERROR_MESSAGES[info.row.original.failureReason] ||
              info.row.original.failureReason
            }
          >
            {info.getValue()}
          </div>
        ) : (
          info.getValue()
        )}
      </div>
    ),
  }),
];
