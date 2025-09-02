import { Contract, formatEther, JsonRpcProvider } from "ethers";
import rewardsContractABI from "@/lib/abis/rewardsContractABI.json";
import { NETWORKS } from "@/lib/networks";

export interface RewardResult {
  allocationId: string;
  amount: string; // Amount in wei as string
  error?: string;
}

export interface BatchRewardsResult {
  results: RewardResult[];
  errors: string[];
}

/**
 * Get network configuration for rewards contract
 */
function getNetworkConfig(networkId: string) {
  const network = NETWORKS.find((n) => n.id === networkId);
  if (!network?.rewards) {
    throw new Error(`No rewards configuration found for network: ${networkId}`);
  }
  return network.rewards;
}

/**
 * Create contract instance for rewards
 */
function createRewardsContract(networkId: string) {
  const config = getNetworkConfig(networkId);
  const provider = new JsonRpcProvider(config.ethNode);
  return new Contract(config.contractAddress, rewardsContractABI, provider);
}

/**
 * Fetch pending rewards for a single allocation
 */
export async function fetchPendingReward(allocationId: string, networkId: string): Promise<RewardResult> {
  try {
    const contract = createRewardsContract(networkId);
    const amount = await contract.getRewards(allocationId);

    return {
      allocationId,
      amount: amount.toString(), // Keep as wei string
    };
  } catch (error) {
    console.error(`Error fetching reward for allocation ${allocationId}:`, error);
    return {
      allocationId,
      amount: "0",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch fetch pending rewards for multiple allocations using multicall approach
 */
export async function fetchPendingRewardsBatch(
  allocationIds: string[],
  networkId: string,
): Promise<BatchRewardsResult> {
  const results: RewardResult[] = [];
  const errors: string[] = [];

  if (allocationIds.length === 0) {
    return { results, errors };
  }

  try {
    const config = getNetworkConfig(networkId);
    const provider = new JsonRpcProvider(config.ethNode);
    const contract = new Contract(config.contractAddress, rewardsContractABI, provider);

    // Create batch call data
    const calls = allocationIds.map((allocationId) => ({
      target: config.contractAddress,
      callData: contract.interface.encodeFunctionData("getRewards", [allocationId]),
      allocationId,
    }));

    // Execute batch calls using Promise.allSettled for better error handling
    const promises = calls.map(async (call) => {
      try {
        const result = await provider.call({
          to: call.target,
          data: call.callData,
        });

        const decoded = contract.interface.decodeFunctionResult("getRewards", result);
        return {
          allocationId: call.allocationId,
          amount: decoded[0].toString(),
        };
      } catch (error) {
        return {
          allocationId: call.allocationId,
          amount: "0",
          error: error instanceof Error ? error.message : "Call failed",
        };
      }
    });

    const settled = await Promise.allSettled(promises);

    settled.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        const allocationId = allocationIds[index];
        results.push({
          allocationId,
          amount: "0",
          error: result.reason?.message || "Promise rejected",
        });
        errors.push(`Failed to fetch reward for ${allocationId}: ${result.reason}`);
      }
    });
  } catch (error) {
    // If the whole batch fails, return errors for all allocations
    const errorMessage = error instanceof Error ? error.message : "Batch call failed";
    errors.push(`Batch call failed: ${errorMessage}`);

    allocationIds.forEach((allocationId) => {
      results.push({
        allocationId,
        amount: "0",
        error: errorMessage,
      });
    });
  }

  return { results, errors };
}

/**
 * Helper to format reward amount to GRT
 */
export function formatRewardAmount(weiAmount: string): string {
  try {
    return formatEther(weiAmount);
  } catch (error) {
    console.error("Error formatting reward amount:", error);
    return "0";
  }
}

/**
 * Check if rewards are supported for a network
 */
export function isRewardsSupported(networkId: string): boolean {
  const network = NETWORKS.find((n) => n.id === networkId);
  return !!network?.rewards;
}
