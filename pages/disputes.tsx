import request, { gql } from "graphql-request";
import useSWR from "swr";

const queryStatus = gql`
  {
    disputes(status: $status, minClosedEpoch: $minClosedEpoch) {
      allocationID
      allocationIndexer
      allocationAmount
      allocationProof
      closedEpoch
      closedEpochStartBlockHash
      closedEpochStartBlockNumber
      closedEpochReferenceProof
      previousEpochStartBlockHash
      previousEpochStartBlockNumber
      previousEpochReferenceProof
      status
    }
  }
`;

export default function RulesPage() {
  return (
    <>
      <span className="text-3xl font-semibold">Disputes</span>
      <div className="card w-full bg-base-100 shadow-xl mt-3">
        <div className="hero min-h-screen">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">TODO</h1>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
