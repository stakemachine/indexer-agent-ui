// Utility factory to generate deterministic mock table data for DataGrid tests.
// T002

export interface MockRow {
  id: number;
  name: string;
  category: string;
  amount: number;
  active: boolean;
  nested?: { note: string };
}

const categories = ["alpha", "beta", "gamma", "delta"] as const;

export interface BuildOptions {
  count?: number; // number of rows
  withNested?: boolean; // include nested objects for globalFilter coverage
  seed?: number; // optional seed (simple LCG) for reproducibility
}

export function buildTableData(options: BuildOptions = {}): MockRow[] {
  const { count = 25, withNested = true, seed = 42 } = options;
  // Simple linear congruential generator for deterministic pseudo-randomness
  let state = seed % 2147483647;
  const rand = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };

  return Array.from({ length: count }).map((_, i) => {
    const category = categories[i % categories.length];
    const amountBase = Math.floor(rand() * 1000);
    return {
      id: i + 1,
      name: `Row ${i + 1}`,
      category,
      amount: amountBase + i,
      active: i % 2 === 0,
      ...(withNested ? { nested: { note: `Note ${category} ${i}` } } : {}),
    } as MockRow;
  });
}

export function buildColumns(): import("@tanstack/react-table").ColumnDef<MockRow, unknown>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => row.original.id,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.original.name,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => row.original.amount,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "active",
      header: "Active",
      cell: ({ row }) => (row.original.active ? "Yes" : "No"),
      enableSorting: true,
      enableColumnFilter: true,
    },
  ];
}
