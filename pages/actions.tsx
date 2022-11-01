import React, { useEffect, useState } from "react";
import { ITableProps, kaReducer, Table } from "ka-table";
import {
  deselectAllFilteredRows,
  deselectAllRows,
  deselectRow,
  hideDetailsRow,
  hideLoading,
  insertRow,
  loadData,
  selectAllFilteredRows,
  selectAllVisibleRows,
  selectRow,
  selectRowsRange,
  setSingleAction,
  showDetailsRow,
  showLoading,
  updateData,
} from "ka-table/actionCreators";
import {
  ActionType,
  DataType,
  FilteringMode,
  SortDirection,
  SortingMode,
} from "ka-table/enums";
import { DispatchFunc } from "ka-table/types";
import request, { gql } from "graphql-request";

import { ChildComponents } from "ka-table/models";
import { ICellTextProps, IDataRowProps, IHeadCellProps } from "ka-table/props";
import { kaPropsUtils } from "ka-table/utils";
import CreateActionForm from "../components/Forms/CreateActionForm";
import useSWR from "swr";
import { Card, Metric, Title } from "@tremor/react";

const APPROVE_ACTIONS_MUTATION = gql`
  mutation approveActions($actionIDs: [Int!]!) {
    approveActions(actionIDs: $actionIDs) {
      id
      type
      allocationID
      deploymentID
      amount
      poi
      force
      source
      reason
      priority
      transaction
      status
    }
  }
`;

const CANCEL_ACTIONS_MUTATION = gql`
  mutation cancelActions($actionIDs: [Int!]!) {
    cancelActions(actionIDs: $actionIDs) {
      id
      type
      allocationID
      deploymentID
      amount
      poi
      force
      source
      reason
      priority
      transaction
      status
    }
  }
`;

const DELETE_ACTIONS_MUTATION = gql`
  mutation deleteActions($actionIDs: [Int!]!) {
    deleteActions(actionIDs: $actionIDs) {
      id
      type
      allocationID
      deploymentID
      amount
      poi
      force
      source
      reason
      priority
      transaction
      status
    }
  }
`;

export interface Action {
  id: string;
  type: string;
  deploymentID: string;
  allocationID: string;
  amount: string;
  poi: string;
  force: boolean;
  source: string;
  reason: string;
  priority: number;
  status: string;
  failureReason: string;
  transaction: string;
}

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

const CustomCell: React.FC<ICellTextProps> = ({ value }) => {
  return (
    <div
      className={
        {
          queued: "badge badge-info",
          approved: "badge badge-accent",
          pending: "badge badge-warning",
          success: "badge badge-success",
          failed: "badge badge-error",
          canceled: "badge badge-neutral",
        }[value]
      }
    >
      {value}
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
      <h3>DetailsRow #{rowData.id}</h3>
      <p>Transaction: {rowData.transaction}</p>
      <p>Failure reason: {rowData.failureReason}</p>
      <p>Column 3: {rowData.column3}</p>
      <p>Column 4: {rowData.column4}</p>
    </div>
  );
};

const tablePropsInit: ITableProps = {
  columns: [
    {
      key: "selection-cell",
    },
    { key: "show-hide-details-row" },
    {
      key: "id",
      title: "id",
      dataType: DataType.Number,
      sortDirection: SortDirection.Descend,
    },
    { key: "type", title: "Type", dataType: DataType.String },
    { key: "deploymentID", title: "deploymentID", dataType: DataType.String },
    { key: "allocationID", title: "allocationID", dataType: DataType.String },
    { key: "amount", title: "amount", dataType: DataType.Number },
    { key: "status", title: "status", dataType: DataType.String },
    //{ key: 'transaction', title: 'txid', dataType: DataType.String },
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

const queryStatus = gql`
  {
    actions(filter: {}) {
      id
      type
      deploymentID
      allocationID
      amount
      poi
      force
      source
      reason
      priority
      status
      failureReason
      transaction
    }
  }
`;

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
        case "status":
          return <CustomCell {...props} />;
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
  detailsRow: {
    elementAttributes: () => ({
      style: {
        backgroundColor: "#eee",
      },
    }),
    content: DetailsRow,
  },
};

export default function RemoteDataDemo() {
  const [tableProps, changeTableProps] = useState(tablePropsInit);
  const { data: agentData, error: agentError } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );

  if (agentError) return <div>failed to load</div>;
  if (!agentData) return <div>Loading...</div>;

  const dispatch: DispatchFunc = async (action) => {
    changeTableProps((prevState: ITableProps) => kaReducer(prevState, action));

    if (action.type === ActionType.LoadData) {
      dispatch(showLoading());
      // const result = await request('/api/agent', queryStatus)
      // const actions = result.actions
      dispatch(updateData(agentData?.actions));
      dispatch(hideLoading());
    } else if (action.type === ActionType.UpdatePageIndex) {
      dispatch(setSingleAction(loadData()));
    }
  };
  const selectedData = kaPropsUtils.getSelectedData(tableProps);

  return (
    <>
      <Metric>Actions</Metric>
      <Card marginTop="mt-3">
        <div
          tabIndex={0}
          className="collapse collapse-arrow border-base-300 bg-base-100 m-3 rounded-box border max-w-fit"
        >
          <input type="checkbox" />
          <div className="collapse-title text-xl font-medium">
            Create action
          </div>
          <div className="collapse-content">
            <CreateActionForm />
          </div>
        </div>

        <div className="remote-data-demo m-3">
          {/* <button onClick={() => {
                    const indexerAction: Action = {
                        id: "49",
                        type: "unallocate",
                        deploymentID: "Qmdasfksdfsdfsdfd",
                        allocationID: "0x0000000000000",
                        amount: "230948203",
                        poi: null,
                        force: false,
                        source: "Agent UI",
                        reason: "manual",
                        status: "queued",
                        priority: 0,
                        failureReason: "",
                        transaction: "",
                    }

                    dispatch(insertRow(indexerAction))
                }}>
                    Insert Row Before
                </button> */}
          <Table
            {...tableProps}
            childComponents={daisyComponents}
            dispatch={dispatch}
          />
          {selectedData && (
            <div className="info m-4">
              <div>
                Selected:{" "}
                {selectedData?.map((d, index) => {
                  return <>{d.id}&nbsp;</>;
                })}
                <button
                  className="btn btn-sm m-4"
                  onClick={() => {
                    let actionIDs = selectedData.map((item) => item.id);

                    var variables = {
                      actionIDs: actionIDs,
                    };
                    request("/api/agent", APPROVE_ACTIONS_MUTATION, variables);
                  }}
                >
                  Approve
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    let actionIDs = selectedData.map((item) => item.id);

                    var variables = {
                      actionIDs: actionIDs,
                    };
                    request("/api/agent", CANCEL_ACTIONS_MUTATION, variables);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm m-4"
                  onClick={() => {
                    let actionIDs = selectedData.map((item) => item.id);

                    var variables = {
                      actionIDs: actionIDs,
                    };
                    request("/api/agent", DELETE_ACTIONS_MUTATION, variables);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
