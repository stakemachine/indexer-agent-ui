import { Metric, Card } from "@tremor/react";
import request, { gql } from "graphql-request";
import { ITableProps, kaReducer, Table } from "ka-table";
import {
  showLoading,
  updateData,
  hideLoading,
  setSingleAction,
  loadData,
  selectAllVisibleRows,
  deselectAllRows,
  deselectRow,
  selectRow,
  selectRowsRange,
} from "ka-table/actionCreators";
import {
  DataType,
  ActionType,
  SortDirection,
  SortingMode,
  FilteringMode,
} from "ka-table/enums";
import { ChildComponents } from "ka-table/models";
import { ICellTextProps, IHeadCellProps } from "ka-table/props";
import { DispatchFunc } from "ka-table/types";
import { kaPropsUtils } from "ka-table/utils";
import { useState } from "react";
import useSWR from "swr";

const queryStatus = gql`
  {
    costModels {
      deployment
      model
      variables
    }
  }
`;

const SelectionHeader: React.FC<IHeadCellProps> = ({
  dispatch,
  areAllRowsSelected,
}) => {
  return (
    <input
      type="checkbox"
      checked={areAllRowsSelected}
      onChange={(event) => {
        if (event.currentTarget.checked) {
          dispatch(selectAllVisibleRows()); //selectAllFilteredRows()); // also available: selectAllVisibleRows(), selectAllRows()
        } else {
          dispatch(deselectAllRows()); // also available: deselectAllVisibleRows(), deselectAllRows()
        }
      }}
    />
  );
};

const SelectionCell: React.FC<ICellTextProps> = ({
  rowKeyValue,
  dispatch,
  isSelectedRow,
  selectedRows,
}) => {
  return (
    <input
      type="checkbox"
      checked={isSelectedRow}
      onChange={(event: any) => {
        if (event.nativeEvent.shiftKey) {
          dispatch(selectRowsRange(rowKeyValue, [...selectedRows].pop()));
        } else if (event.currentTarget.checked) {
          dispatch(selectRow(rowKeyValue));
        } else {
          dispatch(deselectRow(rowKeyValue));
        }
      }}
    />
  );
};

const daisyComponents: ChildComponents = {
  table: {
    elementAttributes: () => ({
      className: "table table-compact w-full",
    }),
  },
  noDataRow: {
    content: () => "No Data Found",
  },
  pagingIndex: {
    elementAttributes: ({ isActive }) => ({
      className: `btn btn-xs ${isActive ? "btn-active" : ""}`,
    }),
    // content: ({ text, isActive }) => <div className={`btn btn-xs ${(isActive ? 'btn-active' : '')}`}>{text}</div>
  },
  pagingPages: {
    elementAttributes: () => ({
      className: "btn-group",
    }),
  },

  cellText: {
    content: (props) => {
      switch (props.column.key) {
        case "selection-cell":
          return <SelectionCell {...props} />;
      }
    },
  },
  headCell: {
    content: (props) => {
      if (props.column.key === "selection-cell") {
        return (
          <SelectionHeader
            {...props}
            // areAllRowsSelected={kaPropsUtils.areAllFilteredRowsSelected(tableProps)}
            // areAllRowsSelected={kaPropsUtils.areAllVisibleRowsSelected(tableProps)}
          />
        );
      }
    },
  },
  headFilterButton: {
    content: ({ column: { key } }) =>
      key === "show-hide-details-row" ||
      key === "id" ||
      key === "deploymentID" ||
      key === "allocationID" ||
      (key === "amount" && <></>),
  },
};

const tablePropsInit: ITableProps = {
  columns: [
    {
      key: "selection-cell",
    },
    { key: "deployment", title: "deployment", dataType: DataType.String },
    { key: "model", title: "model", dataType: DataType.String },
    { key: "variables", title: "variables", dataType: DataType.String },
  ],
  loading: {
    enabled: true,
  },
  paging: {
    enabled: true,
    pageIndex: 0,
    pageSize: 10,
  },
  singleAction: loadData(),
  rowKeyField: "id",
  sortingMode: SortingMode.Single,
  filteringMode: FilteringMode.HeaderFilter,
};

export default function ModelsPage() {
  const [tableProps, changeTableProps] = useState(tablePropsInit);
  const { data, error } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;

  const dispatch: DispatchFunc = async (action) => {
    changeTableProps((prevState: ITableProps) => kaReducer(prevState, action));

    if (action.type === ActionType.LoadData) {
      dispatch(showLoading());
      // const result = await request('/api/agent', queryStatus)
      // const actions = result.actions
      dispatch(updateData(data?.costModels));
      dispatch(hideLoading());
    } else if (action.type === ActionType.UpdatePageIndex) {
      dispatch(setSingleAction(loadData()));
    }
  };
  const selectedData = kaPropsUtils.getSelectedData(tableProps);

  return (
    <>
      <Metric>Cost Models</Metric>
      <Card marginTop="mt-3">
        <div className="overflow-x-auto p-4">
          <span className="text-lg">Cost Models</span>

          <Table
            {...tableProps}
            childComponents={daisyComponents}
            dispatch={dispatch}
          />
        </div>
      </Card>
    </>
  );
}
