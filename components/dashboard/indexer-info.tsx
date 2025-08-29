"use client";
import { RefreshCw } from "lucide-react";
import useSWR from "swr";
import { EthereumIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPreview } from "@/components/ui/map-preview";
import { agentClient, subgraphClient } from "@/lib/graphql/client";
import {
  AGENT_INDEXER_REGISTRATION_QUERY,
  INDEXER_INFO_BY_ID_QUERY,
  INDEXER_OPERATORS_QUERY,
} from "@/lib/graphql/queries";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { Caip2ByChainAlias, formatGRT } from "@/lib/utils";

interface GraphAccount {
  id: string;
}
interface OperatorsResponse {
  graphAccounts?: GraphAccount[];
}
interface IndexerResponse {
  indexer: {
    indexingRewardCut: number;
    queryFeeCut: number;
    stakedTokens: number;
    lockedTokens: number;
    allocatedTokens: number;
    availableStake: number;
    delegatedCapacity: number;
  };
}

export function IndexerInfo() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();

  type KeyTuple = [string, Record<string, unknown>];
  const subgraphFetcherIndexer = (key: KeyTuple) =>
    subgraphClient(currentNetwork).request<IndexerResponse>(key[0], key[1]);
  const subgraphFetcherOperators = (key: KeyTuple) =>
    subgraphClient(currentNetwork).request<OperatorsResponse>(key[0], key[1]);
  const agent = agentClient();
  type EndpointsResponse = {
    indexerEndpoints?: Array<{
      service?: { url?: string; healthy?: boolean; protocolNetwork?: string };
      status?: { url?: string; healthy?: boolean; protocolNetwork?: string };
    }>;
  };
  const { data: endpointsData } = useSWR<EndpointsResponse>(
    [AGENT_INDEXER_REGISTRATION_QUERY, { protocolNetwork: currentNetwork }],
    ([q, vars]) => agent.request(q as string, vars as Record<string, unknown>),
  );

  const { data, error, isLoading } = useSWR<IndexerResponse>(
    indexerRegistration?.address
      ? [INDEXER_INFO_BY_ID_QUERY, { id: indexerRegistration?.address.toLowerCase() }]
      : null,
    subgraphFetcherIndexer,
  );

  const {
    data: operatorsData,
    error: operatorsError,
    isLoading: operatorsIsLoading,
    isValidating: operatorsIsValidating,
  } = useSWR<OperatorsResponse>(
    indexerRegistration?.address
      ? [INDEXER_OPERATORS_QUERY, { indexer: indexerRegistration?.address.toLowerCase() }]
      : null,
    subgraphFetcherOperators,
  );

  if (error) {
    console.error("Error fetching indexer info:", error);
    return <div>Error fetching indexer info</div>;
  }

  if (operatorsError) {
    console.error("Error fetching operator info:", operatorsError);
    return <div>Error fetching operator info</div>;
  }
  if (isLoading) {
    return <div>Loading indexer info...</div>;
  }
  if (!data) {
    return <div>No data</div>;
  }
  if (!data.indexer) {
    console.error("Indexer field missing in GraphQL response", data);
    return <div>No indexer data</div>;
  }
  const idx = data.indexer;
  const expectedCaip2 = Caip2ByChainAlias[currentNetwork];
  const endpointsList = endpointsData?.indexerEndpoints || [];
  const matched =
    endpointsList.find(
      (e) => e.service?.protocolNetwork === expectedCaip2 || e.status?.protocolNetwork === expectedCaip2,
    ) || endpointsList[0];
  const service = matched?.service;
  const statusEp = matched?.status;

  const StatusBadge = ({ healthy }: { healthy?: boolean }) => {
    const cls =
      healthy == null
        ? "bg-gray-500/10 text-gray-500 border-0"
        : healthy
          ? "bg-emerald-500/10 text-emerald-500 border-0"
          : "bg-red-500/10 text-red-500 border-0";
    return (
      <Badge variant="outline" className={cls}>
        {healthy == null ? "Unknown" : healthy ? "Online" : "Offline"}
      </Badge>
    );
  };
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <EthereumIcon className="h-5 w-5" />
              <span className="text-sm text-muted-foreground">.eth</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Indexer Address</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">
                    {indexerRegistration?.registered ? "Registered" : "Not Registered"}
                  </Badge>
                </div>
                <div className="text-sm font-mono">{indexerRegistration?.address || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Operator Address</span>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-0">
                    0xTODO
                  </Badge>
                </div>
                {operatorsIsLoading || operatorsIsValidating ? (
                  <div className="inline-flex items-center text-sm font-mono">
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    <div className="animate-pulse">Loading operators...</div>
                  </div>
                ) : (
                  operatorsData?.graphAccounts?.map((account: GraphAccount) => (
                    <div key={account.id} className="text-sm font-mono">
                      {account.id}
                    </div>
                  ))
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Indexing Reward Cut</div>
                  <div>{(idx.indexingRewardCut / 10000).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Query Fee Cut</div>
                  <div>{(idx.queryFeeCut / 10000).toFixed(2)}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Status URL</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{statusEp?.url || indexerRegistration?.url || "N/A"}</span>
                  <StatusBadge healthy={statusEp?.healthy} />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Service URL</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{service?.url || indexerRegistration?.url || "N/A"}</span>
                  <StatusBadge healthy={service?.healthy} />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Indexer Location</div>
                {indexerRegistration?.location ? (
                  <div className="aspect-video">
                    <MapPreview
                      latitude={indexerRegistration.location.latitude}
                      longitude={indexerRegistration.location.longitude}
                      label="Indexer geographic location"
                      zoom={4}
                      className="h-full"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Location unavailable
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Self stake" value={formatGRT(idx.stakedTokens - idx.lockedTokens, { decimals: 0 })} />
        <StatCard title="Allocated" value={formatGRT(idx.allocatedTokens, { decimals: 0 })} />
        <StatCard title="Unallocated" value={formatGRT(idx.availableStake, { decimals: 0 })} />
        <StatCard title="Delegated capacity" value={formatGRT(idx.delegatedCapacity, { decimals: 0 })} />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-2xl font-semibold mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}
