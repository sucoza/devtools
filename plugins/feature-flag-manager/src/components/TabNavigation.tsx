import React from 'react';
import { PanelTab } from '../types';

interface TabNavigationProps {
  tabs: Array<{ id: PanelTab; label: string; count?: number }>;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className="count">{tab.count}</span>
          )}
        </button>
      ))}

      <style>{`
        .tab-navigation {
          display: flex;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          overflow-x: auto;
        }
        
        .tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: #6b7280;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        
        .tab:hover {
          color: #374151;
          background-color: #f3f4f6;
        }
        
        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background-color: white;
        }
        
        .count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background-color: #e5e7eb;
          color: #374151;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .tab.active .count {
          background-color: #dbeafe;
          color: #3b82f6;
        }
        
        .tab:hover .count {
          background-color: #d1d5db;
        }
        
        .tab.active:hover .count {
          background-color: #bfdbfe;
        }
        
        /* Dark theme */
        :global(.dark) .tab-navigation {
          background-color: #374151;
          border-bottom-color: #4b5563;
        }
        
        :global(.dark) .tab {
          color: #9ca3af;
        }
        
        :global(.dark) .tab:hover {
          color: #f3f4f6;
          background-color: #4b5563;
        }
        
        :global(.dark) .tab.active {
          color: #60a5fa;
          background-color: #1f2937;
        }
        
        :global(.dark) .count {
          background-color: #4b5563;
          color: #d1d5db;
        }
        
        :global(.dark) .tab.active .count {
          background-color: #1e40af;
          color: #dbeafe;
        }
      `}</style>
    </div>
  );
};