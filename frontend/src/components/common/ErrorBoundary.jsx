// frontend/src/components/common/ErrorBoundary.jsx

import { Component } from "react";

const isChunkError = (error) => {
  const msg = error?.message || String(error || "");
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    msg.includes("ChunkLoadError") ||
    msg.includes('MIME type of "text/html"') ||
    msg.includes("Expected a JavaScript-or-Wasm module script")
  );
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, autoRecovering: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", {
      message: error?.message,
      stack: import.meta.env.DEV ? error?.stack : undefined,
      componentStack: import.meta.env.DEV
        ? errorInfo?.componentStack
        : undefined,
    });

    // ✅ Auto-recovery for stale chunk errors. Trigger a cache-busting
    // reload so the browser fetches the current index.html (with the
    // current chunk hashes) instead of a stale cached one.
    if (isChunkError(error)) {
      const key = "spexxo_chunk_reload_attempted";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, String(Date.now()));
        this.setState({ autoRecovering: true });
        try {
          window.__SPEXXO_RECOVER_STALE_CHUNK__?.(error.message);
        } catch {}
        // Fallback in case the global hook wasn't installed:
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("_v", String(Date.now()));
          window.location.replace(url.toString());
        } catch {
          window.location.reload();
        }
      }
    }
  }

  handleReload = () => {
    // Force a fresh load with cache-busting.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("_v", String(Date.now()));
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.state.autoRecovering) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center p-8 max-w-md">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-text mb-2">
                Updating to the latest version…
              </h1>
              <p className="text-text-light text-sm">
                Fetching the newest assets. This takes a moment.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-3xl font-bold text-text mb-2">
              Something went wrong
            </h1>
            <p className="text-text-light mb-6 text-sm">
              We hit an unexpected error. You can try refreshing the page or
              going back to the homepage.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={this.handleReload}
                className="btn-primary text-sm"
              >
                Refresh Page
              </button>
              <button onClick={this.handleHome} className="btn-outline text-sm">
                Go to Homepage
              </button>
            </div>
            {import.meta.env.DEV && this.state.error?.message && (
              <p className="text-xs text-red-500 mt-6 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
