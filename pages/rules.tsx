import { Metric, Card } from "@tremor/react";
import request, { gql } from "graphql-request";
import useSWR from "swr";
const queryStatus = gql`
  {
    indexingRules(merged: true) {
      identifier
      identifierType
      allocationAmount
      allocationLifetime
      autoRenewal
      parallelAllocations
      maxAllocationPercentage
      minSignal
      maxSignal
      minStake
      minAverageQueryFees
      custom
      decisionBasis
      requireSupported
    }
  }
`;

export default function RulesPage() {
  const { data, error } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <>
      <Metric>Indexing Rules</Metric>
      <Card marginTop="mt-3">
        <div className="overflow-x-auto p-4">
          <span className="text-lg">Indexing Rules</span>
          <table className="table table-compact w-full">
            <thead>
              <tr>
                <th>Identifier</th>
                <th>identifierType</th>
                <th>allocationAmount</th>
                <th>allocationLifetime</th>
                <th>autoRenewal</th>
                <th>parallelAllocations</th>
                <th>maxAllocationPercentage</th>
                <th>minSignal</th>
                <th>maxSignal</th>
                <th>minStake</th>
                <th>minAverageQueryFees</th>
                <th>custom</th>
                <th>decisionBasis</th>
                <th>requireSupported</th>
              </tr>
            </thead>
            <tbody>
              {data.indexingRules?.map((rule, index) => {
                return (
                  <>
                    <tr>
                      <td>{rule.identifier}</td>
                      <td>{rule.identifierType}</td>
                      <td>{rule.allocationAmount}</td>
                      <td>{rule.allocationLifetime}</td>
                      <td>{rule.autoRenewal}</td>
                      <td>{rule.parallelAllocations}</td>
                      <td>{rule.maxAllocationPercentage}</td>
                      <td>{rule.minSignal}</td>
                      <td>{rule.maxSignal}</td>
                      <td>{rule.minAverageQueryFees}</td>
                      <td>{rule.custom}</td>
                      <td>{rule.decisionBasis}</td>
                      <td>{rule.requireSupported}</td>
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
