import { Metric, Card } from "@tremor/react";
import { request, gql } from "graphql-request";
import useSWR from "swr";

const queryStatus = gql`
  {
    indexerRegistration {
      url
      address
      registered
      location {
        latitude
        longitude
      }
    }
  }
`;

const allocationsQuery = gql`
  query allocationByIndexerQuery($indexer: String) {
    graphNetwork(id: "1") {
      epochCount
      epochLength
      currentEpoch
      maxAllocationEpochs
    }
    allocations(first: 1000, where: { indexer: $indexer }) {
      id
      allocatedTokens
      createdAtEpoch
      closedAtEpoch
      createdAt
      closedAt
      status
      indexingRewards
      poi
      subgraphDeployment {
        ipfsHash
        originalName
      }
    }
  }
`;

export default function AllocationsPage() {
  const { data: agentData, error: agentError } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );

  const { data, error } = useSWR(
    () => [
      allocationsQuery,
      agentData.indexerRegistration.address.toLowerCase(),
    ],
    (query, indexer) => request("/api/subgraph", query, { indexer })
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <Metric>Allocations</Metric>
      <Card marginTop="mt-3">
        <div className="overflow-x-auto p-4">
          <span className="text-lg">Current allocations</span>
          <table className="table table-compact w-full">
            <thead>
              <tr>
                <th>Allocation ID</th>
                <th>SubgraphDeployment</th>
                <th>Status</th>
                <th>allocatedTokens</th>
                <th>createdAtEpoch</th>
                <th>closedAtEpoch</th>
                <th>Old</th>
                <th>Indexing rewards</th>
                <th>POI</th>
                <th>Lifetime</th>
              </tr>
            </thead>
            <tbody>
              {data.allocations?.map((allo, index) => {
                return (
                  <>
                    <tr>
                      <td>{allo.id}</td>
                      <td>{allo.subgraphDeployment.ipfsHash}</td>
                      <td>{allo.status}</td>
                      <td>{allo.allocatedTokens.slice(0, -18)} GRT</td>
                      <td>{allo.createdAtEpoch}</td>
                      <td>{allo.closedAtEpoch}</td>
                      <td>
                        {allo.closedAtEpoch
                          ? allo.closedAtEpoch - allo.createdAtEpoch
                          : data.graphNetwork.currentEpoch -
                            allo.createdAtEpoch}
                      </td>
                      <td>{allo.indexingRewards.slice(0, -18)} GRT</td>
                      <td>{allo.poi}</td>
                      <td>
                        {new Date(allo.createdAt * 1000).toLocaleString()} -{" "}
                        {new Date(allo.closedAt * 1000).toLocaleString()}
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
