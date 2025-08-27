"use client";

import { Github, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNetworkStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const menuItems = [
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
  const NetworksList = ["arbitrum-one", "mainnet", "goerli", "arbitrum-goerli"];
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-semibold text-lg">
            Agent UI
          </Link>
          <Select value={currentNetwork} onValueChange={setCurrentNetwork}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {NetworksList.map((network) => (
                <SelectItem key={network} value={network}>
                  {network}
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
          <Button asChild variant="outline" size="icon" aria-label="Open GitHub repository" title="GitHub">
            <Link href="https://github.com/stakemachine/indexer-agent-ui" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
            </Link>
          </Button>
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
                await signOut({ callbackUrl: "/signin" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              aria-label="Login"
              title="Login"
              onClick={() => signIn(undefined, { callbackUrl: pathname || "/" })}
            >
              <LogIn className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
