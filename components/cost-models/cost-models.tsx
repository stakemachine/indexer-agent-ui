"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GraphQLClient } from "graphql-request";
import { Edit2, Plus } from "lucide-react";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { createSchemaFetcher } from "@/lib/fetchers";
import { COST_MODELS_LIST_QUERY, DELETE_COST_MODELS_MUTATION } from "@/lib/graphql/queries";
import { type CostModelsResponse, CostModelsResponseSchema } from "@/lib/graphql/schemas";
import { SubgraphDeploymentID } from "@/lib/subgraphs";
import { Checkbox } from "../ui/checkbox";
import { CostModelForm } from "./cost-model-form";

type CostModel = {
  deployment: string;
  model?: string | null;
  variables?: string | null;
};

const client = new GraphQLClient("/api/agent");

export function CostModels() {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCostModel, setEditingCostModel] = React.useState<CostModel | undefined>();

  const handleEdit = (costModel: CostModel) => {
    setEditingCostModel(costModel);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCostModel(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCostModel(undefined);
  };

  const columns: ColumnDef<CostModel>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "deployment",
      header: "Deployment",
      cell: ({ row }) => {
        const deployment = row.getValue("deployment") as string;

        // Handle "global" deployment
        if (deployment === "global") {
          return <div className="font-mono text-sm font-bold">global</div>;
        }

        // For deployment IDs, show both formats - IPFS on top (bold), hex below
        try {
          const subgraphId = new SubgraphDeploymentID(deployment);
          const hexFormat = subgraphId.bytes32;
          const ipfsFormat = subgraphId.ipfsHash;

          return (
            <div className="font-mono text-xs space-y-1 max-w-[300px]">
              <div className="font-bold " title={`IPFS: ${ipfsFormat}`}>
                {ipfsFormat}
              </div>
              <div className="text-muted-foreground " title={`Hex: ${hexFormat}`}>
                {hexFormat}
              </div>
            </div>
          );
        } catch {
          // Fallback for invalid deployment IDs
          return (
            <div className="font-mono text-sm max-w-[200px] truncate" title={deployment}>
              {deployment}
            </div>
          );
        }
      },
    },
    {
      accessorKey: "model",
      header: "Model",
      cell: ({ row }) => {
        const model = row.getValue("model") as string | null | undefined;
        if (!model) return <div className="text-muted-foreground">—</div>;

        // Try to format as JSON if it's a JSON string
        let displayModel = model;
        try {
          const parsed = JSON.parse(model);
          displayModel = JSON.stringify(parsed, null, 2);
        } catch {
          // Not JSON, display as is
        }

        return (
          <div className="max-w-[300px]">
            <pre className="text-xs overflow-auto max-h-[100px] whitespace-pre-wrap">{displayModel}</pre>
          </div>
        );
      },
    },
    {
      accessorKey: "variables",
      header: "Variables",
      cell: ({ row }) => {
        const variables = row.getValue("variables") as string | null | undefined;
        if (!variables) return <div className="text-muted-foreground">—</div>;

        // Try to format as JSON if it's a JSON string
        let displayVariables = variables;
        try {
          const parsed = JSON.parse(variables);
          displayVariables = JSON.stringify(parsed, null, 2);
        } catch {
          // Not JSON, display as is
        }

        return (
          <div className="max-w-[300px]">
            <pre className="text-xs overflow-auto max-h-[100px] whitespace-pre-wrap">{displayVariables}</pre>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const costModel = row.original;
        return (
          <Button variant="ghost" size="sm" onClick={() => handleEdit(costModel)} className="h-8 w-8 p-0">
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit cost model</span>
          </Button>
        );
      },
      enableSorting: false,
    },
  ];

  const schemaFetcher = React.useMemo(
    () =>
      createSchemaFetcher({
        endpoint: "/api/agent",
        schema: CostModelsResponseSchema,
      }),
    [],
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR<CostModelsResponse>(COST_MODELS_LIST_QUERY, (q) =>
    schemaFetcher(q),
  );

  const costModels: CostModel[] = React.useMemo(() => {
    if (!data?.costModels) return [];
    return data.costModels;
  }, [data]);

  const handleDelete = async (selectedCostModels: CostModel[]) => {
    const deployments = selectedCostModels.map((costModel) => costModel.deployment);
    try {
      await client.request(DELETE_COST_MODELS_MUTATION, { deployments });
      toast({
        title: "Cost models deleted",
        description: `Successfully deleted ${deployments.length} cost model(s)`,
      });
      mutate(); // Refresh the data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cost model(s)",
        variant: "destructive",
      });
      console.error("Failed to delete cost model(s):", error);
    }
  };

  const handleFormSuccess = () => {
    mutate(); // Refresh the data after form submission
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div></div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Cost Model
        </Button>
      </div>
      <DataGrid
        columns={columns}
        data={costModels}
        onRefresh={() => mutate()}
        error={error ? "Failed to load cost models" : null}
        isLoading={isLoading}
        isValidating={isValidating}
        autoRefreshEnabled={autoRefreshEnabled}
        onAutoRefreshChange={setAutoRefreshEnabled}
        autoRefreshInterval={30000} // 30 seconds
        batchActions={[
          {
            label: "Delete",
            onClick: handleDelete,
          },
        ]}
      />
      <CostModelForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        costModel={editingCostModel}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
