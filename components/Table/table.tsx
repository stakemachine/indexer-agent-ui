import {
  ArrowSmallUpIcon,
  ArrowSmallDownIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import {
  Column,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import { HTMLProps, useEffect, useMemo, useRef, useState } from "react";

function Filter({
  column,
  table,
}: {
  column: Column<any, any>;
  table: Table<any>;
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  return typeof firstValue === "number" ? (
    <>
      <div className="flex space-x-2">
        <input
          type="number"
          value={((column.getFilterValue() as any)?.[0] ?? "") as string}
          onChange={(e) =>
            column.setFilterValue((old: any) => [e.target.value, old?.[1]])
          }
          placeholder={`Min`}
          className="input input-bordered input-xs w-full font-light"
        />
      </div>
      <div>
        <input
          type="number"
          value={((column.getFilterValue() as any)?.[1] ?? "") as string}
          onChange={(e) =>
            column.setFilterValue((old: any) => [old?.[0], e.target.value])
          }
          placeholder={`Max`}
          className="input input-bordered input-xs w-full font-light"
        />
      </div>
    </>
  ) : (
    <input
      type="text"
      value={(column.getFilterValue() ?? "") as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Search...`}
      className="input input-bordered input-xs w-full max-w-xs font-light"
    />
  );
}

export function IndeterminateCheckbox({
  indeterminate,
  className = "checkbox",
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + " cursor-pointer"}
      {...rest}
    />
  );
}

export default function TableComponent({
  data,
  columns,
  renderSubComponent,
  batchControlsComponent,
  mutate,
  isValidating,
  meta,
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const memoizedData = useMemo(() => data, [data]);
  const memoizedColumns = useMemo(() => columns, [columns]);
  const table = useReactTable({
    data: memoizedData,
    columns: memoizedColumns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    meta: meta,
  });
  return (
    <>
      <div className="p-3 flex w-full items-center">
        <div className="flex-none w-96">
          <input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input input-bordered w-full max-w-xs"
            placeholder="Search all columns..."
          />
        </div>
        <div className="flex-auto flex w-full justify-end items-center space-x-3">
          <div>
            {table.getSelectedRowModel().rows.length > 0
              ? "Selected " + Object.keys(rowSelection).length + " item(s)"
              : ""}
          </div>
          {batchControlsComponent(
            table.getSelectedRowModel().rows,
            mutate,
            table.toggleAllRowsSelected
          )}
          <button onClick={() => mutate()}>
            <ArrowPathIcon
              className={isValidating ? "h-6 w-6 animate-spin" : "h-6 w-6"}
            />
          </button>
        </div>
      </div>
      <table className="table table-compact w-full overflow-x-auto">
        <thead>
          {table.getHeaderGroups().map((headerGroup, index) => (
            <tr
              key={index + headerGroup.id}
              id={index.toString() + headerGroup.id}
            >
              {headerGroup.headers.map((header, index) => {
                return (
                  <th
                    key={index + header.id}
                    id={index.toString() + header.id}
                    {...{
                      key: header.id,
                      colSpan: header.colSpan,
                      style: {
                        width: header.getSize(),
                      },
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <>
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "flex cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ArrowSmallUpIcon className="h-4 w-4" />,
                            desc: <ArrowSmallDownIcon className="h-4 w-4" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                        {header.column.getCanFilter() ? (
                          <Filter column={header.column} table={table} />
                        ) : null}
                      </>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => {
            return (
              <>
                <tr
                  key={index + row.id + 1}
                  id={index + row.id + 1}
                  className="hover"
                >
                  {row.getVisibleCells().map((cell, index) => {
                    return (
                      <td
                        key={index + row.id + cell.id + index}
                        id={index + row.id + cell.id + index}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
                {row.getIsExpanded() && (
                  <tr key={index + row.id + index} id={index + row.id + index}>
                    {/* 2nd row is a custom 1 cell row */}
                    <td colSpan={row.getVisibleCells().length}>
                      {renderSubComponent({ row })}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <div className="px-1 w-6">
                <IndeterminateCheckbox
                  {...{
                    checked: table.getIsAllPageRowsSelected(),
                    indeterminate: table.getIsSomePageRowsSelected(),
                    onChange: table.getToggleAllPageRowsSelectedHandler(),
                  }}
                />
              </div>
            </td>
            <td colSpan={20}>Page Rows ({table.getRowModel().rows.length})</td>
          </tr>
        </tfoot>
      </table>
      <div className="flex items-center gap-2 m-2">
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>

      <div className="m-2">
        {Object.keys(rowSelection).length} of{" "}
        {table.getPreFilteredRowModel().rows.length} Total Rows Selected
        {/* {table.getSelectedRowModel().rows.map((row) => (
          <li>{JSON.stringify(row.original, null, 2)}</li>
        ))} */}
      </div>
    </>
  );
}
