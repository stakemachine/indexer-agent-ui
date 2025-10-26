"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GraphQLClient } from "graphql-request";
import { Edit, Plus, Save, X } from "lucide-react";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { createSchemaFetcher } from "@/lib/fetchers";
import {
  DELETE_INDEXING_RULES_MUTATION,
  INDEXING_RULES_LIST_QUERY,
  SET_INDEXING_RULE_MUTATION,
} from "@/lib/graphql/queries";
import { type IndexingRulesResponse, IndexingRulesResponseSchema } from "@/lib/graphql/schemas";
import { resolveChainAlias } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";

type IndexingRule = {
  identifier: string;
  identifierType?: string | null;
  allocationAmount?: string | null;
  allocationLifetime: number | null;
  autoRenewal?: boolean | null;
  parallelAllocations: number | null;
  maxAllocationPercentage: number | string | null;
  minSignal?: string | null;
  maxSignal?: string | null;
  minStake?: string | null;
  minAverageQueryFees?: string | null;
  custom?: string | null;
  decisionBasis?: string | null;
  requireSupported?: boolean | null;
  safety?: boolean | null;
  protocolNetwork: string;
};

type EditingState = {
  [key: string]: Partial<IndexingRule>;
};

type CellValue = string | number | boolean | null | undefined;

const DECISION_BASIS_OPTIONS = [
  { value: "always", label: "Always" },
  { value: "never", label: "Never" },
  { value: "rules", label: "Rules" },
  { value: "offchain", label: "Offchain" },
];

const IDENTIFIER_TYPE_OPTIONS = [
  { value: "deployment", label: "Deployment" },
  { value: "subgraph", label: "Subgraph" },
];

