"use client";
import { AlertTriangle } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?(): void;
  compact?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Component error boundary caught error", error, info);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.compact) {
        return (
          <div className="text-xs text-red-500 flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>{this.props.fallbackTitle || "Error"}</span>
            <Button variant="ghost" size="sm" onClick={this.reset} className="h-5 px-1">
              Retry
            </Button>
          </div>
        );
      }
      return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{this.props.fallbackTitle || "Something went wrong"}</span>
            </div>
            <pre className="whitespace-pre-wrap text-xs text-red-700 dark:text-red-300 max-h-40 overflow-auto">
              {error.message}
            </pre>
            <Button variant="outline" size="sm" onClick={this.reset}>
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
