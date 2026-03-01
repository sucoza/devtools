import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  
  // Content
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  
  // Behavior
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  preventClose?: boolean;
  
  // Display options
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  showCloseButton?: boolean;
  animate?: boolean;
  blur?: boolean;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  backdropClassName?: string;
  backdropStyle?: React.CSSProperties;
  
  // Callbacks
  onOpenChange?: (open: boolean) => void;
  onOpenComplete?: () => void;
  onCloseComplete?: () => void;
}

export interface DialogProps extends Omit<ModalProps, 'footer'> {
  // Actions
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  
  // State
  loading?: boolean;
  confirmDisabled?: boolean;
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
  
  // Additional content
  icon?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  preventClose = false,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  animate = true,
  blur = true,
  className,
  style,
  contentClassName,
  contentStyle,
  backdropClassName,
  backdropStyle,
  onOpenChange,
  onOpenComplete,
  onCloseComplete,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const closeCompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalId = useRef(`modal-${Math.random().toString(36).substring(2, 9)}`).current;

  // Cleanup close timer on unmount
  useEffect(() => {
    return () => {
      if (closeCompleteTimer.current !== null) {
        clearTimeout(closeCompleteTimer.current);
      }
    };
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    if (preventClose) return;

    onClose?.();
    onOpenChange?.(false);

    if (animate) {
      closeCompleteTimer.current = setTimeout(() => {
        closeCompleteTimer.current = null;
        onCloseComplete?.();
      }, 200);
    } else {
      onCloseComplete?.();
    }
  }, [preventClose, onClose, onOpenChange, animate, onCloseComplete]);
  
  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return undefined;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeOnEscape, handleClose]);
  
  // Focus management
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the modal
      const focusTimer = setTimeout(() => {
        modalRef.current?.focus();
      }, 100);

      // Call open complete
      let openCompleteTimer: ReturnType<typeof setTimeout> | undefined;
      if (animate) {
        openCompleteTimer = setTimeout(() => {
          onOpenComplete?.();
        }, 200);
      } else {
        onOpenComplete?.();
      }

      return () => {
        clearTimeout(focusTimer);
        if (openCompleteTimer !== undefined) {
          clearTimeout(openCompleteTimer);
        }
      };
    } else {
      // Restore focus
      previousActiveElement.current?.focus();
    }
    return undefined;
  }, [open, animate, onOpenComplete]);
  
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [open]);
  
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return { maxWidth: '320px', width: '90vw' };
      case 'sm':
        return { maxWidth: '480px', width: '90vw' };
      case 'lg':
        return { maxWidth: '800px', width: '90vw' };
      case 'xl':
        return { maxWidth: '1200px', width: '90vw' };
      case 'full':
        return { width: '100vw', height: '100vh', maxWidth: 'none' };
      case 'md':
      default:
        return { maxWidth: '640px', width: '90vw' };
    }
  };
  
  // Get position styles
  const getPositionStyles = () => {
    if (size === 'full') {
      return {
        inset: 0,
      };
    }
    
    switch (position) {
      case 'top':
        return {
          top: SPACING.xl,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          bottom: SPACING.xl,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();
  
  if (!open) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className={backdropClassName}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          ...(blur && {
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }),
          ...(animate && {
            animation: 'backdrop-fade-in 0.2s ease',
          }),
          ...backdropStyle,
        }}
        onClick={closeOnBackdropClick ? handleClose : undefined}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${modalId}-title` : undefined}
        aria-describedby={description ? `${modalId}-description` : undefined}
        tabIndex={-1}
        style={{
          position: 'fixed',
          ...positionStyles,
          ...sizeStyles,
          zIndex: 9999,
          outline: 'none',
          ...(animate && {
            animation: position === 'center' 
              ? 'modal-slide-up 0.2s ease'
              : 'modal-fade-in 0.2s ease',
          }),
          ...style,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={contentClassName}
          style={{
            backgroundColor: COLORS.background.elevated,
            borderRadius: size === 'full' ? 0 : RADIUS.lg,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: size === 'full' ? '100vh' : '90vh',
            height: size === 'full' ? '100%' : 'auto',
            ...contentStyle,
          }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div
              style={{
                padding: SPACING.lg,
                borderBottom: `1px solid ${COLORS.border.primary}`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1 }}>
                {title && (
                  <h2
                    id={`${modalId}-title`}
                    style={{
                      margin: 0,
                      fontSize: TYPOGRAPHY.fontSize.lg,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: COLORS.text.primary,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={`${modalId}-description`}
                    style={{
                      margin: 0,
                      marginTop: SPACING.xs,
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      color: COLORS.text.secondary,
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
              
              {showCloseButton && !preventClose && (
                <button
                  onClick={handleClose}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.text.muted,
                    cursor: 'pointer',
                    padding: SPACING.xs,
                    marginLeft: SPACING.md,
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
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div
            style={{
              flex: 1,
              padding: SPACING.lg,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div
              style={{
                padding: SPACING.lg,
                borderTop: `1px solid ${COLORS.border.primary}`,
                flexShrink: 0,
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes backdrop-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modal-fade-in {
          from {
            opacity: 0;
            transform: ${position === 'center' ? 'translate(-50%, -50%) scale(0.95)' : 'translateX(-50%) scale(0.95)'};
          }
          to {
            opacity: 1;
            transform: ${position === 'center' ? 'translate(-50%, -50%) scale(1)' : 'translateX(-50%) scale(1)'};
          }
        }

        @keyframes modal-slide-up {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}

export function Dialog({
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  confirmDisabled = false,
  confirmVariant = 'primary',
  icon,
  children,
  ...modalProps
}: DialogProps) {
  const handleConfirm = async () => {
    if (loading || confirmDisabled) return;
    
    try {
      await onConfirm?.();
      modalProps.onClose?.();
    } catch (error) {
      console.error('Dialog confirm error:', error);
    }
  };
  
  const handleCancel = () => {
    onCancel?.();
    modalProps.onClose?.();
  };
  
  // Get button colors based on variant
  const getButtonStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          backgroundColor: COLORS.status.error,
          color: COLORS.background.primary,
        };
      case 'warning':
        return {
          backgroundColor: COLORS.status.warning,
          color: COLORS.background.primary,
        };
      case 'success':
        return {
          backgroundColor: COLORS.status.success,
          color: COLORS.background.primary,
        };
      case 'primary':
      default:
        return {
          backgroundColor: COLORS.text.accent,
          color: COLORS.background.primary,
        };
    }
  };
  
  const buttonStyles = getButtonStyles();
  
  const footer = (
    <div style={{
      display: 'flex',
      gap: SPACING.md,
      justifyContent: 'flex-end',
    }}>
      <button
        onClick={handleCancel}
        disabled={loading}
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderRadius: RADIUS.md,
          border: `1px solid ${COLORS.border.primary}`,
          backgroundColor: 'transparent',
          color: COLORS.text.primary,
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = COLORS.background.hover;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {cancelText}
      </button>
      
      <button
        onClick={handleConfirm}
        disabled={loading || confirmDisabled}
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderRadius: RADIUS.md,
          border: 'none',
          ...buttonStyles,
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          cursor: loading || confirmDisabled ? 'not-allowed' : 'pointer',
          opacity: loading || confirmDisabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          minWidth: '80px',
        }}
        onMouseEnter={(e) => {
          if (!loading && !confirmDisabled) {
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && !confirmDisabled) {
            e.currentTarget.style.opacity = '1';
          }
        }}
      >
        {loading ? 'Loading...' : confirmText}
      </button>
    </div>
  );
  
  return (
    <Modal {...modalProps} footer={footer}>
      <div style={{
        display: 'flex',
        gap: SPACING.lg,
        alignItems: 'flex-start',
      }}>
        {icon && (
          <div style={{
            flexShrink: 0,
            color: COLORS.text.secondary,
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </Modal>
  );
}