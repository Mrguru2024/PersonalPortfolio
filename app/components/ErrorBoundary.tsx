"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service in production
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      // You can add error reporting here (e.g., Sentry, LogRocket, etc.)
      try {
        // Example: Send to error tracking service
        // errorTrackingService.captureException(error, { extra: errorInfo });
      } catch (reportingError) {
        console.error("Error reporting failed:", reportingError);
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We encountered an unexpected error. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="text-sm font-mono text-red-800 dark:text-red-200 break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-40 text-red-700 dark:text-red-300">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={this.handleReset} size="lg" className="flex-1 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">Try Again</span>
                  </span>
                </Button>
                <Button variant="outline" asChild size="lg" className="flex-1 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                  <Link href="/" className="flex items-center justify-center gap-2">
                    <Home className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">Go Home</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
