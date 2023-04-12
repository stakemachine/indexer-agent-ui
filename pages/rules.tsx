import { Row } from "@tanstack/react-table";
import request, { gql } from "graphql-request";
import useSWR from "swr";
import CreateIndexingRuleForm from "../components/Forms/CreateIndexingRule";
import IndexingRulesActionsBatch from "../components/Table/IndexingRules/batchActions";
import { indexingRuleColumns } from "../components/Table/IndexingRules/columns";
import TableComponent from "../components/Table/table";
import { INDEXING_RULES_LIST_QUERY } from "../lib/graphql/queries";
import { IndexingRule } from "../types/types";

const renderSubComponent = ({ row }: { row: Row<IndexingRule> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function RulesPage() {
  const { data, error, mutate, isValidating } = useSWR(
    INDEXING_RULES_LIST_QUERY,
    (query) => request<any>("/api/agent", query)
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <>
      <span className="text-3xl font-semibold">Indexing Rules</span>
      <div
        tabIndex={0}
        className="collapse-arrow rounded-box collapse m-3 border border-base-300 bg-base-100"
      >
        <input type="checkbox" />
        <div className="collapse-title text-xl font-medium">
          Create indexing rule
        </div>
        <div className="collapse-content">
          <CreateIndexingRuleForm mutate={mutate} />
        </div>
      </div>
      <div className="card mt-3 w-full bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <TableComponent
            data={data.indexingRules}
            columns={indexingRuleColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={IndexingRulesActionsBatch}
            mutate={mutate}
            isValidating={isValidating}
            meta=""
          />
        </div>
      </div>
    </>
  );
}
