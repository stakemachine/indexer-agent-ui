import { IndexerDeployments } from "@/components/dashboard/indexer-deployments";
import { ActiveAllocations } from "@/components/dashboard/active-allocations";
import { IndexerInfo } from "@/components/dashboard/indexer-info";
import { CurrentEpoch } from "@/components/current-epoch";

export default function DashboardPage() {
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-semibold">Dashboard</h1>
			<IndexerInfo />
			<CurrentEpoch />

			<IndexerDeployments />
			<ActiveAllocations />
		</div>
	);
}
