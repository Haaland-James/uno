"use client";

import React from "react";

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		console.error("ErrorBoundary caught:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
					<div className="mb-4">
						<div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
							<span className="text-2xl">⚠️</span>
						</div>
					</div>
					<h3 className="text-heading-3 text-content-primary mb-2">
						Something went wrong
					</h3>
					<p className="text-body text-content-secondary max-w-sm mb-6">
						We encountered an unexpected error. Please try again.
					</p>
					<button
						onClick={() => this.setState({ hasError: false, error: undefined })}
						className="btn-primary px-6 py-2.5"
					>
						Try Again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
