import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearStoreCache } from '@/shared/lib/store';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary that catches unhandled React errors.
 * When a crash occurs, it clears potentially corrupted caches
 * and offers a clean restart.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary] Caught error:', error, info.componentStack);
    // Clear corrupted caches that may have caused the crash
    clearStoreCache();
    try { localStorage.removeItem('lidtek-crm-auth'); } catch { /* noop */ }
  }

  handleReload = () => {
    // Force clean reload
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          color: '#e4e4e7',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1rem' }}>
            CRM
          </div>
          <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '320px' }}>
            Algo deu errado. O cache foi limpo automaticamente.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: '#27272a',
              color: '#e4e4e7',
              border: '1px solid #3f3f46',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
