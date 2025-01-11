import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function NotFound() {
	return (
		<div className="flex items-center justify-center min-h-screen bg-background">
			<Card className="w-full max-w-md mx-auto">
				<CardContent className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
					<AlertCircle className="w-24 h-24 text-muted-foreground" />
					<h1 className="text-4xl font-bold tracking-tight">404</h1>
					<p className="text-xl font-semibold">Page Not Found</p>
					<p className="text-muted-foreground">
						Oops! The page you're looking for doesn't exist or has been moved.
					</p>
				</CardContent>
				<CardFooter className="flex items-center justify-center p-4">
					<Button asChild className="mt-4">
						<Link href="/" className="flex items-center space-x-2">
							<Home className="w-4 h-4" />
							<span>Return to Home</span>
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
