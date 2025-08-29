"use client";

import useSWR from "swr";

type GitHubRelease = {
  tag_name?: string;
};

function normalizeVersion(v: string): string {
  return v.replace(/^v/i, "").trim();
}

function isNewer(remoteTag: string, localVersion: string): boolean {
  const a = normalizeVersion(remoteTag)
    .split(".")
    .map((n) => parseInt(n, 10));
  const b = normalizeVersion(localVersion)
    .split(".")
    .map((n) => parseInt(n, 10));
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const aiRaw = a[i];
    const biRaw = b[i];
    const ai = Number.isFinite(aiRaw ?? NaN) ? (aiRaw as number) : 0;
    const bi = Number.isFinite(biRaw ?? NaN) ? (biRaw as number) : 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return false;
}

async function fetchLatestRelease(repo: string): Promise<GitHubRelease> {
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`);
  return res.json();
}

export function useLatestRelease(
  repo: string | undefined,
  localVersion: string | undefined,
  options?: { dedupeMs?: number },
) {
  const dedupeMs = options?.dedupeMs ?? 6 * 60 * 60 * 1000; // 6 hours
  const shouldFetch = Boolean(repo);
  const { data, error, isLoading, mutate } = useSWR<GitHubRelease>(
    shouldFetch ? ["gh:latest-release", repo] : null,
    ([, r]) => fetchLatestRelease(r as string),
    {
      dedupingInterval: dedupeMs,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const latestTag = data?.tag_name || null;
  const updateAvailable = Boolean(latestTag && localVersion && isNewer(latestTag, localVersion));

  return { latestTag, updateAvailable, isLoading, error, mutate };
}
