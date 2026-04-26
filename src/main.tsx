import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center">
          <div className="text-lg font-semibold text-stone-800">Something went wrong</div>
          <div className="text-sm text-stone-500 max-w-md">
            {(this.state.error as Error).message}
          </div>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700"
            onClick={() => {
              localStorage.removeItem("garden-planner-state-v1");
              location.reload();
            }}
          >
            Reset garden &amp; reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
