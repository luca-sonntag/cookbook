import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes (e.g. a transient Fast-Refresh/HMR mismatch where
 * a context consumer briefly sees an undefined provider) so the whole app does
 * not white-screen. On a recoverable HMR glitch a reload restores the tree.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center dark:bg-gray-950">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Ups, etwas ist schiefgelaufen.
          </h1>
          <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
