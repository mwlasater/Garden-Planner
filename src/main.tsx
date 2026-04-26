import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { STORAGE_KEY } from "./store";
import { isTauri, tauriFileStorage } from "./lib/storage";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center">
          <div className="text-lg font-semibold text-stone-800">Something went wrong</div>
          <div className="text-sm text-stone-500 max-w-md">
            The app encountered an unexpected error. Resetting your garden data will restore it to a working state.
          </div>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700"
            onClick={async () => {
              // On desktop, also delete garden.json — otherwise the next
              // load would re-read the corrupted file and crash again.
              if (isTauri()) await tauriFileStorage.removeItem(STORAGE_KEY);
              localStorage.removeItem(STORAGE_KEY);
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
