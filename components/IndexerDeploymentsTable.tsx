import { Title } from "@tremor/react";

export default function indexerDeploymentsTable({ data }) {
  return (
    <div className="overflow-x-auto p-4">
      <Title>Indexer Deployments</Title>
      <table className="table table-compact w-full">
        <thead>
          <tr>
            <th>subgraphDeployment</th>
            <th>synced</th>
            <th>health</th>
            <th>node</th>
            <th>network</th>
            <th>latestBlock</th>
            <th>chainHeadBlock</th>
            <th>earliestBlock</th>
            <th>blocks behind</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((d, index) => {
            return (
              <>
                <tr>
                  <td>{d.subgraphDeployment}</td>
                  <td>{d.synced.toString()}</td>
                  <td>{d.health}</td>
                  <td>{d.node}</td>
                  <td>{d.chains[0].network} </td>
                  <td>{d.chains[0].latestBlock?.number}</td>
                  <td>{d.chains[0].chainHeadBlock?.number}</td>
                  <td>{d.chains[0].earliestBlock?.number}</td>
                  <td>
                    {d.chains[0].chainHeadBlock?.number -
                      d.chains[0].latestBlock?.number}
                  </td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
