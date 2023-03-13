import request, { gql } from "graphql-request";
import useSWR from "swr";
import { disputeColumns } from "../components/Table/Disputes/columns";
import TableComponent from "../components/Table/table";
import { AGENT_DISPUTES_QUERY } from "../lib/graphql/queries";
import { EmptyBatchControl } from "../lib/utils";

export default function DisputesPage() {
  const { data, error, mutate, isValidating } = useSWR(
    AGENT_DISPUTES_QUERY,
    (query) => request<any>("/api/agent", query)
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <span className="text-3xl font-semibold">Disputes</span>
      <div className="card w-full bg-base-100 shadow-xl mt-3">
        <div className="overflow-x-auto">
          <TableComponent
            data={data.disputes}
            columns={disputeColumns}
            renderSubComponent=""
            batchControlsComponent={EmptyBatchControl}
            mutate={mutate}
            isValidating={isValidating}
            meta=""
          />
        </div>
      </div>
    </>
  );
}
