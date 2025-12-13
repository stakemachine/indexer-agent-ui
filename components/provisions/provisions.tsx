"use client";

import { format, formatDistanceToNow, fromUnixTime } from "date-fns";
import { formatEther } from "ethers";
import { Loader2Icon, PlusIcon, SnowflakeIcon, TrashIcon } from "lucide-react";
import React from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { createSchemaFetcher } from "@/lib/fetchers";
import { agentClient, subgraphClient } from "@/lib/graphql/client";
import {
  ADD_TO_PROVISION_MUTATION,
  INDEXER_INFO_BY_ID_QUERY,
  PROVISIONS_QUERY,
  REMOVE_FROM_PROVISION_MUTATION,
  THAW_FROM_PROVISION_MUTATION,
  THAW_REQUESTS_QUERY,
} from "@/lib/graphql/queries";
import {
  type ProvisionsResponse,
  ProvisionsResponseSchema,
  type ThawRequestsResponse,
  ThawRequestsResponseSchema,
} from "@/lib/graphql/schemas";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { formatGRT, resolveChainAlias, toEip155 } from "@/lib/utils";

type Provision = {
  id: string;
  dataService: string;
  indexer: string;
  tokensProvisioned: string;
  tokensAllocated: string;
  tokensThawing: string;
  thawingPeriod: number;
  maxVerifierCut: number;
  protocolNetwork: string;
  idleStake: string;
};

type ThawRequest = {
  id: string;
  fulfilled: boolean;
  shares: string;
  thawingUntil: number;
  protocolNetwork: string;
};

function formatPercentage(ppm: number | string): string {
  const value = typeof ppm === "string" ? Number.parseFloat(ppm) : ppm;
  return `${((value / 1_000_000) * 100).toFixed(1)}%`;
}

