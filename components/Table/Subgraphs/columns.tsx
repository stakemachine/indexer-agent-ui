import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { ColumnDef, createColumnHelper, RowData } from "@tanstack/react-table";
import BigNumber from "bignumber.js";
import Image from "next/image";
import { GraphNetwork } from "../../../types/types";
import { IndeterminateCheckbox } from "../table";
import { ethers } from "ethers";
export type Subgraph = {
  metadata: {
    displayName: string;
    description: string | null;
    image: string | null;
  };
  id: string;
  displayName: string;
  image: string | null;
  currentVersion: {
    description: string | null;
    subgraphDeployment: {
      manifest: {
        network: string;
      };
      originalName: string;
      ipfsHash: string;
      stakedTokens: bigint | null;
      signalledTokens: bigint | null;
      signalAmount: string;
      pricePerShare: string;
      deniedAt: number;
      indexingRewardAmount: string;
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

// used purely for sorting
function aprAccessor(row: Subgraph) {
  return BigNumber(
    row.currentVersion.subgraphDeployment.signalledTokens.toString(),
  )
    .dividedBy(
      new BigNumber(
        row.currentVersion.subgraphDeployment.stakedTokens.toString(),
      ),
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
  columnHelper.accessor("image", {
    header: "",
    size: 1,
    enableColumnFilter: false,
    enableSorting: false,
    enableHiding: false,
    cell: (info) => (
      <div className="avatar indicator">
        {info.row.original.currentVersion.subgraphDeployment.deniedAt === 0 ? (
          ""
        ) : (
          <span className="indicator-item indicator-middle indicator-center badge badge-error">
            DENIED
          </span>
        )}
        <div className="mask mask-squircle h-12 w-12">
          <Image
            src={
              info.row.original.metadata?.image
                ? info.row.original.metadata.image
                : ""
            }
            alt={
              info.row.original?.metadata?.displayName +
              " - " +
              info.row.original?.metadata?.description
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
        <div className="font-bold">
          {info.row.original.metadata?.displayName}
        </div>
        <div className="text-sm opacity-50">
          {info.row.original.currentVersion.subgraphDeployment.ipfsHash}
        </div>
      </div>
    ),
    header: () => <span>Subgraph Deployment</span>,
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor(
    (row) => row.currentVersion.subgraphDeployment.manifest.network,
    {
      id: "network",
      header: () => <span>Network</span>,
      cell: (info) => info.getValue(),
    },
  ),
  columnHelper.accessor("currentVersion.subgraphDeployment.stakedTokens", {
    id: "stakedTokens",
    header: () => <span>Staked Tokens</span>,
    enableColumnFilter: false,
    cell: (info) => (+ethers.formatEther(info.getValue())).toFixed(2),
  }),
  columnHelper.accessor("currentVersion.subgraphDeployment.signalledTokens", {
    id: "signalledTokens",
    header: () => <span>Signalled Tokens</span>,
    enableColumnFilter: false,
    cell: (info) => (+ethers.formatEther(info.getValue())).toFixed(2),
  }),
  columnHelper.accessor(aprAccessor, {
    id: "apr",
    enableSorting: true,
    enableColumnFilter: false,
    header: () => "APR",
    cell: (info) =>
      BigNumber(
        info.row.original.currentVersion.subgraphDeployment.signalledTokens.toString(),
      )
        .dividedBy(info.table.options.meta?.graphNetwork.totalTokensSignalled)
        .multipliedBy(info.table.options.meta?.graphNetwork.issuancePerYear)
        .dividedBy(
          BigNumber(
            info.row.original.currentVersion.subgraphDeployment.stakedTokens.toString(),
          ),
        )
        .multipliedBy(100)
        .toFixed(2) + "%",
  }),
  columnHelper.accessor(aprAccessor, {
    id: "proportion",
    enableSorting: true,
    enableColumnFilter: false,
    header: () => "Prop",
    cell: (info) =>
      BigNumber(
        info.row.original.currentVersion.subgraphDeployment.signalledTokens.toString(),
      )
        .dividedBy(info.table.options.meta?.graphNetwork.totalTokensSignalled)
        .dividedBy(
          BigNumber(
            info.row.original.currentVersion.subgraphDeployment.stakedTokens.toString(),
          ).dividedBy(
            info.table.options.meta?.graphNetwork.totalTokensAllocated,
          ),
        )
        .toFixed(3),
    //   +
    // " " +
    // info.row.original.currentVersion.subgraphDeployment.signalledTokens.toString() +
    // " " +
    // info.table.options.meta?.graphNetwork.totalTokensSignalled +
    // " " +
    // info.row.original.currentVersion.subgraphDeployment.stakedTokens.toString() +
    // " " +
    // info.table.options.meta?.graphNetwork.totalTokensAllocated +
    // " " +
    // info.table.options.meta?.graphNetwork.totalDelegatedTokens +
    // " " +
    // info.table.options.meta?.graphNetwork.totalTokensStaked,
  }),
  columnHelper.accessor(aprAccessor, {
    id: "capacity",
    enableSorting: true,
    enableColumnFilter: false,
    header: () => "Available Capacity",
    cell: (info) =>
      BigNumber(info.table.options.meta?.graphNetwork.totalTokensAllocated)
        .multipliedBy(
          BigNumber(
            info.row.original.currentVersion.subgraphDeployment.signalledTokens.toString(),
          ).dividedBy(
            info.table.options.meta?.graphNetwork.totalTokensSignalled,
          ),
        )
        .minus(
          info.row.original.currentVersion.subgraphDeployment.stakedTokens.toString(),
        )
        .dividedBy(1000000000000000000)
        .toFixed(2),
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
                  .indexerAllocations[0]?.allocatedTokens,
              ) / BigInt(1000000000000000000)
            ).toLocaleString()
          : "",
      footer: (props) => props.column.id,
    },
  ),
];
