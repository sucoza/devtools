import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

export interface ToastContainerProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  maxToasts?: number;
  duration?: number;
  closable?: boolean;
  pauseOnHover?: boolean;
  stackSpacing?: number;
  offset?: { x?: number; y?: number };
  className?: string;
  style?: React.CSSProperties;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function ToastContainer({
  position = 'top-right',
  maxToasts = 5,
  duration = 5000,
  closable = true,
  pauseOnHover = true,
  stackSpacing = 8,
  offset = { x: 20, y: 20 },
  className,
  style,
}: ToastContainerProps) {
  const { toasts, removeToast } = useToast();
  const visibleToasts = toasts.slice(-maxToasts);
  
  // Get position styles
  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none',
    };
    
    switch (position) {
      case 'top-left':
        return { ...base, top: offset.y, left: offset.x };
      case 'top-center':
        return { ...base, top: offset.y, left: '50%', transform: 'translateX(-50%)' };
      case 'top-right':
        return { ...base, top: offset.y, right: offset.x };
      case 'bottom-left':
        return { ...base, bottom: offset.y, left: offset.x };
      case 'bottom-center':
        return { ...base, bottom: offset.y, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right':
        return { ...base, bottom: offset.y, right: offset.x };
      default:
        return base;
    }
  };
  
  const isBottomPosition = position.startsWith('bottom');
  
  return (
    <div
      className={className}
      style={{
        ...getPositionStyles(),
        display: 'flex',
        flexDirection: isBottomPosition ? 'column-reverse' : 'column',
        gap: stackSpacing,
        ...style,
      }}
    >
      {visibleToasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          duration={toast.duration || duration}
          closable={toast.closable !== undefined ? toast.closable : closable}
          pauseOnHover={pauseOnHover}
          onRemove={() => {
            removeToast(toast.id);
            toast.onClose?.();
          }}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  duration: number;
  closable: boolean;
  pauseOnHover: boolean;
  onRemove: () => void;
}

function ToastItem({
  toast,
  duration,
  closable,
  pauseOnHover,
  onRemove,
}: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (duration <= 0 || isPaused || toast.type === 'loading') return undefined;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          handleRemove();
          return 0;
        }
        return prev - (100 / (duration / 100));
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [duration, isPaused, toast.type]);
  
  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(onRemove, 200);
  };
  
  // Get icon based on type
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} color={COLORS.status.success} />;
      case 'error':
        return <AlertCircle size={20} color={COLORS.status.error} />;
      case 'warning':
        return <AlertTriangle size={20} color={COLORS.status.warning} />;
      case 'info':
        return <Info size={20} color={COLORS.status.info} />;
      case 'loading':
        return <Loader size={20} color={COLORS.text.accent} className="animate-spin" />;
      default:
        return null;
    }
  };
  
  // Get type colors
  const getTypeColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: COLORS.status.success,
          border: COLORS.status.success,
        };
      case 'error':
        return {
          bg: COLORS.status.error,
          border: COLORS.status.error,
        };
      case 'warning':
        return {
          bg: COLORS.status.warning,
          border: COLORS.status.warning,
        };
      case 'info':
        return {
          bg: COLORS.status.info,
          border: COLORS.status.info,
        };
      case 'loading':
        return {
          bg: COLORS.text.accent,
          border: COLORS.text.accent,
        };
      default:
        return {
          bg: COLORS.border.primary,
          border: COLORS.border.primary,
        };
    }
  };
  
  const typeColors = getTypeColors();
  
  return (
    <div
      style={{
        pointerEvents: 'auto',
        minWidth: '300px',
        maxWidth: '400px',
        backgroundColor: COLORS.background.elevated,
        border: `1px solid ${COLORS.border.primary}`,
        borderRadius: RADIUS.md,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
        transition: 'all 0.2s ease',
        animation: 'toast-slide-in 0.2s ease',
      }}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Progress bar */}
      {duration > 0 && toast.type !== 'loading' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: `${typeColors.bg}20`,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: typeColors.bg,
              transition: isPaused ? 'none' : 'width 0.1s linear',
            }}
          />
        </div>
      )}
      
      <div style={{
        padding: SPACING.md,
        display: 'flex',
        gap: SPACING.md,
      }}>
        {/* Icon */}
        {getIcon() && (
          <div style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-start',
            paddingTop: '2px',
          }}>
            {getIcon()}
          </div>
        )}
        
        {/* Content */}
        <div style={{ flex: 1 }}>
          {toast.title && (
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.primary,
              marginBottom: toast.description ? SPACING.xs : 0,
            }}>
              {toast.title}
            </div>
          )}
          
          {toast.description && (
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.secondary,
              lineHeight: 1.4,
            }}>
              {toast.description}
            </div>
          )}
          
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                handleRemove();
              }}
              style={{
                marginTop: SPACING.sm,
                padding: `${SPACING.xs} ${SPACING.sm}`,
                backgroundColor: 'transparent',
                border: `1px solid ${COLORS.border.primary}`,
                borderRadius: RADIUS.sm,
                fontSize: TYPOGRAPHY.fontSize.xs,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.accent,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.background.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        {/* Close button */}
        {closable && toast.type !== 'loading' && (
          <button
            onClick={handleRemove}
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              color: COLORS.text.muted,
              cursor: 'pointer',
              padding: SPACING.xs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: RADIUS.sm,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.background.hover;
              e.currentTarget.style.color = COLORS.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = COLORS.text.muted;
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {/* Animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toast-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      ` }} />
    </div>
  );
}

// Convenience hook for common toast patterns
export function useToastActions() {
  const { addToast, removeToast, clearToasts } = useToast();
  
  return {
    success: (title: React.ReactNode, description?: React.ReactNode, options?: Partial<Toast>) => 
      addToast({ ...options, title, description, type: 'success' }),
    
    error: (title: React.ReactNode, description?: React.ReactNode, options?: Partial<Toast>) => 
      addToast({ ...options, title, description, type: 'error' }),
    
    warning: (title: React.ReactNode, description?: React.ReactNode, options?: Partial<Toast>) => 
      addToast({ ...options, title, description, type: 'warning' }),
    
    info: (title: React.ReactNode, description?: React.ReactNode, options?: Partial<Toast>) => 
      addToast({ ...options, title, description, type: 'info' }),
    
    loading: (title: React.ReactNode, description?: React.ReactNode) => {
      return addToast({ title, description, type: 'loading', duration: 0 });
    },
    
    promise: async <T,>(
      promise: Promise<T>,
      messages: {
        loading: React.ReactNode;
        success: React.ReactNode | ((data: T) => React.ReactNode);
        error: React.ReactNode | ((error: any) => React.ReactNode);
      }
    ) => {
      const id = addToast({ title: messages.loading, type: 'loading', duration: 0 });
      
      try {
        const result = await promise;
        removeToast(id);
        const successMessage = typeof messages.success === 'function' 
          ? messages.success(result) 
          : messages.success;
        addToast({ title: successMessage, type: 'success' });
        return result;
      } catch (error) {
        removeToast(id);
        const errorMessage = typeof messages.error === 'function' 
          ? messages.error(error) 
          : messages.error;
        addToast({ title: errorMessage, type: 'error' });
        throw error;
      }
    },
    
    remove: removeToast,
    clear: clearToasts,
  };
}