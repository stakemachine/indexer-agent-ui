import type { Metadata } from "next";

import { GeistSans } from "geist/font/sans";
import "../styles/globals.css";
import { Header } from "@/components/header";
import { ThemeProvider } from "next-themes";
import { IndexerRegistrationLoader } from "@/components/indexer-registration-loader";

export const metadata: Metadata = {
	title: "The Graph Indexer Agent UI",
	description: "Dashboard for The Graph Indexer Agent",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={GeistSans.className}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<IndexerRegistrationLoader />
					<Header />
					<main className="container mx-auto p-4 space-y-6">{children}</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
