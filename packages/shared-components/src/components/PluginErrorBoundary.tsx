import React, { Component, ErrorInfo, ReactNode } from 'react';
import { COLORS, TYPOGRAPHY } from '../styles/plugin-styles';

interface Props {
  children: ReactNode;
  pluginName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component for DevTools plugins
 * Catches errors in plugin components and displays a fallback UI
 */
export class PluginErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PluginErrorBoundary] Error in ${this.props.pluginName || 'plugin'}:`, error, errorInfo);
    
    // Store error details
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const { pluginName = 'Plugin' } = this.props;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            padding: '24px',
            backgroundColor: COLORS.background.primary,
            color: COLORS.text.primary,
            fontFamily: TYPOGRAPHY.fontFamily.mono,
            fontSize: TYPOGRAPHY.fontSize.sm,
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              padding: '20px',
              backgroundColor: COLORS.background.secondary,
              border: `1px solid ${COLORS.border.primary}`,
              borderRadius: '4px',
            }}
          >
            {/* Error Icon and Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                color: COLORS.status.error,
              }}
            >
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <h3
                style={{
                  margin: 0,
                  fontSize: TYPOGRAPHY.fontSize.lg,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                }}
              >
                {pluginName} Error
              </h3>
            </div>

            {/* Error Message */}
            <div
              style={{
                padding: '12px',
                backgroundColor: COLORS.background.primary,
                border: `1px solid ${COLORS.border.secondary}`,
                borderRadius: '4px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  color: COLORS.status.error,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  marginBottom: '8px',
                }}
              >
                {error?.name || 'Error'}
              </div>
              <div
                style={{
                  color: COLORS.text.secondary,
                  fontSize: TYPOGRAPHY.fontSize.xs,
                  fontFamily: TYPOGRAPHY.fontFamily.mono,
                  wordBreak: 'break-word',
                }}
              >
                {error?.message || 'An unexpected error occurred'}
              </div>
            </div>

            {/* Stack Trace (collapsible) */}
            {errorInfo && (
              <details
                style={{
                  marginBottom: '16px',
                  cursor: 'pointer',
                }}
              >
                <summary
                  style={{
                    color: COLORS.text.secondary,
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    padding: '8px',
                    backgroundColor: COLORS.background.primary,
                    border: `1px solid ${COLORS.border.secondary}`,
                    borderRadius: '4px',
                    userSelect: 'none',
                  }}
                >
                  Show Stack Trace
                </summary>
                <pre
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: COLORS.background.primary,
                    border: `1px solid ${COLORS.border.secondary}`,
                    borderRadius: '4px',
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    color: COLORS.text.secondary,
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontFamily: TYPOGRAPHY.fontFamily.mono,
                  }}
                >
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={this.handleReset}
                style={{
                  padding: '6px 16px',
                  backgroundColor: COLORS.background.tertiary,
                  color: COLORS.text.primary,
                  border: `1px solid ${COLORS.border.primary}`,
                  borderRadius: '4px',
                  fontSize: TYPOGRAPHY.fontSize.xs,
                  fontFamily: TYPOGRAPHY.fontFamily.mono,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.background.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.background.tertiary;
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'transparent',
                  color: COLORS.text.secondary,
                  border: `1px solid ${COLORS.border.secondary}`,
                  borderRadius: '4px',
                  fontSize: TYPOGRAPHY.fontSize.xs,
                  fontFamily: TYPOGRAPHY.fontFamily.mono,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border.primary;
                  e.currentTarget.style.color = COLORS.text.primary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border.secondary;
                  e.currentTarget.style.color = COLORS.text.secondary;
                }}
              >
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: `${COLORS.status.info}15`,
                border: `1px solid ${COLORS.status.info}40`,
                borderRadius: '4px',
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.text.secondary,
              }}
            >
              <strong>Need help?</strong> Check the browser console for more details or report this issue to the plugin maintainers.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to wrap a component with error boundary
 */
export function withPluginErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  pluginName?: string
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <PluginErrorBoundary pluginName={pluginName}>
      <Component {...props} />
    </PluginErrorBoundary>
  );
  
  WrappedComponent.displayName = `withPluginErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}