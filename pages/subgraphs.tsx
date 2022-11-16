import {
  SortingState,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getCoreRowModel,
  getPaginationRowModel,
  createColumnHelper,
} from "@tanstack/react-table";

import request, { gql } from "graphql-request";
import { useState } from "react";
import useSWR from "swr";
import SubgraphsTable from "../components/SubgraphsTable";
import { IndeterminateCheckbox } from "../components/Table/table";

const queryStatus = gql`
  {
    subgraphs(
      first: 1000
      orderBy: currentSignalledTokens
      orderDirection: desc
      where: { active: true }
    ) {
      id
      displayName
      image
      signalAmount
      signalledTokens
      currentSignalledTokens
      currentVersion {
        description
        subgraphDeployment {
          originalName
          ipfsHash
          stakedTokens
          signalledTokens
          signalAmount
          pricePerShare
          indexingRewardAmount
          network {
            id
          }
          indexerAllocations(
            first: 1
            where: {
              indexer: "0x00000e11bfc9759a2645cf75ba7940296740a679"
              status: "Active"
            }
          ) {
            id
            allocatedTokens
          }
        }
      }
    }
  }
`;
type Subgraph = {
  id: string;
  displayName: string;
  image: string;
};

const columnHelper = createColumnHelper<Subgraph>();

const columns = [
  {
    id: "select",
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
      <div className="px-1">
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
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor((row) => row.displayName, {
    id: "displayName",
    cell: (info) => <i>{info.getValue()}</i>,
    header: () => <span>Display Name</span>,
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("image", {
    header: () => "Image",
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
  }),
];

export default function ReactTablePage() {
  //   const { data: subgraphs, error } = useSWR(queryStatus, (query) =>
  //     request("/api/subgraph", query)
  //   );
  //   var data = [
  //     {
  //       id: "sdfsd",
  //       displayName: "dfsdf",
  //       image: "sdfsdf",
  //     },
  //     {
  //       id: "sadfsdfsdfsdfsdf",
  //       displayName: "dfasdfasdf3gl3mlsdf",
  //       image: "sdfgf2sdf",
  //     },
  //     {
  //       id: "s4r0900fjfsd",
  //       displayName: "dfvvnlknadf",
  //       image: "sdfsasddf",
  //     },
  //   ];
  //   const [sorting, setSorting] = useState<SortingState>([]);
  //   const [rowSelection, setRowSelection] = useState({});
  //   const [globalFilter, setGlobalFilter] = useState("");

  //   const table = useReactTable({
  //     data,
  //     columns,
  //     state: {
  //       sorting,
  //       rowSelection,
  //     },
  //     onRowSelectionChange: setRowSelection,
  //     onSortingChange: setSorting,
  //     getSortedRowModel: getSortedRowModel(),
  //     getFilteredRowModel: getFilteredRowModel(),
  //     getCoreRowModel: getCoreRowModel(),
  //     getPaginationRowModel: getPaginationRowModel(),
  //   });
  //   if (error) return <p>Error</p>;
  //   if (!data) return <p>Loading...</p>;
  return (
    <>
      <span className="text-3xl font-semibold">Subgraphs</span>
      <div className="card w-full bg-base-100 shadow-xl mt-3">
        <div className="overflow-x-auto">
          <SubgraphsTable />
        </div>
      </div>
    </>
  );
}
