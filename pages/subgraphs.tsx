import { Row } from "@tanstack/react-table";
import BigNumber from "bignumber.js";

import request, { gql } from "graphql-request";
import useSWR from "swr";
import Web3 from "web3";

import {
  Subgraph,
  SubgraphColumns,
} from "../components/Table/Subgraphs/columns";
import TableComponent from "../components/Table/table";
import {
  AGENT_INDEXER_REGISTRATION_QUERY,
  GRAPH_NETWORK_INFO_QUERY,
  SUBGRAPHS_BY_STATUS_QUERY,
} from "../lib/graphql/queries";
import { EmptyBatchControl } from "../lib/utils";
import { GraphNetworkResponse, IndexerRegistration } from "../types/types";
import { useReadLocalStorage } from "usehooks-ts";

const renderSubComponent = ({ row }: { row: Row<Subgraph> }) => {
  return (
    <pre style={{ fontSize: "10px" }}>
      <code>{JSON.stringify(row.original, null, 2)}</code>
    </pre>
  );
};

export default function ReactTablePage() {
  const selectedNetwork = useReadLocalStorage("network");
  const {
    data: agentData,
    error: agentError,
    mutate,
    isValidating,
  } = useSWR<IndexerRegistration>(
    () => [AGENT_INDEXER_REGISTRATION_QUERY, selectedNetwork],
    ([query, selectedNetwork]) =>
      request<any>("/api/agent", query, { protocolNetwork: selectedNetwork }),
  );

  const { data, error } = useSWR(
    () => [
      SUBGRAPHS_BY_STATUS_QUERY,
      agentData.indexerRegistration.address.toLowerCase(),
    ],
    ([query, indexer]) =>
      request<any>("/api/subgraph/" + selectedNetwork, query, { indexer }),
  );

  const { data: graphNetworkData } = useSWR<GraphNetworkResponse>(
    GRAPH_NETWORK_INFO_QUERY,
    (query) => request<any>("/api/subgraph/" + selectedNetwork, query),
  );
  if (error) return <p>Error</p>;
  if (!data) return <p>Loading...</p>;

  // const pctIssuancePerBlock = new BigNumber(
  //   Web3.utils
  //     .fromWei(
  //       graphNetworkData.graphNetwork.networkGRTIssuancePerBlock,
  //       "ether",
  //     )
  //     .toString(),
  // ).minus(1);
  // let bigNumber = BigNumber;
  // bigNumber.config({ POW_PRECISION: 100 });
  // const pctIssuancePerYear = new bigNumber(
  //   graphNetworkData.graphNetwork.networkGRTIssuancePerBlock,
  // )
  //   .plus(1)
  //   .pow(2354250)
  //   .minus(1);

  // const issuancePerBlock = pctIssuancePerBlock.multipliedBy(
  //   graphNetworkData.graphNetwork.totalSupply,
  // );
  // const issuancePerYear = pctIssuancePerYear.multipliedBy(
  //   graphNetworkData.graphNetwork.totalSupply,
  // );

  // graphNetworkData.graphNetwork.issuancePerYear = issuancePerYear;

  // const uniqueSubgraphs = [
  //   ...new Map(
  //     data.subgraphs.map((s) => [
  //       s.currentVersion.subgraphDeployment.ipfsHash,
  //       s,
  //     ])
  //   ).values(),
  // ];

  return (
    <>
      <span className="text-3xl font-semibold">Subgraphs</span>
      {selectedNetwork}
      <div className="card mt-3 w-full bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <TableComponent
            data={data.subgraphs}
            columns={SubgraphColumns}
            renderSubComponent={renderSubComponent}
            batchControlsComponent={EmptyBatchControl}
            mutate={mutate}
            isValidating={isValidating}
            meta={graphNetworkData}
          />
        </div>
      </div>
    </>
  );
}
