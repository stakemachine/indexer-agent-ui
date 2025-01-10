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

export function Header() {
	const { currentNetwork, setCurrentNetwork } = useNetworkStore();
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
					<Link
						href="/allocations"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						Allocations
					</Link>
					<Link
						href="/subgraphs"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						Subgraphs
					</Link>
					<Link
						href="/actions"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						Actions
					</Link>
					<Link
						href="/rules"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						Rules
					</Link>
					<Link
						href="/cost-models"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						Cost Models
					</Link>
					<Link
						href="/disputes"
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						Disputes
					</Link>
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
