import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { ColumnDef, createColumnHelper, RowData } from "@tanstack/react-table";
import BigNumber from "bignumber.js";
import Image from "next/image";
import { GraphNetwork } from "../../../types/types";
import { IndeterminateCheckbox } from "../table";
export type Subgraph = {
  id: string;
  displayName: string;
  image: string | null;
  currentVersion: {
    description: string | null;
    subgraphDeployment: {
      originalName: string;
      ipfsHash: string;
      stakedTokens: bigint | null;
      signalledTokens: bigint | null;
      signalAmount: string;
      pricePerShare: string;
      indexingRewardAmount: string;
      network: {
        id: string;
      };
      indexerAllocations: {
        id: string | null;
        allocatedTokens: bigint | null;
      };
    };
  };
};

declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    graphNetwork: GraphNetwork;
  }
}

// user purely for sorting
function aprAccessor(row: Subgraph) {
  return BigNumber(
    row.currentVersion.subgraphDeployment.signalledTokens.toString()
  )
    .dividedBy(
      new BigNumber(
        row.currentVersion.subgraphDeployment.stakedTokens.toString()
      )
    )
    .multipliedBy(100)
    .toFixed(2);
}

const columnHelper = createColumnHelper<Subgraph>();

export const SubgraphColumns: ColumnDef<Subgraph>[] = [
  {
    id: "select",
    size: 1,
    header: ({ table }) => (
      <div className="px-1 w-6">
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
  columnHelper.accessor("image", {
    header: "",
    size: 1,
    enableColumnFilter: false,
    enableSorting: false,
    enableHiding: false,
    cell: (info) => (
      <div className="avatar">
        <div className="mask mask-squircle w-12 h-12">
          <Image
            src={info.row.getValue("image")}
            alt={
              info.row.original.displayName +
              " - " +
              info.row.original.currentVersion.description
            }
            height={32}
            width={32}
          />
        </div>
      </div>
    ),
    footer: (props) => props.column.id,
  }),
  columnHelper.accessor((row) => row.displayName, {
    id: "displayName",
    cell: (info) => (
      <div>
        <div className="font-bold">{info.getValue()}</div>
        <div className="text-sm opacity-50">
          {info.row.original.currentVersion.subgraphDeployment.ipfsHash}
        </div>
      </div>
    ),
    header: () => <span>Subgraph Deployment</span>,
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor(
    (row) => row.currentVersion.subgraphDeployment.network?.id,
    {
      id: "network",
      header: () => <span>Network</span>,
      cell: (info) => info.getValue(),
    }
  ),
  columnHelper.accessor("currentVersion.subgraphDeployment.stakedTokens", {
    id: "stakedTokens",
    header: () => <span>Staked Tokens</span>,
    enableColumnFilter: false,
    cell: (info) =>
      (BigInt(info.getValue()) / BigInt(1000000000000000000)).toLocaleString() +
      " GRT",
  }),
  columnHelper.accessor("currentVersion.subgraphDeployment.signalledTokens", {
    id: "signalledTokens",
    header: () => <span>Signalled Tokens</span>,
    enableColumnFilter: false,
    cell: (info) =>
      (BigInt(info.getValue()) / BigInt(1000000000000000000)).toLocaleString() +
      " GRT",
  }),
  columnHelper.accessor(aprAccessor, {
    id: "apr",
    enableSorting: true,
    enableColumnFilter: false,
    header: () => "APR",
    cell: (info) =>
      BigNumber(
        info.row.original.currentVersion.subgraphDeployment.signalledTokens.toString()
      )
        .dividedBy(info.table.options.meta?.graphNetwork.totalTokensSignalled)
        .multipliedBy(info.table.options.meta?.graphNetwork.issuancePerYear)
        .dividedBy(
          BigNumber(
            info.row.original.currentVersion.subgraphDeployment.stakedTokens.toString()
          )
        )
        .multipliedBy(100)
        .toFixed(2) + "%",
  }),
  columnHelper.accessor(
    "currentVersion.subgraphDeployment.indexerAllocations",
    {
      id: "currentVersion.subgraphDeployment.indexerAllocations",
      header: () => <span>My Allo</span>,
      enableColumnFilter: false,
      cell: (info) =>
        info.row.original.currentVersion.subgraphDeployment
          .indexerAllocations[0]?.allocatedTokens
          ? (
              BigInt(
                info.row.original.currentVersion.subgraphDeployment
                  .indexerAllocations[0]?.allocatedTokens
              ) / BigInt(1000000000000000000)
            ).toLocaleString() + " GRT"
          : "",
      footer: (props) => props.column.id,
    }
  ),
];
