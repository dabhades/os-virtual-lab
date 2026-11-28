import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

const CHUNK_RELOAD_KEY = 'oslab-chunk-reload';

function isChunkLoadError(message: string): boolean {
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk')
  );
}

export class LabErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('OS Lab ErrorBoundary caught:', error, info);
    if (
      typeof window !== 'undefined' &&
      isChunkLoadError(error.message || '') &&
      !sessionStorage.getItem(CHUNK_RELOAD_KEY)
    ) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = isChunkLoadError(this.state.message);
      return (
        <div className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-white p-8 text-center shadow-xs">
          <h2 className="text-lg font-semibold text-slate-900">
            {isChunkError ? 'App updated — reload required' : 'Something went wrong in this module'}
          </h2>
          <p className="mt-2 font-mono text-xs text-rose-700">
            {this.state.message}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(CHUNK_RELOAD_KEY);
                window.location.reload();
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Reload Page
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.href = '/';
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
