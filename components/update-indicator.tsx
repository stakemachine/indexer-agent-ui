"use client";

export function UpdateIndicator({ show, title }: { show: boolean; title?: string }) {
  if (!show) return null;
  return (
    <span
      className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"
      aria-hidden="true"
      title={title || "Update available"}
    />
  );
}
