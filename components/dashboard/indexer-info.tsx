"use client";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import { formatEther } from "ethers";
import { RefreshCwIcon } from "lucide-react";
import useSWR from "swr";
import { EthereumIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPreview } from "@/components/ui/map-preview";
import { useGRTPrice } from "@/hooks/use-grt-price";
import { agentClient, subgraphClient } from "@/lib/graphql/client";
import {
  AGENT_INDEXER_REGISTRATION_QUERY,
  INDEXER_INFO_BY_ID_QUERY,
  INDEXER_OPERATORS_QUERY,
} from "@/lib/graphql/queries";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { Caip2ByChainAlias, formatGRT, formatPercent, formatUSD, toWeiBigInt } from "@/lib/utils";

interface GraphAccount {
  id: string;
}
interface OperatorsResponse {
  graphAccounts?: GraphAccount[];
}
interface IndexerResponse {
  indexer: {
    id: string;
    createdAt: number;
    account: {
      id: string;
    };
    url?: string;
    geoHash?: string;
    defaultDisplayName?: string;
    stakedTokens: number;
    allocatedTokens: number;
    unstakedTokens: number;
    lockedTokens: number;
    tokensLockedUntil: number;
    delegatedTokens: number;
    tokenCapacity: number;
    delegatedCapacity: number;
    availableStake: number;
    allocationCount: number;
    totalAllocationCount: number;
    queryFeesCollected: number;
    queryFeeRebates: number;
    rewardsEarned: number;
    indexerIndexingRewards: number;
    delegatorIndexingRewards: number;
    indexerRewardsOwnGenerationRatio: number;
    transferredToL2: boolean;
    firstTransferredToL2At?: number;
    firstTransferredToL2AtBlockNumber?: number;
    firstTransferredToL2AtTx?: string;
    lastTransferredToL2At?: number;
    lastTransferredToL2AtBlockNumber?: number;
    lastTransferredToL2AtTx?: string;
    stakedTokensTransferredToL2: number;
    idOnL2?: string;
    idOnL1?: string;
    ownStakeRatio: number;
    delegatedStakeRatio: number;
    delegatorShares: number;
    delegationExchangeRate: number;
    indexingRewardCut: number;
    indexingRewardEffectiveCut: number;
    overDelegationDilution: number;
    delegatorQueryFees: number;
    queryFeeCut: number;
    queryFeeEffectiveCut: number;
    delegatorParameterCooldown: number;
    lastDelegationParameterUpdate: number;
    forcedClosures: number;
  };
}