function formatSeconds(seconds: number | string): string {
  const value = typeof seconds === "string" ? Number.parseInt(seconds, 10) : seconds;
  const hours = Math.floor(value / 3600);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${Math.floor(value / 60)} min`;
}

function AddStakeDialog({
  onSubmit,
  isLoading,
  idleStake,
}: {
  onSubmit: (amount: string) => Promise<void>;
  isLoading: boolean;
  idleStake?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");

  // Convert idleStake (wei) to GRT for the max button
  const maxAmount = React.useMemo(() => {
    if (!idleStake) return "0";
    try {
      return formatEther(BigInt(idleStake));
    } catch {
      return "0";
    }
  }, [idleStake]);

  const handleMax = () => {
    setAmount(maxAmount);
  };

  const handleSubmit = async () => {
    if (!amount) return;
    await onSubmit(amount);
    setAmount("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Add Stake
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Stake to Provision</DialogTitle>
          <DialogDescription>
            Add idle stake to your Subgraph Service provision. This stake will be available for allocations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount (GRT)</Label>
              {idleStake && Number.parseFloat(maxAmount) > 0 && (
                <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleMax}>
                  Max: {formatGRT(idleStake)}
                </Button>
              )}
            </div>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!amount || isLoading}>
            {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Stake
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThawStakeDialog({ onSubmit, isLoading }: { onSubmit: (amount: string) => Promise<void>; isLoading: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");

  const handleSubmit = async () => {
    if (!amount) return;
    await onSubmit(amount);
    setAmount("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <SnowflakeIcon className="h-4 w-4" />
          Thaw Stake
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thaw Stake from Provision</DialogTitle>
          <DialogDescription>
            Initiate a thaw request to remove stake from your provision. The stake will be available to remove after the
            thawing period ends.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="thaw-amount">Amount (GRT)</Label>
            <Input
              id="thaw-amount"
              type="number"
              placeholder="e.g., 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!amount || isLoading}>
            {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
            Thaw Stake
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveStakeButton({
  onSubmit,
  isLoading,
  hasThawedStake,
}: {
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  hasThawedStake: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = async () => {
    await onSubmit();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" className="gap-2" disabled={!hasThawedStake}>
          <TrashIcon className="h-4 w-4" />
          Remove Thawed
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Thawed Stake</DialogTitle>
          <DialogDescription>
            This will remove all thawed stake from the provision and return it to your idle stake pool. Only stake that
            has completed its thawing period will be removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
            Remove Stake
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Type for indexer info from network subgraph
type IndexerInfo = {
  id: string;
  stakedTokens: string;
  allocatedTokens: string;
  availableStake: string;
  delegatedTokens: string;
  lockedTokens: string;
  tokenCapacity: string;
};

type IndexerInfoResponse = {
  indexer: IndexerInfo | null;
};

export function Provisions() {
  const { currentNetwork } = useNetworkStore();
  const { indexerRegistration } = useIndexerRegistrationStore();
  const [isAddLoading, setIsAddLoading] = React.useState(false);
  const [isThawLoading, setIsThawLoading] = React.useState(false);
  const [isRemoveLoading, setIsRemoveLoading] = React.useState(false);

  const provisionsFetcher = React.useMemo(
    () =>
      createSchemaFetcher({
        endpoint: "/api/agent",
        schema: ProvisionsResponseSchema,
      }),
    [],
  );

  const thawRequestsFetcher = React.useMemo(
    () =>
      createSchemaFetcher({
        endpoint: "/api/agent",
        schema: ThawRequestsResponseSchema,
      }),
    [],
  );

  // Fetch indexer stake info from network subgraph (works even without provision)
  const indexerAddress = indexerRegistration?.address?.toLowerCase();
  const { data: indexerInfoData, isLoading: indexerInfoLoading } = useSWR<IndexerInfoResponse>(
    indexerAddress ? ["indexerInfo", currentNetwork, indexerAddress] : null,
    () => subgraphClient(currentNetwork).request<IndexerInfoResponse>(INDEXER_INFO_BY_ID_QUERY, { id: indexerAddress }),
  );

  const {
    data: provisionsData,
    error: provisionsError,
    isLoading: provisionsLoading,
    mutate: mutateProvisions,
  } = useSWR<ProvisionsResponse>(["provisions", currentNetwork], () =>
    provisionsFetcher(PROVISIONS_QUERY, { protocolNetwork: toEip155(currentNetwork) }),
  );

  const {
    data: thawRequestsData,
    error: thawRequestsError,
    isLoading: thawRequestsLoading,
    mutate: mutateThawRequests,
  } = useSWR<ThawRequestsResponse>(["thawRequests", currentNetwork], () =>
    thawRequestsFetcher(THAW_REQUESTS_QUERY, { protocolNetwork: toEip155(currentNetwork) }),
  );

  const provisions: Provision[] = React.useMemo(() => {
    if (!provisionsData?.provisions) return [];
    return provisionsData.provisions.map((p) => ({
      ...p,
      thawingPeriod: typeof p.thawingPeriod === "string" ? Number.parseInt(p.thawingPeriod, 10) : p.thawingPeriod,
      maxVerifierCut: typeof p.maxVerifierCut === "string" ? Number.parseInt(p.maxVerifierCut, 10) : p.maxVerifierCut,
    }));
  }, [provisionsData]);

  const thawRequests: ThawRequest[] = React.useMemo(() => {
    if (!thawRequestsData?.thawRequests) return [];
    return thawRequestsData.thawRequests.map((t) => ({
      ...t,
      // Convert fulfilled from string to boolean if needed
      fulfilled: typeof t.fulfilled === "string" ? t.fulfilled === "true" : Boolean(t.fulfilled),
      thawingUntil: typeof t.thawingUntil === "string" ? Number.parseInt(t.thawingUntil, 10) : t.thawingUntil,
    }));
  }, [thawRequestsData]);

  const currentProvision = provisions[0]; // There's typically only one provision per (indexer, dataService)
  const indexerInfo = indexerInfoData?.indexer;
  const hasThawedStake =
    thawRequests.some((t) => t.fulfilled || t.thawingUntil * 1000 < Date.now()) ||
    (currentProvision && Number.parseFloat(currentProvision.tokensThawing) > 0);

  const client = agentClient();

  const handleAddStake = async (amount: string) => {
    setIsAddLoading(true);
    try {
      await client.request(ADD_TO_PROVISION_MUTATION, {
        protocolNetwork: toEip155(currentNetwork),
        amount,
      });
      toast({
        title: "Stake Added",
        description: `Successfully added ${amount} GRT to the provision.`,
      });
      mutateProvisions();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add stake to provision",
        variant: "destructive",
      });
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleThawStake = async (amount: string) => {
    setIsThawLoading(true);
    try {
      await client.request(THAW_FROM_PROVISION_MUTATION, {
        protocolNetwork: toEip155(currentNetwork),
        amount,
      });
      toast({
        title: "Thaw Initiated",
        description: `Successfully initiated thaw of ${amount} GRT from the provision.`,
      });
      mutateProvisions();
      mutateThawRequests();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to thaw stake from provision",
        variant: "destructive",
      });
    } finally {
      setIsThawLoading(false);
    }
  };

  const handleRemoveStake = async () => {
    setIsRemoveLoading(true);
    try {
      await client.request(REMOVE_FROM_PROVISION_MUTATION, {
        protocolNetwork: toEip155(currentNetwork),
      });
      toast({
        title: "Stake Removed",
        description: "Successfully removed thawed stake from the provision.",
      });
      mutateProvisions();
      mutateThawRequests();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove stake from provision",
        variant: "destructive",
      });
    } finally {
      setIsRemoveLoading(false);
    }
  };

  if (provisionsError || thawRequestsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            {provisionsError?.message || thawRequestsError?.message || "Failed to load provision data"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stake Overview Card - Key metrics at a glance */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Stake Overview</CardTitle>
          <CardDescription>Your current stake distribution on {resolveChainAlias(currentNetwork)}</CardDescription>
        </CardHeader>
        <CardContent>
          {provisionsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
                <div key={`stake-skeleton-${i}`} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-28" />
                </div>
              ))}
            </div>
          ) : currentProvision ? (
            <>
              {/* Data Service Info */}
              <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Data Service (Subgraph Service)
                    </p>
                    <p className="font-mono text-sm mt-1">{currentProvision.dataService}</p>
                  </div>
                  <Badge variant="outline">{resolveChainAlias(currentProvision.protocolNetwork)}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Idle Stake</p>
                  <p className="text-2xl font-bold text-primary mt-1">{formatGRT(currentProvision.idleStake)}</p>
                  <p className="text-xs text-muted-foreground">GRT available to provision</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tokens Provisioned</p>
                  <p className="text-2xl font-bold mt-1">{formatGRT(currentProvision.tokensProvisioned)}</p>
                  <p className="text-xs text-muted-foreground">GRT in provision</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tokens Allocated</p>
                  <p className="text-2xl font-bold mt-1">{formatGRT(currentProvision.tokensAllocated)}</p>
                  <p className="text-xs text-muted-foreground">GRT actively allocated</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tokens Thawing</p>
                  <p className="text-2xl font-bold mt-1">{formatGRT(currentProvision.tokensThawing)}</p>
                  <p className="text-xs text-muted-foreground">GRT being thawed</p>
                </div>
              </div>

              {/* Helpful guidance based on stake state */}
              {Number.parseFloat(currentProvision.idleStake) > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                  <p className="text-blue-600 dark:text-blue-400">
                    <strong>Tip:</strong> You have{" "}
                    <span className="font-semibold">{formatGRT(currentProvision.idleStake)} GRT</span> of idle stake.
                    Click "Add Stake" to provision it to the Subgraph Service for allocations.
                  </p>
                </div>
              )}
              {Number.parseFloat(currentProvision.tokensThawing) > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm">
                  <p className="text-orange-600 dark:text-orange-400">
                    <strong>Notice:</strong> You have{" "}
                    <span className="font-semibold">{formatGRT(currentProvision.tokensThawing)} GRT</span> currently
                    thawing. Check the Thaw Requests table below for status.
                  </p>
                </div>
              )}
              {/* Message when everything is 0 */}
              {Number.parseFloat(currentProvision.idleStake) === 0 &&
                Number.parseFloat(currentProvision.tokensProvisioned) === 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-muted border text-sm">
                    <p className="text-muted-foreground">
                      <strong>No stake detected.</strong> To add stake, first use Graph Explorer or the protocol
                      contracts to stake GRT. Once staked, the idle stake will appear here and can be provisioned to the
                      Subgraph Service.
                    </p>
                  </div>
                )}
            </>
          ) : (
            <div className="py-4">
              {/* Show indexer stake when available */}
              {indexerInfoLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
                    <div key={`overview-skeleton-${i}`} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-28" />
                    </div>
                  ))}
                </div>
              ) : indexerInfo ? (
                <div className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-4 rounded-lg bg-background border border-primary/20">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Idle Stake</p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {formatGRT(
                          (
                            BigInt(indexerInfo.stakedTokens) -
                            BigInt(indexerInfo.allocatedTokens) -
                            BigInt(indexerInfo.lockedTokens)
                          ).toString(),
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">GRT available to provision</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Staked</p>
                      <p className="text-2xl font-bold mt-1">{formatGRT(indexerInfo.stakedTokens)}</p>
                      <p className="text-xs text-muted-foreground">GRT staked by indexer</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Tokens Allocated</p>
                      <p className="text-2xl font-bold mt-1">{formatGRT(indexerInfo.allocatedTokens)}</p>
                      <p className="text-xs text-muted-foreground">GRT in allocations</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Delegated</p>
                      <p className="text-2xl font-bold mt-1">{formatGRT(indexerInfo.delegatedTokens)}</p>
                      <p className="text-xs text-muted-foreground">GRT delegated to you</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground mb-4">
                  <p className="font-medium text-foreground">No provision data available</p>
                  <p className="text-sm mt-1">
                    A Subgraph Service provision has not been created yet for {resolveChainAlias(currentNetwork)}.
                  </p>
                </div>
              )}
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                <p className="text-amber-600 dark:text-amber-400">
                  <strong>To get started with Graph Horizon:</strong> Ensure your indexer-agent is configured with{" "}
                  <code className="text-xs bg-muted px-1 rounded">INDEXER_AGENT_MAX_PROVISION_INITIAL_SIZE</code> and
                  has sufficient idle stake (100k+ GRT). The agent will automatically create a provision on startup.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provision Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subgraph Service Provision</CardTitle>
              <CardDescription className="mt-1">
                Manage your stake provision for the Subgraph Service on {resolveChainAlias(currentNetwork)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <AddStakeDialog
                onSubmit={handleAddStake}
                isLoading={isAddLoading}
                idleStake={currentProvision?.idleStake}
              />
              <ThawStakeDialog onSubmit={handleThawStake} isLoading={isThawLoading} />
              <RemoveStakeButton
                onSubmit={handleRemoveStake}
                isLoading={isRemoveLoading}
                hasThawedStake={hasThawedStake}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {provisionsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
                <div key={`provision-skeleton-${i}`} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          ) : currentProvision ? (
            <div className="space-y-6">
              {/* Provision Parameters */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Provision Parameters</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Max Verifier Cut</p>
                    <p className="text-lg font-semibold">{formatPercentage(currentProvision.maxVerifierCut)}</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Thawing Period</p>
                    <p className="text-lg font-semibold">
                      {currentProvision.thawingPeriod > 0 ? formatSeconds(currentProvision.thawingPeriod) : "None"}
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Protocol Network</p>
                    <p className="text-lg font-semibold">{resolveChainAlias(currentProvision.protocolNetwork)}</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">Indexer Address</p>
                    <p className="text-sm font-mono truncate" title={currentProvision.indexer}>
                      {currentProvision.indexer}
                    </p>
                  </div>
                </div>
                {/* Full Data Service Address */}
                <div className="mt-4 p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Data Service (Subgraph Service Contract)</p>
                  <p className="text-sm font-mono break-all">{currentProvision.dataService}</p>
                </div>
              </div>

              {/* Stake Breakdown Table */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Stake Breakdown</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount (GRT)</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Idle Stake</TableCell>
                      <TableCell className="text-right font-mono">{formatGRT(currentProvision.idleStake)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        Stake not assigned to any provision, available to add
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tokens Provisioned</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatGRT(currentProvision.tokensProvisioned)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        Total stake assigned to this provision
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tokens Allocated</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatGRT(currentProvision.tokensAllocated)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        Stake currently used in active allocations
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tokens Thawing</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatGRT(currentProvision.tokensThawing)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        Stake being thawed, will return to idle stake pool
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-medium">Available for Allocations</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {indexerInfo ? formatGRT(indexerInfo.availableStake) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        Total stake available for new allocations (from network subgraph)
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Token Capacity</TableCell>
                      <TableCell className="text-right font-mono">
                        {indexerInfo ? formatGRT(indexerInfo.tokenCapacity) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        Maximum allocation capacity (own stake + delegation)
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Show Indexer Stake Info from Network Subgraph */}
              {indexerInfoLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
                    <div key={`indexer-stake-skeleton-${i}`} className="p-4 rounded-lg bg-muted/50">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  ))}
                </div>
              ) : indexerInfo ? (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Current Stake (from Network Subgraph)
                  </h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg bg-muted/50 border border-primary/20">
                      <p className="text-xs text-muted-foreground">Idle Stake</p>
                      <p className="text-xl font-semibold text-primary">
                        {formatGRT(
                          (
                            BigInt(indexerInfo.stakedTokens) -
                            BigInt(indexerInfo.allocatedTokens) -
                            BigInt(indexerInfo.lockedTokens)
                          ).toString(),
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Available to provision</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total Staked</p>
                      <p className="text-xl font-semibold">{formatGRT(indexerInfo.stakedTokens)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total GRT staked by indexer</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Allocated Tokens</p>
                      <p className="text-xl font-semibold">{formatGRT(indexerInfo.allocatedTokens)}</p>
                      <p className="text-xs text-muted-foreground mt-1">GRT used in allocations</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 mt-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Delegated Tokens</p>
                      <p className="text-lg font-semibold">{formatGRT(indexerInfo.delegatedTokens)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Locked Tokens</p>
                      <p className="text-lg font-semibold">{formatGRT(indexerInfo.lockedTokens)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Available Stake</p>
                      <p className="text-lg font-semibold">{formatGRT(indexerInfo.availableStake)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Including delegation capacity</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* No Provision Message */}
              <div className="text-center py-4 space-y-4 border-t">
                <div className="text-muted-foreground pt-4">
                  <p className="font-medium text-foreground">No Subgraph Service provision found</p>
                  <p className="text-sm mt-2">Your indexer does not have a provision for the Subgraph Service yet.</p>
                </div>
                <div className="text-left max-w-md mx-auto p-4 rounded-lg bg-muted/50 border text-sm space-y-3">
                  <p className="font-medium">How to create a provision:</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>
                      <strong>Automatic:</strong> The indexer-agent will create a provision automatically when:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Your idle stake is greater than 100k GRT</li>
                        <li>
                          <code className="text-xs bg-muted px-1 rounded">
                            INDEXER_AGENT_MAX_PROVISION_INITIAL_SIZE
                          </code>{" "}
                          is set
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>Via Graph Explorer:</strong> Stake GRT through{" "}
                      <a
                        href="https://thegraph.com/explorer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Graph Explorer
                      </a>
                      , which automatically provisions to the Subgraph Service.
                    </li>
                    <li>
                      <strong>Via CLI:</strong> Use{" "}
                      <code className="text-xs bg-muted px-1 rounded">graph indexer provision add &lt;amount&gt;</code>{" "}
                      after staking.
                    </li>
                  </ol>
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: The provision will appear here once it is indexed by the network subgraph.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thaw Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Thaw Requests</CardTitle>
          <CardDescription>Pending and completed thaw requests for your provision</CardDescription>
        </CardHeader>
        <CardContent>
          {thawRequestsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
                <Skeleton key={`thaw-skeleton-${i}`} className="h-12 w-full" />
              ))}
            </div>
          ) : thawRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Thawing Until</TableHead>
                  <TableHead>Time Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thawRequests.map((request) => {
                  const thawingDate = fromUnixTime(request.thawingUntil);
                  const isReady = request.fulfilled || thawingDate < new Date();
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">
                        {request.id.slice(0, 10)}...{request.id.slice(-8)}
                      </TableCell>
                      <TableCell>{formatGRT(request.shares)} GRT</TableCell>
                      <TableCell>
                        <Badge variant={isReady ? "default" : "secondary"}>
                          {request.fulfilled ? "Fulfilled" : isReady ? "Ready" : "Thawing"}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(thawingDate, "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>
                        {isReady ? (
                          <span className="text-green-600 dark:text-green-400">Ready to remove</span>
                        ) : (
                          formatDistanceToNow(thawingDate, { addSuffix: true })
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No thaw requests found.</p>
              <p className="text-sm mt-2">Thaw requests will appear here when you initiate a stake thaw.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
