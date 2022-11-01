import request, { gql } from "graphql-request";
import Link from "next/link";
import useSWR from "swr";
import { CutAddress } from "../../lib/utils";

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

const indexerInfoQuery = gql`
  query indexerByIdQuery($id: String) {
    indexer(id: $id) {
      defaultDisplayName
      account {
        image
      }
    }
  }
`;

export default function Navbar() {
  const { data: agentData, error: agentError } = useSWR(queryStatus, (query) =>
    request("/api/agent", query)
  );
  const { data: indexerData, error: indexerError } = useSWR(
    () => [
      indexerInfoQuery,
      agentData.indexerRegistration.address.toLowerCase(),
    ],
    (query, id) => request("/api/subgraph", query, { id })
  );
  if (indexerError) return <div>failed to load</div>;
  if (!indexerData) return <div>Loading...</div>;

  if (agentError) return <div>failed to load</div>;
  if (!agentData) return <div>Loading...</div>;
  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <Link href="/allocations">Allocations</Link>
            </li>
            <li>
              <Link href="/subgraphs">Subgraphs</Link>
            </li>
            <li>
              <Link href="/actions">Actions</Link>
            </li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost normal-case text-xl">
          Agent UI
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal p-0">
          <li>
            <Link href="/allocations">Allocations</Link>
          </li>
          <li>
            <Link href="/subgraphs">Subgraphs</Link>
          </li>
          <li>
            <Link href="/actions">Actions</Link>
          </li>
          <li>
            <Link href="/rules">Rules</Link>
          </li>
          <li>
            <Link href="/models">Cost Models</Link>
          </li>
          <li>
            <Link href="/disputes">Disputes</Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
          <div className="w-10 rounded-full">
            <img src={indexerData.indexer?.account.image} />
          </div>
        </label>
        <div className="pr-2 pl-2 ">
          <div>{indexerData.indexer?.defaultDisplayName}.eth</div>
          <div className="text-sm">
            {CutAddress(agentData.indexerRegistration.address.toLowerCase())}
          </div>
        </div>
      </div>
    </div>
  );
}
