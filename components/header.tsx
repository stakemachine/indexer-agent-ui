"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useNetworkStore } from "@/lib/store";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

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
								pathname === item.href
									? "text-foreground"
									: "text-muted-foreground",
							)}
						>
							{item.label}
						</Link>
					))}
				</nav>
				<div className="flex items-center space-x-4">
					<ThemeToggle />
					<Avatar>
						<AvatarImage src="/placeholder.svg" />
						<AvatarFallback>UI</AvatarFallback>
					</Avatar>
				</div>
			</div>
		</header>
	);
}