const EditableCell = ({
  value,
  ruleId,
  field,
  type = "text",
  options,
  editingState,
  setEditingState,
  onSave,
}: {
  value: CellValue;
  ruleId: string;
  field: keyof IndexingRule;
  type?: "text" | "number" | "boolean" | "select";
  options?: Array<{ value: string; label: string }>;
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  onSave: (ruleId: string, field: keyof IndexingRule, value: CellValue) => Promise<void>;
}) => {
  const isEditing = editingState[ruleId] && editingState[ruleId][field] !== undefined;
  const editValue = isEditing ? editingState[ruleId][field] : value;

  const startEdit = () => {
    setEditingState((prev) => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: value,
      },
    }));
  };

  const handleChange = (newValue: CellValue) => {
    setEditingState((prev) => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: newValue,
      },
    }));
  };

  const handleSave = async () => {
    await onSave(ruleId, field, editValue);
    setEditingState((prev) => {
      const newState = { ...prev };
      if (newState[ruleId]) {
        delete newState[ruleId][field];
        if (Object.keys(newState[ruleId]).length === 0) {
          delete newState[ruleId];
        }
      }
      return newState;
    });
  };

  const handleCancel = () => {
    setEditingState((prev) => {
      const newState = { ...prev };
      if (newState[ruleId]) {
        delete newState[ruleId][field];
        if (Object.keys(newState[ruleId]).length === 0) {
          delete newState[ruleId];
        }
      }
      return newState;
    });
  };

  if (type === "boolean") {
    return (
      <div className="flex items-center space-x-2">
        <Switch checked={!!editValue} onCheckedChange={isEditing ? handleChange : startEdit} disabled={false} />
        {isEditing && (
          <div className="flex space-x-1">
            <Button size="sm" variant="ghost" onClick={handleSave}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (type === "select") {
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <Select
            value={String(editValue || "")}
            onValueChange={(value) => handleChange(value === "null" ? null : value)}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null" className="text-muted-foreground italic">
                Set to null
              </SelectItem>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 group">
        <span className={value === null ? "text-muted-foreground italic" : ""}>
          {value === null ? "null" : value || "—"}
        </span>
        <Button size="sm" variant="ghost" onClick={startEdit} className="opacity-0 group-hover:opacity-100">
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (isEditing) {
    // Add field-specific validation
    const getMinValue = () => {
      if (field === "allocationLifetime" || field === "parallelAllocations") return 1;
      if (field === "maxAllocationPercentage") return 0;
      return undefined;
    };

    const getMaxValue = () => {
      if (field === "maxAllocationPercentage") return 100;
      return undefined;
    };

    return (
      <div className="flex items-center space-x-2">
        <Input
          type={type}
          value={String(editValue || "")}
          onChange={(e) => {
            const inputValue = e.target.value;

            // If input is empty, set to null
            if (inputValue === "" || inputValue === null || inputValue === undefined) {
              handleChange(null);
              return;
            }

            let newValue = type === "number" ? Number(inputValue) : inputValue;

            // Apply field-specific validation for numeric fields
            if (type === "number" && typeof newValue === "number" && !Number.isNaN(newValue)) {
              const minValue = getMinValue();
              const maxValue = getMaxValue();

              if (minValue !== undefined && newValue < minValue) {
                newValue = minValue;
              }
              if (maxValue !== undefined && newValue > maxValue) {
                newValue = maxValue;
              }
            }

            handleChange(newValue);
          }}
          min={getMinValue()}
          max={getMaxValue()}
          className="h-8 w-32"
          placeholder="Enter value or leave empty for null"
        />
        <Button size="sm" variant="ghost" onClick={handleSave}>
          <Save className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 group">
      <span className={value === null ? "text-muted-foreground italic" : ""}>
        {value === null ? "null" : value || "—"}
      </span>
      <Button size="sm" variant="ghost" onClick={startEdit} className="opacity-0 group-hover:opacity-100">
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
};

const createColumns = (
  editingState: EditingState,
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>,
  onSave: (ruleId: string, field: keyof IndexingRule, value: CellValue) => Promise<void>,
): ColumnDef<IndexingRule>[] => [
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
    accessorKey: "identifier",
    header: "Identifier",
    meta: { disableFacetHelpers: true },
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("identifier")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="identifier"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "identifierType",
    header: "Identifier Type",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("identifierType")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="identifierType"
        type="select"
        options={IDENTIFIER_TYPE_OPTIONS}
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "allocationAmount",
    header: "Allocation Amount",
    cell: ({ row }) => {
      const val = row.getValue("allocationAmount") as string | null | undefined;
      const displayValue = val ? (Number.parseFloat(val) / 1e18).toFixed(2) : null;

      return (
        <EditableCell
          value={displayValue}
          ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
          field="allocationAmount"
          type="number"
          editingState={editingState}
          setEditingState={setEditingState}
          onSave={onSave}
        />
      );
    },
  },
  {
    accessorKey: "decisionBasis",
    header: "Decision Basis",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("decisionBasis")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="decisionBasis"
        type="select"
        options={DECISION_BASIS_OPTIONS}
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "protocolNetwork",
    header: "Protocol Network",
    cell: (row) => resolveChainAlias(row.getValue() as string),
  },
  {
    accessorKey: "allocationLifetime",
    header: "Allocation Lifetime",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("allocationLifetime")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="allocationLifetime"
        type="number"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "autoRenewal",
    header: "Auto Renewal",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("autoRenewal")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="autoRenewal"
        type="boolean"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "parallelAllocations",
    header: "Parallel Allocations",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("parallelAllocations")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="parallelAllocations"
        type="number"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "maxAllocationPercentage",
    header: "Max Allocation %",
    cell: ({ row }) => {
      const v = row.getValue("maxAllocationPercentage") as string | number | null | undefined;

      return (
        <EditableCell
          value={v}
          ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
          field="maxAllocationPercentage"
          type="number"
          editingState={editingState}
          setEditingState={setEditingState}
          onSave={onSave}
        />
      );
    },
  },
  {
    accessorKey: "minSignal",
    header: "Min Signal",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("minSignal")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="minSignal"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "maxSignal",
    header: "Max Signal",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("maxSignal")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="maxSignal"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "minStake",
    header: "Min Stake",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("minStake")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="minStake"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "minAverageQueryFees",
    header: "Min Avg Query Fees",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("minAverageQueryFees")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="minAverageQueryFees"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "requireSupported",
    header: "Require Supported",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("requireSupported")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="requireSupported"
        type="boolean"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
  {
    accessorKey: "safety",
    header: "Safety",
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue("safety")}
        ruleId={`${row.original.identifier}-${row.original.protocolNetwork}`}
        field="safety"
        type="boolean"
        editingState={editingState}
        setEditingState={setEditingState}
        onSave={onSave}
      />
    ),
  },
];

const client = new GraphQLClient("/api/agent");

type NewRuleFormData = {
  identifier: string;
  identifierType: string;
  allocationAmount: string;
  allocationLifetime: number;
  autoRenewal: boolean;
  parallelAllocations: number;
  maxAllocationPercentage: number;
  minSignal: string;
  maxSignal: string;
  minStake: string;
  minAverageQueryFees: string;
  decisionBasis: string;
  requireSupported: boolean;
  safety: boolean;
  protocolNetwork: string;
};

const CreateRuleDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<NewRuleFormData>({
    identifier: "",
    identifierType: "deployment",
    allocationAmount: "",
    allocationLifetime: 1,
    autoRenewal: true,
    parallelAllocations: 1,
    maxAllocationPercentage: 0,
    minSignal: "",
    maxSignal: "",
    minStake: "",
    minAverageQueryFees: "",
    decisionBasis: "never",
    requireSupported: true,
    safety: true,
    protocolNetwork: "eip155:42161", // Default to Arbitrum One
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert allocation amount from ETH to wei if provided
      const ruleData = {
        ...formData,
        allocationAmount: formData.allocationAmount
          ? (Number.parseFloat(formData.allocationAmount) * 1e18).toString()
          : null,
        minSignal: formData.minSignal || null,
        maxSignal: formData.maxSignal || null,
        minStake: formData.minStake || null,
        minAverageQueryFees: formData.minAverageQueryFees || null,
      };

      await client.request(SET_INDEXING_RULE_MUTATION, { rule: ruleData });

      toast({
        title: "Rule created",
        description: "Successfully created new indexing rule",
      });

      setOpen(false);
      onSuccess();

      // Reset form
      setFormData({
        identifier: "",
        identifierType: "deployment",
        allocationAmount: "",
        allocationLifetime: 1,
        autoRenewal: true,
        parallelAllocations: 1,
        maxAllocationPercentage: 0,
        minSignal: "",
        maxSignal: "",
        minStake: "",
        minAverageQueryFees: "",
        decisionBasis: "never",
        requireSupported: true,
        safety: true,
        protocolNetwork: "eip155:42161",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create indexing rule",
        variant: "destructive",
      });
      console.error("Failed to create rule:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Indexing Rule</DialogTitle>
          <DialogDescription>Create a new indexing rule for a subgraph deployment or subgraph name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Identifier *</Label>
            <Input
              id="identifier"
              placeholder="QmHash... or subgraph-name"
              value={formData.identifier}
              onChange={(e) => setFormData((prev) => ({ ...prev, identifier: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifierType">Identifier Type</Label>
            <Select
              value={formData.identifierType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, identifierType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deployment">Deployment</SelectItem>
                <SelectItem value="subgraph">Subgraph</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="protocolNetwork">Protocol Network</Label>
            <Select
              value={formData.protocolNetwork}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, protocolNetwork: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eip155:1">Ethereum Mainnet</SelectItem>
                <SelectItem value="eip155:42161">Arbitrum One</SelectItem>
                <SelectItem value="eip155:100">Gnosis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allocationAmount">Allocation Amount (ETH)</Label>
              <Input
                id="allocationAmount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                value={formData.allocationAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, allocationAmount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocationLifetime">Allocation Lifetime</Label>
              <Input
                id="allocationLifetime"
                type="number"
                min="1"
                value={formData.allocationLifetime}
                onChange={(e) => setFormData((prev) => ({ ...prev, allocationLifetime: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parallelAllocations">Parallel Allocations</Label>
              <Input
                id="parallelAllocations"
                type="number"
                min="1"
                value={formData.parallelAllocations}
                onChange={(e) => setFormData((prev) => ({ ...prev, parallelAllocations: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAllocationPercentage">Max Allocation %</Label>
              <Input
                id="maxAllocationPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.maxAllocationPercentage}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxAllocationPercentage: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="decisionBasis">Decision Basis</Label>
            <Select
              value={formData.decisionBasis}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, decisionBasis: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="rules">Rules</SelectItem>
                <SelectItem value="offchain">Offchain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="autoRenewal"
                checked={formData.autoRenewal}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, autoRenewal: checked }))}
              />
              <Label htmlFor="autoRenewal">Auto Renewal</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requireSupported"
                checked={formData.requireSupported}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, requireSupported: checked }))}
              />
              <Label htmlFor="requireSupported">Require Supported</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="safety"
                checked={formData.safety}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, safety: checked }))}
              />
              <Label htmlFor="safety">Safety</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.identifier}>
              {isSubmitting ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export function Rules() {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);
  const [editingState, setEditingState] = React.useState<EditingState>({});

  const schemaFetcher = React.useMemo(
    () =>
      createSchemaFetcher({
        endpoint: "/api/agent",
        schema: IndexingRulesResponseSchema,
      }),
    [],
  );
  const { data, error, isLoading, isValidating, mutate } = useSWR<IndexingRulesResponse>(
    INDEXING_RULES_LIST_QUERY,
    (q) => schemaFetcher(q),
  );

  const rules: IndexingRule[] = React.useMemo(() => {
    if (!data?.indexingRules) return [];
    return data.indexingRules.map((r) => ({
      ...r,
      allocationLifetime: Number(r.allocationLifetime),
      parallelAllocations: Number(r.parallelAllocations),
      maxAllocationPercentage: Number(r.maxAllocationPercentage),
    }));
  }, [data]);

  const handleSave = React.useCallback(
    async (ruleId: string, field: keyof IndexingRule, value: CellValue) => {
      const [identifier, protocolNetwork] = ruleId.split("-");
      const rule = rules.find((r) => r.identifier === identifier && r.protocolNetwork === protocolNetwork);

      if (!rule) {
        toast({
          title: "Error",
          description: "Rule not found",
          variant: "destructive",
        });
        return;
      }

      // Convert and validate the value
      let apiValue = value;
      if (field === "allocationAmount" && typeof value === "number") {
        apiValue = (value * 1e18).toString();
      } else if (field === "allocationAmount" && value === null) {
        apiValue = null; // Preserve null value
      }

      // Apply validation rules for specific fields
      const validatedRule: Record<string, unknown> = { ...rule };

      // Set the updated field
      validatedRule[field as string] = apiValue;

      // Convert invalid values to null for cleaner logic
      const finalRule = {
        identifier: validatedRule.identifier,
        identifierType: validatedRule.identifierType || "deployment",
        allocationAmount: validatedRule.allocationAmount,
        allocationLifetime: validatedRule.allocationLifetime === 0 ? null : validatedRule.allocationLifetime,
        autoRenewal: validatedRule.autoRenewal ?? true,
        parallelAllocations: validatedRule.parallelAllocations === 0 ? null : validatedRule.parallelAllocations,
        maxAllocationPercentage:
          validatedRule.maxAllocationPercentage === null
            ? null
            : Number(validatedRule.maxAllocationPercentage) < 0
              ? null
              : validatedRule.maxAllocationPercentage,
        minSignal: validatedRule.minSignal,
        maxSignal: validatedRule.maxSignal,
        minStake: validatedRule.minStake,
        minAverageQueryFees: validatedRule.minAverageQueryFees,
        custom: validatedRule.custom,
        decisionBasis: validatedRule.decisionBasis || "never",
        requireSupported: validatedRule.requireSupported ?? true,
        safety: validatedRule.safety ?? true,
        protocolNetwork: validatedRule.protocolNetwork,
      };

      try {
        await client.request(SET_INDEXING_RULE_MUTATION, { rule: finalRule });
        toast({
          title: "Rule updated",
          description: `Successfully updated ${field}`,
        });
        mutate(); // Refresh the data
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to update ${field}`,
          variant: "destructive",
        });
        console.error("Failed to update rule:", error);
      }
    },
    [rules, mutate],
  );

  const columns = React.useMemo(
    () => createColumns(editingState, setEditingState, handleSave),
    [editingState, handleSave],
  );

  const handleDelete = async (selectedRules: IndexingRule[]) => {
    const identifiers = selectedRules.map((rule) => ({
      identifier: rule.identifier,
      protocolNetwork: rule.protocolNetwork,
    }));
    try {
      await client.request(DELETE_INDEXING_RULES_MUTATION, { identifiers });
      toast({
        title: "Rules deleted",
        description: `Successfully deleted ${identifiers.length} rule(s)`,
      });
      mutate(); // Refresh the data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rule(s)",
        variant: "destructive",
      });
      console.error("Failed to delete rule(s):", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div></div>
        <CreateRuleDialog onSuccess={() => mutate()} />
      </div>
      <DataGrid
        columns={columns}
        data={rules}
        onRefresh={() => mutate()}
        error={error ? "Failed to load indexing rules" : null}
        isLoading={isLoading}
        isValidating={isValidating}
        autoRefreshEnabled={autoRefreshEnabled}
        onAutoRefreshChange={setAutoRefreshEnabled}
        autoRefreshInterval={30000} // 30 seconds
        enableFilterSidebar
        persistKey="rules.filters"
        batchActions={[
          {
            label: "Delete",
            onClick: handleDelete,
          },
        ]}
      />
    </div>
  );
}
