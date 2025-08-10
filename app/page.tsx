import React, { Suspense } from "react";
import { CurrentEpoch } from "@/components/current-epoch";
import { ActiveAllocations } from "@/components/dashboard/active-allocations";
import { IndexerDeployments } from "@/components/dashboard/indexer-deployments";
import { IndexerInfo } from "@/components/dashboard/indexer-info";
import { ErrorBoundary } from "@/components/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton({ lines = 4 }: { lines?: number }) {
  const items = React.useMemo(
    () => Array.from({ length: lines }, (_, i) => ({ id: `card-skel-${lines}-${i}` })),
    [lines],
  );
  return (
    <div className="border rounded-lg p-6 space-y-3">
      {items.map((item, i) => (
        <Skeleton key={item.id} className={i === 0 ? "h-6 w-40" : "h-4 w-full"} />
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  const rowItems = React.useMemo(
    () => Array.from({ length: rows }, (_, r) => ({ id: `row-skel-${rows}-${r}` })),
    [rows],
  );
  const colItems = React.useMemo(
    () => Array.from({ length: cols }, (_, c) => ({ id: `col-skel-${cols}-${c}` })),
    [cols],
  );
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <Skeleton className="h-6 w-48" />
      <div className="space-y-2">
        {rowItems.map((row) => (
          <div key={row.id} className="flex space-x-2">
            {colItems.map((col) => (
              <Skeleton key={`${row.id}-${col.id}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <ErrorBoundary fallbackTitle="Indexer info failed">
        <Suspense fallback={<CardSkeleton lines={6} />}>
          <IndexerInfo />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Epoch widget failed" compact>
        <Suspense fallback={<CardSkeleton lines={2} />}>
          <CurrentEpoch />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Deployments failed">
        <Suspense fallback={<TableSkeleton rows={6} cols={6} />}>
          <IndexerDeployments />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Allocations failed">
        <Suspense fallback={<TableSkeleton rows={6} cols={6} />}>
          <ActiveAllocations />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