export function IndexerInfo() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();
  const { price: grtPrice, isLoading: grtPriceLoading } = useGRTPrice();

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
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <EthereumIcon className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Indexer Address</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">
                  {indexerRegistration?.registered ? "Registered" : "Not Registered"}
                </Badge>
              </div>
              <div className="text-sm font-mono break-all">{idx.id}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Display Name</span>
              </div>
              <div className="text-sm">{idx.defaultDisplayName || "Not set"}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
              </div>
              <div className="text-sm">{formatDistanceToNow(fromUnixTime(idx.createdAt), { addSuffix: true })}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">URL</span>
              </div>
              <div className="text-sm break-all">{idx.url || "Not set"}</div>
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
                  <RefreshCwIcon className="h-3 w-3 mr-2 animate-spin" />
                  <div className="animate-pulse">Loading operators...</div>
                </div>
              ) : (
                operatorsData?.graphAccounts?.map((account: GraphAccount) => (
                  <div key={account.id} className="text-sm font-mono break-all">
                    {account.id}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance & Cuts */}
        <Card>
          <CardHeader>
            <CardTitle>Performance & Cuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Indexing Reward Cut</div>
                <div className="text-lg font-semibold">{formatPercent(idx.indexingRewardCut / 10000)}</div>
                <div className="text-xs text-muted-foreground">
                  Effective: {formatPercent(idx.indexingRewardEffectiveCut * 100)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Query Fee Cut</div>
                <div className="text-lg font-semibold">{formatPercent(idx.queryFeeCut / 10000)}</div>
                <div className="text-xs text-muted-foreground">
                  Effective: {formatPercent(idx.queryFeeEffectiveCut * 100)}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Over-delegation Dilution</div>
              <div className="text-lg font-semibold">{formatPercent(idx.overDelegationDilution)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Health */}
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Status URL</div>
              <div className="flex items-center justify-between">
                <span className="text-sm truncate">{statusEp?.url || indexerRegistration?.url || "N/A"}</span>
                <StatusBadge healthy={statusEp?.healthy} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Service URL</div>
              <div className="flex items-center justify-between">
                <span className="text-sm truncate">{service?.url || indexerRegistration?.url || "N/A"}</span>
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
          </CardContent>
        </Card>
      </div>

      {/* Token Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Token Statistics</span>
            <div className="flex items-center space-x-2">
              {grtPriceLoading ? (
                <div className="flex items-center space-x-1">
                  <RefreshCwIcon className="h-3 w-3 animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading price...</span>
                </div>
              ) : grtPrice ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-0">
                  GRT: ${grtPrice.toFixed(4)}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-0">
                  Price unavailable
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TokenStatCard title="Staked Tokens" wei={idx.stakedTokens} grtPrice={grtPrice} opts={{ decimals: 0 }} />
            <TokenStatCard
              title="Allocated Tokens"
              wei={idx.allocatedTokens}
              grtPrice={grtPrice}
              opts={{ decimals: 0 }}
            />
            <TokenStatCard
              title="Available Stake"
              wei={idx.availableStake}
              grtPrice={grtPrice}
              opts={{ decimals: 0 }}
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <TokenStatCard
              title="Delegated Tokens"
              wei={idx.delegatedTokens}
              grtPrice={grtPrice}
              opts={{ decimals: 0 }}
            />
            <TokenStatCard title="Token Capacity" wei={idx.tokenCapacity} grtPrice={grtPrice} opts={{ decimals: 0 }} />
          </div>
        </CardContent>
      </Card>

      {/* Allocation Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Allocation Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Active Allocations</div>
                <div className="text-2xl font-semibold">{idx.allocationCount}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Allocations</div>
                <div className="text-2xl font-semibold">{idx.totalAllocationCount.toString()}</div>
              </div>
            </div>

            {idx.tokensLockedUntil > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">Tokens Locked Until</div>
                <div className="text-sm">Block #{idx.tokensLockedUntil.toLocaleString()}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rewards & Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Rewards Earned</div>
              <TokenValue
                wei={idx.rewardsEarned}
                grtPrice={grtPrice}
                opts={{ decimals: 2, withSymbol: true }}
                className="text-xl font-semibold mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Indexer Rewards</div>
                <TokenValue
                  wei={idx.indexerIndexingRewards}
                  grtPrice={grtPrice}
                  opts={{ decimals: 2 }}
                  className="text-lg font-semibold mt-1"
                />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Delegator Rewards</div>
                <TokenValue
                  wei={idx.delegatorIndexingRewards}
                  grtPrice={grtPrice}
                  opts={{ decimals: 2 }}
                  className="text-lg font-semibold mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Query Fees Collected</div>
                <TokenValue
                  wei={idx.queryFeesCollected}
                  grtPrice={grtPrice}
                  opts={{ decimals: 2 }}
                  className="text-lg font-semibold mt-1"
                />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Query Fee Rebates</div>
                <TokenValue
                  wei={idx.queryFeeRebates}
                  grtPrice={grtPrice}
                  opts={{ decimals: 2 }}
                  className="text-lg font-semibold mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* L2 Transfer Information */}
      {idx.transferredToL2 && (
        <Card>
          <CardHeader>
            <CardTitle>L2 Transfer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Transferred to L2</div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-0">
                  Yes
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tokens Transferred</div>
                <TokenValue
                  wei={idx.stakedTokensTransferredToL2}
                  grtPrice={grtPrice}
                  opts={{ decimals: 2, withSymbol: true }}
                  className="text-lg font-semibold mt-1"
                />
              </div>
            </div>

            {idx.firstTransferredToL2At && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">First Transfer</div>
                  <div className="text-sm">
                    {formatDistanceToNow(fromUnixTime(idx.firstTransferredToL2At), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Block #{idx.firstTransferredToL2AtBlockNumber?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Latest Transfer</div>
                  <div className="text-sm">
                    {idx.lastTransferredToL2At &&
                      formatDistanceToNow(fromUnixTime(idx.lastTransferredToL2At), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Block #{idx.lastTransferredToL2AtBlockNumber?.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {idx.idOnL1 && (
                <div>
                  <div className="text-sm text-muted-foreground">L1 ID</div>
                  <div className="text-sm font-mono break-all">{idx.idOnL1}</div>
                </div>
              )}
              {idx.idOnL2 && (
                <div>
                  <div className="text-sm text-muted-foreground">L2 ID</div>
                  <div className="text-sm font-mono break-all">{idx.idOnL2}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TokenStatCard({
  title,
  wei,
  grtPrice,
  opts = {},
}: {
  title: string;
  wei: string | number | bigint;
  grtPrice: number | null | undefined;
  opts?: { decimals?: number; withSymbol?: boolean; locale?: string };
}) {
  const grtAmount = formatGRT(wei, opts);

  // Calculate USD value
  let usdValue: string | null = null;
  if (grtPrice && typeof grtPrice === "number") {
    const bi = toWeiBigInt(wei);
    if (bi != null) {
      const asEthStr = formatEther(bi);
      const asNum = Number.parseFloat(asEthStr);
      if (Number.isFinite(asNum)) {
        const usdAmount = asNum * grtPrice;
        usdValue = formatUSD(usdAmount, opts.locale);
      }
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-2">
          <div className="text-2xl font-semibold">{grtAmount}</div>
          {usdValue && <div className="text-sm text-muted-foreground mt-1">{usdValue}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function TokenValue({
  wei,
  grtPrice,
  opts = {},
  className = "",
}: {
  wei: string | number | bigint;
  grtPrice: number | null | undefined;
  opts?: { decimals?: number; withSymbol?: boolean; locale?: string };
  className?: string;
}) {
  const grtAmount = formatGRT(wei, opts);

  // Calculate USD value
  let usdValue: string | null = null;
  if (grtPrice && typeof grtPrice === "number") {
    const bi = toWeiBigInt(wei);
    if (bi != null) {
      const asEthStr = formatEther(bi);
      const asNum = Number.parseFloat(asEthStr);
      if (Number.isFinite(asNum)) {
        const usdAmount = asNum * grtPrice;
        usdValue = formatUSD(usdAmount, opts.locale);
      }
    }
  }

  return (
    <div className={className}>
      <div>{grtAmount}</div>
      {usdValue && <div className="text-xs text-muted-foreground">{usdValue}</div>}
    </div>
  );
}
