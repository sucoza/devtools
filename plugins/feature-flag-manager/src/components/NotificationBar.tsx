import React from 'react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface NotificationBarProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({
  notifications,
  onRemove
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-bar">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification ${notification.type}`}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠'}
              {notification.type === 'info' && 'ℹ'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button
            className="notification-close"
            onClick={() => onRemove(notification.id)}
          >
            ×
          </button>
        </div>
      ))}

      <style>{`
        .notification-bar {
          position: relative;
          z-index: 1000;
        }
        
        .notification {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          font-size: 14px;
          animation: slideIn 0.3s ease-out;
        }
        
        .notification.success {
          background-color: var(--dt-status-success-bg);
          color: var(--dt-status-success);
          border-left: 4px solid #10b981;
        }
        
        .notification.error {
          background-color: var(--dt-status-error-bg);
          color: var(--dt-status-error);
          border-left: 4px solid #ef4444;
        }
        
        .notification.warning {
          background-color: var(--dt-status-warning-bg);
          color: var(--dt-status-warning);
          border-left: 4px solid #f59e0b;
        }
        
        .notification.info {
          background-color: var(--dt-info-bg);
          color: var(--dt-info-text);
          border-left: 4px solid #3b82f6;
        }
        
        .notification-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .notification-icon {
          font-weight: bold;
        }
        
        .notification-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: currentColor;
          opacity: 0.6;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .notification-close:hover {
          opacity: 1;
        }
        
        @keyframes slideIn {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

      `}</style>
    </div>
  );
};