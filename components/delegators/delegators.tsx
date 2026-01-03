"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import { formatEther } from "ethers";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { useGRTPrice } from "@/hooks/use-grt-price";
import { subgraphClient } from "@/lib/graphql/client";
import { DELEGATORS_BY_INDEXER_QUERY } from "@/lib/graphql/queries";
import type { DelegatedStakesResponse } from "@/lib/graphql/schemas";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { formatGRT, formatUSD } from "@/lib/utils";

interface DelegatorRow {
  id: string;
  delegatorAddress: string;
  stakedTokens: string;
  shareAmount: string;
  lockedTokens: string;
  realizedRewards: string;
  totalRealizedRewards: string;
  unstakedTokens: string;
  totalStakedTokens: string;
  totalUnstakedTokens: string;
  stakesCount: number;
  activeStakesCount: number;
  createdAt: number;
  lastDelegatedAt: number | null;
  lastUndelegatedAt: number | null;
}

const columns: ColumnDef<DelegatorRow>[] = [
  {
    accessorKey: "delegatorAddress",
    header: "Delegator Address",
    cell: ({ row }) => (
      <div className="w-45 font-mono text-xs truncate" title={row.getValue("delegatorAddress")}>
        {row.getValue("delegatorAddress")}
      </div>
    ),
  },
  {
    accessorKey: "stakedTokens",
    header: "Staked to You",
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatGRT(row.getValue("stakedTokens"), { decimals: 2, withSymbol: true })}
      </div>
    ),
  },
  {
    accessorKey: "shareAmount",
    header: "Shares",
    cell: ({ row }) => {
      const shares = row.getValue("shareAmount") as string;
      try {
        const formatted = formatEther(shares);
        const num = Number.parseFloat(formatted);
        return <div className="text-right">{num.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>;
      } catch {
        return <div className="text-right">{shares}</div>;
      }
    },
  },
  {
    accessorKey: "totalRealizedRewards",
    header: "Total Realized Rewards",
    cell: ({ row }) => {
      const rewards = row.getValue("totalRealizedRewards") as string;
      if (!rewards || rewards === "0") {
        return <span className="text-muted-foreground">—</span>;
      }
      return <div className="text-right">{formatGRT(rewards, { decimals: 2, withSymbol: true })}</div>;
    },
  },
  {
    accessorKey: "lockedTokens",
    header: "Locked",
    cell: ({ row }) => {
      const locked = row.getValue("lockedTokens") as string;
      const hasLocked = locked !== "0";
      return (
        <div className="text-right">
          {hasLocked ? (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-0">
              {formatGRT(locked, { decimals: 2, withSymbol: true })}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "totalStakedTokens",
    header: "Total Staked (All Indexers)",
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        {formatGRT(row.getValue("totalStakedTokens"), { decimals: 2, withSymbol: true })}
      </div>
    ),
  },
  {
    accessorKey: "activeStakesCount",
    header: "Active Stakes",
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="outline">
          {row.getValue("activeStakesCount")} / {row.original.stakesCount}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "First Delegated",
    cell: ({ row }) => {
      const timestamp = row.getValue("createdAt") as number;
      if (!timestamp) return <span className="text-muted-foreground">—</span>;
      return <div className="text-sm">{formatDistanceToNow(fromUnixTime(timestamp), { addSuffix: true })}</div>;
    },
  },
  {
    accessorKey: "lastDelegatedAt",
    header: "Last Delegated",
    cell: ({ row }) => {
      const timestamp = row.getValue("lastDelegatedAt") as number | null;
      if (!timestamp) return <span className="text-muted-foreground">—</span>;
      return <div className="text-sm">{formatDistanceToNow(fromUnixTime(timestamp), { addSuffix: true })}</div>;
    },
  },
  {
    accessorKey: "lastUndelegatedAt",
    header: "Last Undelegated",
    cell: ({ row }) => {
      const timestamp = row.getValue("lastUndelegatedAt") as number | null;
      if (!timestamp) return <span className="text-muted-foreground">—</span>;
      return <div className="text-sm">{formatDistanceToNow(fromUnixTime(timestamp), { addSuffix: true })}</div>;
    },
  },
];

export function Delegators() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();
  const { price: grtPrice } = useGRTPrice();

  const fetcher = ([query, vars]: [string, Record<string, unknown>]) =>
    subgraphClient(currentNetwork).request<DelegatedStakesResponse>(query, vars);

  const { data, error, isLoading, isValidating, mutate } = useSWR<DelegatedStakesResponse>(
    indexerRegistration?.address
      ? [DELEGATORS_BY_INDEXER_QUERY, { indexer: indexerRegistration.address.toLowerCase() }]
      : null,
    fetcher,
  );

  const delegators: DelegatorRow[] = (data?.delegatedStakes ?? []).map((stake) => ({
    id: stake.id,
    delegatorAddress: stake.delegator.id,
    stakedTokens: stake.stakedTokens,
    shareAmount: stake.shareAmount,
    lockedTokens: stake.lockedTokens,
    realizedRewards: stake.realizedRewards,
    totalRealizedRewards: stake.delegator.totalRealizedRewards,
    unstakedTokens: stake.unstakedTokens,
    totalStakedTokens: stake.delegator.totalStakedTokens,
    totalUnstakedTokens: stake.delegator.totalUnstakedTokens,
    stakesCount: stake.delegator.stakesCount,
    activeStakesCount: stake.delegator.activeStakesCount,
    createdAt: stake.createdAt,
    lastDelegatedAt: stake.lastDelegatedAt ?? null,
    lastUndelegatedAt: stake.lastUndelegatedAt ?? null,
  }));

  // Use delegatedTokens from indexer entity (authoritative value)
  const totalDelegated = data?.indexer?.delegatedTokens ?? "0";

  // Count active delegators (those with shares > 0)
  const activeDelegators = delegators.filter((d) => d.shareAmount !== "0").length;

  const totalDelegatedUSD = grtPrice
    ? (() => {
        try {
          const asEthStr = formatEther(totalDelegated);
          const asNum = Number.parseFloat(asEthStr);
          if (Number.isFinite(asNum)) {
            return formatUSD(asNum * grtPrice);
          }
        } catch {
          // ignore
        }
        return null;
      })()
    : null;

  if (!indexerRegistration?.address) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No indexer registration found. Please check your agent connection.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Active Delegators</div>
          <div className="text-2xl font-semibold mt-1">{activeDelegators}</div>
          {delegators.length > activeDelegators && (
            <div className="text-sm text-muted-foreground mt-1">{delegators.length - activeDelegators} historical</div>
          )}
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Delegated to You</div>
          <div className="text-2xl font-semibold mt-1">
            {formatGRT(totalDelegated, { decimals: 0, withSymbol: true })}
          </div>
          {totalDelegatedUSD && <div className="text-sm text-muted-foreground mt-1">{totalDelegatedUSD}</div>}
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Average Delegation</div>
          <div className="text-2xl font-semibold mt-1">
            {activeDelegators > 0
              ? formatGRT((BigInt(totalDelegated) / BigInt(activeDelegators)).toString(), {
                  decimals: 0,
                  withSymbol: true,
                })
              : "—"}
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <DataGrid
        columns={columns}
        data={delegators}
        onRefresh={() => mutate()}
        isLoading={isLoading}
        isValidating={isValidating}
        error={error?.message}
        initialState={{
          sorting: [{ id: "stakedTokens", desc: true }],
          pagination: { pageIndex: 0, pageSize: 25 },
        }}
      />
    </div>
  );
}
