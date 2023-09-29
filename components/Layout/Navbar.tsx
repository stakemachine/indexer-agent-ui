import request, { gql } from "graphql-request";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { CutAddress } from "../../lib/utils";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/router";
import {
  INDEXER_INFO_BY_ID_QUERY,
  AGENT_INDEXER_REGISTRATION_QUERY,
} from "../../lib/graphql/queries";
import { Indexer, IndexerRegistration } from "../../types/types";
import NetworkSelect from "../NetworkSelect";
import { useReadLocalStorage } from "usehooks-ts";

const MENU_LIST = [
  { text: "Allocations", href: "/allocations" },
  { text: "Subgraphs", href: "/subgraphs" },
  { text: "Actions", href: "/actions" },
  { text: "Rules", href: "/rules" },
  { text: "Cost Models", href: "/models" },
  { text: "Disputes", href: "/disputes" },
];

export default function Navbar() {
  const selectedNetwork = useReadLocalStorage("network");
  const variables = {
    protocolNetwork: selectedNetwork,
  };
  const {
    data: agentData,
    isLoading: agentIsLoading,
    error: agentError,
  } = useSWR<IndexerRegistration>(AGENT_INDEXER_REGISTRATION_QUERY, (query) =>
    request("/api/agent", query, variables),
  );

  const {
    data: indexerData,
    isLoading: indexerIsLoading,
    error: indexerError,
  } = useSWR<Indexer>(
    () => [
      INDEXER_INFO_BY_ID_QUERY,
      agentData.indexerRegistration.address.toLowerCase(),
    ],
    ([query, id]) =>
      request<Indexer>("/api/subgraph/" + selectedNetwork, query, { id }),
  );
  const router = useRouter();
  const currentRoute = router.pathname;

  if (indexerIsLoading) return <div>Indexer Loading...</div>;
  if (indexerError) return <div>indexer failed to load</div>;

  if (agentIsLoading) return <div>Agent Loading...</div>;
  if (agentError) {
    console.error("err: " + JSON.stringify(agentError, undefined, 2));
    return (
      <>
        <div>{agentError.response.errors[0].message}</div>
        <NetworkSelect />
      </>
    );
  }

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn-ghost btn lg:hidden">
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
            className="menu-compact dropdown-content menu rounded-box mt-3 w-52 bg-base-100 p-2 shadow"
          >
            {MENU_LIST.map((menu, idx) => (
              <li key={idx}>
                <Link
                  href={menu.href}
                  className={
                    currentRoute === menu.href
                      ? "btn-outline btn-active btn"
                      : ""
                  }
                >
                  {menu.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/" className="btn-ghost btn text-xl normal-case">
          Agent UI
        </Link>
        <NetworkSelect />
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal p-0">
          {MENU_LIST.map((menu, idx) => (
            <li key={idx}>
              <Link
                href={menu.href}
                className={currentRoute === menu.href ? " btn-active" : ""}
              >
                {menu.text}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end">
        <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
          <div className="w-10 rounded-full">
            <Image
              src={
                indexerData.indexer.account.image
                  ? indexerData.indexer.account.image
                  : ""
              }
              alt={
                indexerData.indexer.defaultDisplayName
                  ? indexerData.indexer.defaultDisplayName
                  : ""
              }
              width={64}
              height={64}
            />
          </div>
        </label>
        <div className="pl-2 pr-2 ">
          <div>
            {indexerData.indexer.defaultDisplayName
              ? indexerData.indexer.defaultDisplayName + ".eth"
              : "unknown"}
          </div>
          <div className="text-sm">
            {CutAddress(agentData.indexerRegistration.address.toLowerCase())}
          </div>
        </div>
        <Link href="/api/auth/signout">
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}
