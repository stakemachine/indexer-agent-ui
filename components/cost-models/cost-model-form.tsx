"use client";

import { GraphQLClient } from "graphql-request";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { SET_COST_MODEL_MUTATION } from "@/lib/graphql/queries";
import { SubgraphDeploymentID } from "@/lib/subgraphs";

type CostModel = {
  deployment: string;
  model?: string | null;
  variables?: string | null; // Only for display, not for input
};

interface CostModelFormProps {
  isOpen: boolean;
  onClose: () => void;
  costModel?: CostModel;
  onSuccess: () => void;
}

const client = new GraphQLClient("/api/agent");

export function CostModelForm({ isOpen, onClose, costModel, onSuccess }: CostModelFormProps) {
  const [deployment, setDeployment] = React.useState("");
  const [model, setModel] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    deployment?: string;
    model?: string;
  }>({});

  const isEditing = !!costModel;

  // Initialize form with existing data when editing
  React.useEffect(() => {
    if (costModel) {
      setDeployment(costModel.deployment);
      setModel(costModel.model || "");
    } else {
      setDeployment("");
      setModel("");
    }
    setErrors({});
  }, [costModel]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!deployment.trim()) {
      newErrors.deployment = "Deployment ID is required";
    } else {
      const deploymentValue = deployment.trim();

      // Allow "global" for global cost model
      if (deploymentValue === "global") {
        // Valid - no error
      } else {
        // Try to create SubgraphDeploymentID to validate format
        try {
          new SubgraphDeploymentID(deploymentValue);
          // Valid - no error
        } catch {
          newErrors.deployment = 'Deployment ID must be a valid subgraph deployment ID (0x... or Qm...) or "global"';
        }
      }
    }

    // Validate cost model format: must be "default => x;" where x is a number
    if (model.trim()) {
      const modelPattern = /^default\s*=>\s*\d+(\.\d+)?;$/;
      if (!modelPattern.test(model.trim())) {
        newErrors.model =
          'Cost model must be of the form "default => x;" where x is a number (e.g., "default => 0.01;")';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Convert deployment ID to hex format if needed
      let deploymentId = deployment.trim();
      if (deploymentId !== "global") {
        // Convert to hex format using SubgraphDeploymentID
        const subgraphId = new SubgraphDeploymentID(deploymentId);
        deploymentId = subgraphId.bytes32; // This gives us the 0x... format
      }

      // Cost model input following official indexer agent schema
      const costModelInput = {
        deployment: deploymentId,
        model: model.trim() || null,
      };

      await client.request(SET_COST_MODEL_MUTATION, { costModel: costModelInput });

      toast({
        title: isEditing ? "Cost model updated" : "Cost model created",
        description: `Successfully ${isEditing ? "updated" : "created"} cost model for deployment ${deployment}`,
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      // Extract detailed error message from GraphQL error
      let errorMessage = `Failed to ${isEditing ? "update" : "create"} cost model`;

      if (error && typeof error === "object" && "response" in error) {
        const graphqlError = error as { response?: { errors?: Array<{ message: string }> } };
        if (graphqlError.response?.errors?.[0]?.message) {
          errorMessage = graphqlError.response.errors[0].message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error(`Failed to ${isEditing ? "update" : "create"} cost model:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Cost Model" : "Create Cost Model"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the cost model for this deployment."
                : "Create a cost model for a subgraph deployment. The model must be in the format 'default => x;' where x is a number."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deployment">Deployment ID</Label>
              <Input
                id="deployment"
                value={deployment}
                onChange={(e) => setDeployment(e.target.value)}
                placeholder='Enter deployment ID (0x... or "global")'
                disabled={isEditing || isLoading}
                className={errors.deployment ? "border-red-500" : ""}
              />
              {!errors.deployment && (
                <p className="text-sm text-muted-foreground">
                  Use "global" for the global cost model, or a 32-byte hex string (0x followed by 64 hex characters).
                  <br />
                  Note: If you have an IPFS hash (Qm...), you need to convert it to hex format first.
                </p>
              )}
              {errors.deployment && <p className="text-sm text-red-500">{errors.deployment}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Textarea
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder='Enter cost model (e.g., "default => 0.01;")'
                rows={4}
                disabled={isLoading}
                className={`font-mono text-sm ${errors.model ? "border-red-500" : ""}`}
              />
              {errors.model && <p className="text-sm text-red-500">{errors.model}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
