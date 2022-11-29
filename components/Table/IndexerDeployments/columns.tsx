import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";

export type IndexerDeployment = {
  subgraphDeployment: string;
  synced: boolean;
  health: string;
  fatalError: {
    handler: string | null;
    message: string;
  };
  node: string;
  chains: {
    network: string;
    latestBlock: {
      number: number;
    };
    chainHeadBlock: {
      number: number;
    };
    earliestBlock: {
      number: number;
    };
  };
};

const columnHelper = createColumnHelper<IndexerDeployment>();

export const indexerDeploymentsColumns: ColumnDef<IndexerDeployment>[] = [
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
  columnHelper.accessor((row) => row.subgraphDeployment, {
    id: "network",
    header: () => <span>Deployment ID</span>,
  }),
  columnHelper.accessor((row) => row.synced, {
    header: "Synced",
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (info) =>
      info.getValue() ? (
        <div className="tooltip" data-tip="Synced">
          <CheckCircleIcon className="h-6 w-6 fill-success" />
        </div>
      ) : (
        <div className="tooltip" data-tip="Unsynced">
          <XCircleIcon className="h-6 w-6 fill-error" />
        </div>
      ),
  }),
  columnHelper.accessor((row) => row.health, {
    header: "Health",
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (info) =>
      info.getValue() === "failed" ? (
        <div
          className="tooltip tooltip-error"
          data-tip={info.row.original.fatalError.message}
        >
          <ExclamationCircleIcon className="h-6 w-6 fill-error" />
        </div>
      ) : info.getValue() === "healthy" ? (
        <div className="tooltip tooltip-success" data-tip="Healthy">
          <CheckCircleIcon className="h-6 w-6 fill-success" />
        </div>
      ) : (
        info.getValue()
      ),
  }),
  columnHelper.accessor((row) => row.node, {
    header: "Node",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.chains[0].network, {
    header: "Network",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.chains[0].earliestBlock.number, {
    header: "Earliest",
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.chains[0].latestBlock.number, {
    header: "Latest",
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.chains[0].chainHeadBlock.number, {
    header: "Chainhead",
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row.chains[0], {
    header: "Behind",
    enableColumnFilter: false,
    enableGlobalFilter: false,
    cell: (info) =>
      info.row.original.chains[0].chainHeadBlock.number -
      info.row.original.chains[0].latestBlock.number,
  }),
];
