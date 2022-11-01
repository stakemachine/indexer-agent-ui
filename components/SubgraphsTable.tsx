import React, { useState } from "react";
import Image from "next/image";

import { ITableProps, kaReducer, Table } from "ka-table";
import { ChildComponents, GroupRowData } from "ka-table/models";
import {
  showLoading,
  updateData,
  hideLoading,
  setSingleAction,
  loadData,
  deselectAllRows,
  selectAllVisibleRows,
  deselectRow,
  selectRow,
  selectRowsRange,
  hideDetailsRow,
  showDetailsRow,
} from "ka-table/actionCreators";
import { DispatchFunc } from "ka-table/types";
import {
  ActionType,
  DataType,
  FilteringMode,
  SortDirection,
  SortingMode,
} from "ka-table/enums";
import { ICellTextProps, IDataRowProps, IHeadCellProps } from "ka-table/props";

const tablePropsInit: ITableProps = {
  columns: [
    {
      key: "selection-cell",
    },
    { key: "show-hide-details-row" },
    { key: "image" },
    {
      key: "currentVersion.subgraphDeployment.ipfsHash",
      title: "deploymentID",
      dataType: DataType.String,
    },
    {
      key: "currentVersion.subgraphDeployment.network.id",
      title: "network",
      dataType: DataType.String,
      style: { textAlign: "center" },
    },
    {
      key: "currentVersion.subgraphDeployment.signalledTokens",
      title: "signalled",
      dataType: DataType.Number,
      style: { textAlign: "right" },
      sortDirection: SortDirection.Descend,
    },
    {
      key: "currentVersion.subgraphDeployment.pricePerShare",
      title: "price per share",
      dataType: DataType.Number,
    },
    {
      key: "currentVersion.subgraphDeployment.stakedTokens",
      title: "staked",
      style: { textAlign: "right" },
      dataType: DataType.Number,
    },
    {
      key: "ratio",
      title: "ratio",
      dataType: DataType.Number,
    },
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

const SelectionHeader: React.FC<IHeadCellProps> = ({
  dispatch,
  areAllRowsSelected,
}) => {
  return (
    <input
      type="checkbox"
      className="checkbox"
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
      className="checkbox"
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

const ToTokensCell: React.FC<ICellTextProps> = ({ value }) => {
  return <div>{(value / 1000000000000000000).toFixed(0)} GRT</div>;
};

const RatioCell: React.FC<ICellTextProps> = ({ value, rowData }) => {
  return <div>{value}</div>;
};

const SubgraphCell: React.FC<ICellTextProps> = ({ value, rowData }) => {
  return (
    <div>
      <div className="font-bold">{rowData.displayName}</div>
      <div className="text-sm opacity-50">{value}</div>
    </div>
  );
};

const SubgraphImageCell: React.FC<ICellTextProps> = ({ value }) => {
  return (
    <div className="avatar">
      <div className="mask mask-squircle w-12 h-12">
        <Image src={value} alt={""} width={12} height={12} />
      </div>
    </div>
  );
};

const DetailsButton: React.FC<ICellTextProps> = ({
  dispatch,
  rowKeyValue,
  isDetailsRowShown,
}) => {
  return (
    <button
      onClick={() => {
        dispatch(
          isDetailsRowShown
            ? hideDetailsRow(rowKeyValue)
            : showDetailsRow(rowKeyValue)
        );
      }}
    >
      {isDetailsRowShown ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      )}
    </button>
  );
};

const DetailsRow: React.FC<IDataRowProps> = ({ rowData }) => {
  return (
    <div>
      <p>{rowData.currentVersion.description}</p>
      <h3>
        DetailsRow #
        {rowData.currentVersion.subgraphDeployment.indexerAllocations[0]?.id}
      </h3>
      <p>
        {(
          rowData.currentVersion.subgraphDeployment.indexingRewardAmount /
          1000000000000000000
        ).toFixed(0)}
      </p>
      <p>
        {" "}
        Signal Amount: {rowData.currentVersion.subgraphDeployment.signalAmount}
      </p>
      <p>
        {rowData.currentVersion.subgraphDeployment.signalledTokens /
          rowData.currentVersion.subgraphDeployment.stakedTokens}
      </p>
      <pre>{JSON.stringify(rowData, null, 2)}</pre>
    </div>
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
        case "show-hide-details-row":
          return <DetailsButton {...props} />;
        case "selection-cell":
          return <SelectionCell {...props} />;
        case "currentVersion.subgraphDeployment.stakedTokens":
          return <ToTokensCell {...props} />;
        case "currentVersion.subgraphDeployment.signalledTokens":
          return <ToTokensCell {...props} />;
        case "currentVersion.subgraphDeployment.ipfsHash":
          return <SubgraphCell {...props} />;
        case "image":
          return <SubgraphImageCell {...props} />;
        case "ratio":
          return <RatioCell {...props} />;
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
      key === "image" ||
      key === "currentVersion.subgraphDeployment.signalledTokens" ||
      key === "currentVersion.subgraphDeployment.stakedTokens" ||
      (key === "currentVersion.subgraphDeployment.ipfsHash" && <></>),
  },
  detailsRow: {
    elementAttributes: () => ({
      style: {
        backgroundColor: "#eee",
      },
    }),
    content: DetailsRow,
  },
};

export default function SubgraphsTable({ data }) {
  const [tableProps, changeTableProps] = useState(tablePropsInit);

  const dispatch: DispatchFunc = async (action) => {
    changeTableProps((prevState: ITableProps) => kaReducer(prevState, action));

    if (action.type === ActionType.LoadData) {
      dispatch(showLoading());
      // const result = await request('/api/agent', queryStatus)
      // const actions = result.actions
      for (var k in data) {
        data[k].ratio =
          data[k].currentVersion.subgraphDeployment.signalledTokens /
          data[k].currentVersion.subgraphDeployment.stakedTokens;
      }
      dispatch(updateData(data));
      dispatch(hideLoading());
    } else if (action.type === ActionType.UpdatePageIndex) {
      dispatch(setSingleAction(loadData()));
    }
  };
  return (
    <Table
      {...tableProps}
      childComponents={daisyComponents}
      dispatch={dispatch}
    />
  );
}
