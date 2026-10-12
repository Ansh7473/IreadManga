import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="empty-state" role="alert">
          <strong>Something went wrong.</strong>
          <p style={{ marginTop: "0.5rem" }}>{this.state.error.message}</p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: "1rem" }}
            onClick={() => {
              this.setState({ error: null });
              window.location.href = "/";
            }}
          >
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
