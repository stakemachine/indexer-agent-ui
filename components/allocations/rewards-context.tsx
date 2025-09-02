"use client";

import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import {
  fetchPendingReward,
  fetchPendingRewardsBatch,
  isRewardsSupported,
  type RewardResult,
} from "@/lib/contracts/rewards";
import { useNetworkStore } from "@/lib/store";

interface RewardState {
  amount: string; // Amount in wei as string
  loading: boolean;
  error: boolean;
  notFound: boolean;
  errorMessage?: string;
}

interface RewardsContextType {
  pendingRewards: Record<string, RewardState>;
  batchLoading: boolean;
  fetchRewards: (allocationIds: string[]) => Promise<void>;
  fetchReward: (allocationId: string) => Promise<void>;
  getTotalPendingRewards: () => string;
  isSupported: boolean;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export function useRewardsContext(): RewardsContextType {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error("useRewardsContext must be used within a RewardsProvider");
  }
  return context;
}

interface RewardsProviderProps {
  children: ReactNode;
  allocations: Array<{ id: string; status: string }>;
}

export function RewardsProvider({ children, allocations }: RewardsProviderProps) {
  const { currentNetwork } = useNetworkStore();
  const [pendingRewards, setPendingRewards] = useState<Record<string, RewardState>>({});
  const [batchLoading, setBatchLoading] = useState(false);

  const isSupported = isRewardsSupported(currentNetwork);

  const updateRewardState = useCallback((allocationId: string, update: Partial<RewardState>) => {
    setPendingRewards((prev) => ({
      ...prev,
      [allocationId]: {
        ...prev[allocationId],
        ...update,
      },
    }));
  }, []);

  const processRewardResult = useCallback(
    (result: RewardResult) => {
      updateRewardState(result.allocationId, {
        amount: result.amount,
        loading: false,
        error: !!result.error,
        notFound: false,
        errorMessage: result.error,
      });
    },
    [updateRewardState],
  );

  const fetchReward = useCallback(
    async (allocationId: string) => {
      if (!isSupported) {
        console.warn(`Rewards not supported for network: ${currentNetwork}`);
        return;
      }

      // Set loading state
      updateRewardState(allocationId, {
        amount: "0",
        loading: true,
        error: false,
        notFound: false,
        errorMessage: undefined,
      });

      try {
        const result = await fetchPendingReward(allocationId, currentNetwork);
        processRewardResult(result);
      } catch (error) {
        console.error(`Error fetching reward for allocation ${allocationId}:`, error);
        updateRewardState(allocationId, {
          amount: "0",
          loading: false,
          error: true,
          notFound: false,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [currentNetwork, isSupported, updateRewardState, processRewardResult],
  );

  const fetchRewards = useCallback(
    async (allocationIds: string[]) => {
      if (!isSupported) {
        console.warn(`Rewards not supported for network: ${currentNetwork}`);
        return;
      }

      if (allocationIds.length === 0) return;

      setBatchLoading(true);

      // Set loading state for all allocations
      allocationIds.forEach((allocationId) => {
        updateRewardState(allocationId, {
          amount: "0",
          loading: true,
          error: false,
          notFound: false,
          errorMessage: undefined,
        });
      });

      try {
        const batchResult = await fetchPendingRewardsBatch(allocationIds, currentNetwork);

        // Process all results
        batchResult.results.forEach(processRewardResult);

        // Log any batch-level errors
        if (batchResult.errors.length > 0) {
          console.warn("Batch rewards fetch had errors:", batchResult.errors);
        }
      } catch (error) {
        console.error("Error in batch rewards fetch:", error);

        // Set error state for all allocations
        allocationIds.forEach((allocationId) => {
          updateRewardState(allocationId, {
            amount: "0",
            loading: false,
            error: true,
            notFound: false,
            errorMessage: error instanceof Error ? error.message : "Batch fetch failed",
          });
        });
      } finally {
        setBatchLoading(false);
      }
    },
    [currentNetwork, isSupported, updateRewardState, processRewardResult],
  );

  const getTotalPendingRewards = useCallback((): string => {
    const activeAllocationIds = allocations
      .filter((allocation) => allocation.status === "Active")
      .map((allocation) => allocation.id);

    let total = BigInt(0);
    let hasValidData = false;

    activeAllocationIds.forEach((allocationId) => {
      const rewardState = pendingRewards[allocationId];
      if (rewardState && !rewardState.loading && !rewardState.error && rewardState.amount !== "0") {
        try {
          total += BigInt(rewardState.amount);
          hasValidData = true;
        } catch (error) {
          console.error(`Error parsing reward amount for ${allocationId}:`, error);
        }
      }
    });

    return hasValidData ? total.toString() : "0";
  }, [allocations, pendingRewards]);

  const contextValue: RewardsContextType = {
    pendingRewards,
    batchLoading,
    fetchRewards,
    fetchReward,
    getTotalPendingRewards,
    isSupported,
  };

  return <RewardsContext.Provider value={contextValue}>{children}</RewardsContext.Provider>;
}
