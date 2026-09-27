// frontend/src/components/common/ErrorBoundary.jsx

import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep diagnostics server-side-friendly. Never render stack to user.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", {
      message: error?.message,
      stack: import.meta.env.DEV ? error?.stack : undefined,
      componentStack: import.meta.env.DEV
        ? errorInfo?.componentStack
        : undefined,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
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
