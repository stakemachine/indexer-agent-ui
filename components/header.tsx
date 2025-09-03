"use client";

import { GithubIcon, LogInIcon, LogOutIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UpdateIndicator } from "@/components/update-indicator";
import { useLatestRelease } from "@/hooks/use-latest-release";
import { NETWORKS } from "@/lib/networks";
import { useNetworkStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

type NavItem<T extends string = string> = {
  href: Route<T>;
  label: string;
};

const menuItems: NavItem<Route>[] = [
  { href: "/allocations", label: "Allocations" },
  { href: "/actions", label: "Actions" },
  { href: "/subgraphs", label: "Subgraphs" },
  { href: "/rules", label: "Rules" },
  { href: "/cost-models", label: "Cost Models" },
  { href: "/disputes", label: "Disputes" },
];

export function Header() {
  const { currentNetwork, setCurrentNetwork } = useNetworkStore();
  const pathname = usePathname();
  const { status } = useSession();
  const authenticated = status === "authenticated";
  const loadingSession = status === "loading";
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "stakemachine/indexer-agent-ui";
  const { latestTag, updateAvailable } = useLatestRelease(repo, appVersion);
  return (
    <header className="border-b">
      <div className="mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-semibold text-lg">
            Indexer Agent UI
          </Link>
          {appVersion && (
            <span className="text-xs text-muted-foreground" title={`Version ${appVersion}`}>
              v{appVersion}
            </span>
          )}
          <Select value={currentNetwork} onValueChange={setCurrentNetwork}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {NETWORKS.map((net) => (
                <SelectItem key={net.id} value={net.id}>
                  {net.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <nav className="flex-1 flex items-center justify-center space-x-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm hover:text-foreground",
                pathname === item.href ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label="Open GitHub repository"
              title={updateAvailable && latestTag ? `New version ${latestTag} available` : "GitHub"}
            >
              <Link href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer">
                <GithubIcon className="h-4 w-4" />
              </Link>
            </Button>
            <UpdateIndicator
              show={updateAvailable}
              title={latestTag ? `New version ${latestTag} available` : undefined}
            />
          </div>
          <ThemeToggle />
          {loadingSession ? (
            <Button variant="outline" size="icon" disabled aria-label="Loading session">
              <span className="h-4 w-4 animate-pulse rounded-sm bg-muted" />
            </Button>
          ) : authenticated ? (
            <Button
              variant="outline"
              size="icon"
              aria-label="Logout"
              title="Logout"
              onClick={async () => {
                await signOut({ callbackUrl: `/signin?callbackUrl=${encodeURIComponent(pathname)}` });
              }}
            >
              <LogOutIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              aria-label="Login"
              title="Login"
              onClick={() => signIn(undefined, { callbackUrl: pathname || "/" })}
            >
              <LogInIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
