"use client";
import { GraphQLClient } from "graphql-request";
import { RefreshCw } from "lucide-react";
import useSWR from "swr";
import { EthereumIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { INDEXER_INFO_BY_ID_QUERY, INDEXER_OPERATORS_QUERY } from "@/lib/graphql/queries";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";

export function IndexerInfo() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();

  // Ensure absolute URL for GraphQLClient
  const endpoint = typeof window !== "undefined" ? `${window.location.origin}/api/subgraph/${currentNetwork}` : "";
  const client = new GraphQLClient(endpoint);

  const fetcher = (query: string, variables: any) => client.request(query, variables);
  const { data, error, isLoading, mutate } = useSWR(
    indexerRegistration?.address
      ? [INDEXER_INFO_BY_ID_QUERY, { id: indexerRegistration?.address.toLowerCase() }]
      : null,
    ([query, variables]) => fetcher(query, variables),
  );

  const {
    data: operatorsData,
    error: operatorsError,
    isLoading: operatorsIsLoading,
    isValidating: operatorsIsValidating,
  } = useSWR(
    indexerRegistration?.address
      ? [INDEXER_OPERATORS_QUERY, { indexer: indexerRegistration?.address.toLowerCase() }]
      : null,
    ([query, variables]) => fetcher(query, variables),
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
                  operatorsData.graphAccounts?.map((account: any) => (
                    <div key={account.id} className="text-sm font-mono">
                      {account.id}
                    </div>
                  ))
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Indexing Reward Cut</div>
                  <div>{data.indexer.indexingRewardCut / 10000}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Query Fee Cut</div>
                  <div>{data.indexer.queryFeeCut / 10000}%</div>
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
                  <span className="text-sm">{indexerRegistration?.url || "N/A"}</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">
                    Online
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Service URL</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{indexerRegistration?.url || "N/A"}</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">
                    Online
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Indexer Location</div>
                <div className="bg-sky-100 aspect-video rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Self stake"
          value={`${((data.indexer.stakedTokens - data.indexer.lockedTokens) / 1000000000000000000).toFixed(0)}`}
        />
        <StatCard title="Allocated" value={`${(data.indexer.allocatedTokens / 1000000000000000000).toFixed(0)}`} />
        <StatCard title="Unallocated" value={`${(data.indexer.availableStake / 1000000000000000000).toFixed(0)}`} />
        <StatCard
          title="Delegated capacity"
          value={`${(data.indexer.delegatedCapacity / 1000000000000000000).toFixed(0)}`}
        />
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
