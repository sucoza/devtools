import React from 'react';
import { clsx } from 'clsx';

export interface ConfigMenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
}

export interface ConfigMenuProps {
  items: ConfigMenuItem[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

export function ConfigMenu({ 
  items, 
  className, 
  size = 'md',
  variant = 'default' 
}: ConfigMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
    
    return undefined;
  }, [isOpen]);

  const handleItemClick = (item: ConfigMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: ConfigMenuItem) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleItemClick(item);
    }
  };

  const buttonSizeClasses = {
    sm: 'config-menu-button-sm',
    md: 'config-menu-button-md', 
    lg: 'config-menu-button-lg'
  };

  return (
    <div className={clsx('config-menu-container', className)}>
      <button
        ref={buttonRef}
        className={clsx(
          'config-menu-button',
          buttonSizeClasses[size],
          variant === 'compact' && 'config-menu-button-compact'
        )}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && isOpen) {
            e.preventDefault();
            const firstItem = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
            firstItem?.focus();
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Settings"
      >
        ⚙️
      </button>

      {isOpen && (
        <div 
          ref={menuRef} 
          className={clsx(
            'config-menu-dropdown',
            size === 'sm' && 'config-menu-dropdown-sm',
            size === 'lg' && 'config-menu-dropdown-lg'
          )}
          role="menu"
        >
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.separator && index > 0 && (
                <div className="config-menu-separator" role="separator" />
              )}
              <div
                className={clsx('config-menu-item', {
                  'disabled': item.disabled
                })}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => handleKeyDown(e, item)}
                role="menuitem"
                tabIndex={item.disabled ? -1 : 0}
                aria-disabled={item.disabled}
              >
                <div className="config-menu-item-content">
                  {item.icon && (
                    <span className="config-menu-item-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className="config-menu-item-label">{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className="config-menu-item-shortcut" aria-hidden="true">
                    {item.shortcut}
                  </span>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      <style>{`
        .config-menu-container {
          position: relative;
          display: inline-block;
        }

        .config-menu-button {
          border: none;
          background: transparent;
          color: var(--devtools-color, #333);
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.15s ease;
          position: relative;
        }

        .config-menu-button-sm {
          width: 24px;
          height: 24px;
          font-size: 12px;
        }

        .config-menu-button-md {
          width: 32px;
          height: 32px;
          font-size: 14px;
        }

        .config-menu-button-lg {
          width: 40px;
          height: 40px;
          font-size: 16px;
        }

        .config-menu-button-compact {
          padding: 2px;
          min-width: auto;
        }

        .config-menu-button:hover {
          background: var(--devtools-button-hover-bg, rgba(0, 0, 0, 0.05));
        }

        .config-menu-button:focus {
          outline: 2px solid var(--devtools-accent, #0066cc);
          outline-offset: 2px;
        }

        .config-menu-button[aria-expanded="true"] {
          background: var(--devtools-button-hover-bg, rgba(0, 0, 0, 0.05));
        }

        .config-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 200px;
          background: var(--devtools-bg, white);
          border: 1px solid var(--devtools-border, #ccc);
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 4px 0;
          z-index: 1000;
          font-size: 13px;
          margin-top: 2px;
        }

        .config-menu-dropdown-sm {
          font-size: 12px;
          min-width: 160px;
        }

        .config-menu-dropdown-lg {
          font-size: 14px;
          min-width: 240px;
        }

        .config-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          cursor: pointer;
          color: var(--devtools-color, #333);
          transition: background-color 0.15s ease;
          outline: none;
        }

        .config-menu-item:hover:not(.disabled) {
          background: var(--devtools-button-hover-bg, rgba(0, 0, 0, 0.05));
        }

        .config-menu-item:focus:not(.disabled) {
          background: var(--devtools-button-hover-bg, rgba(0, 0, 0, 0.05));
          box-shadow: inset 0 0 0 1px var(--devtools-accent, #0066cc);
        }

        .config-menu-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .config-menu-item-content {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .config-menu-item-icon {
          font-size: 14px;
          width: 16px;
          text-align: center;
          flex-shrink: 0;
        }

        .config-menu-item-label {
          white-space: nowrap;
          flex: 1;
        }

        .config-menu-item-shortcut {
          font-size: 11px;
          opacity: 0.6;
          font-family: ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          margin-left: 8px;
          flex-shrink: 0;
        }

        .config-menu-separator {
          height: 1px;
          background: var(--devtools-border, #ccc);
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}