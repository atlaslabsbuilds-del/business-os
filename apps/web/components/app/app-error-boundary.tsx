"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@repo/ui/button";

type Props = { children: ReactNode; fallbackTitle?: string };
type State = { hasError: boolean; message: string };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Unexpected error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        role="alert"
        className="bos-glass mx-auto max-w-lg rounded-[24px] border border-border p-8 text-center"
      >
        <p className="text-xs uppercase tracking-[0.16em] text-primary">
          {this.props.fallbackTitle ?? "Something went wrong"}
        </p>
        <h2 className="mt-2 text-xl font-semibold">We hit a snag</h2>
        <p className="mt-2 text-sm text-secondary">{this.state.message}</p>
        <Button
          className="mt-5"
          onClick={() => this.setState({ hasError: false, message: "" })}
        >
          Try again
        </Button>
      </div>
    );
  }
}
