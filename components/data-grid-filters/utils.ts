export interface FilterDescriptor {
  id: string;
  value: unknown;
}

export function upsertFilter(list: FilterDescriptor[], id: string, value: unknown): FilterDescriptor[] {
  const existing = list.find((f) => f.id === id);
  if (existing) return list.map((f) => (f.id === id ? { ...f, value } : f));
  return [...list, { id, value }];
}

export function removeFilter(list: FilterDescriptor[], id: string): FilterDescriptor[] {
  return list.filter((f) => f.id !== id);
}

export function mergeFilters(base: FilterDescriptor[], incoming: FilterDescriptor[]): FilterDescriptor[] {
  const map = new Map<string, FilterDescriptor>();
  [...base, ...incoming].forEach((f) => {
    map.set(f.id, f);
  });
  return Array.from(map.values());
}
