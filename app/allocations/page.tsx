import { Allocations } from "@/components/allocations/allocations";

export default function AllocationsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Allocations</h1>
      <Allocations />
    </div>
  );
}
