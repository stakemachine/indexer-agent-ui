"use client";

import { useEffect, useState } from "react";

/**
 * Hook that returns true only after the component has mounted on the client.
 * Useful for preventing hydration mismatches with components that generate
 * dynamic IDs (like Radix UI primitives).
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
