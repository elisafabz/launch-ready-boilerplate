import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // A stale chunk after a deploy is the most common production cause.
    const isChunkError = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(error.message);

    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-3 text-foreground">
            {isChunkError ? "New version available" : "This page could not be displayed"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isChunkError
              ? "The app was updated while you had it open. Reloading gets the current version."
              : "Something went wrong while loading this page. Please reload. If the problem persists, contact us with the time and the page you were on."}
          </p>
          {import.meta.env.DEV && (
            <pre className="mb-6 overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
              {error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-11 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Reload page
          </button>
        </div>
      </main>
    );
  }
}
