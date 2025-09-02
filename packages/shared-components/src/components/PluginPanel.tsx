import React, { ReactNode, useState, ReactElement } from 'react';
import { 
  Search, 
  Settings, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  ChevronRight,
  BarChart3,
  Filter,
  X,
  RefreshCw,
} from 'lucide-react';
import { COMPONENT_STYLES, COLORS, mergeStyles, createSidebarResizer } from '../styles/plugin-styles';

// Tab configuration interface
export interface PluginTab {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: {
    count: number;
    variant?: 'default' | 'critical' | 'serious' | 'moderate' | 'minor';
  };
  content: ReactNode;
}

// Action button interface
export interface PluginAction {
  id: string;
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  disabled?: boolean;
  tooltip?: string;
}

// Metric display interface
export interface PluginMetric {
  label: string;
  value: string | number;
  color?: string;
  format?: 'number' | 'percentage' | 'bytes' | 'duration' | 'rate';
}

// Filter section interface
export interface FilterSection {
  title: string;
  icon?: React.ElementType;
  items: Array<{
    id: string;
    label: string;
    count?: number;
    isActive?: boolean;
    onClick: () => void;
  }>;
}

// Main plugin panel props
export interface PluginPanelProps {
  // Required props
  title: string;
  
  // Content organization
  tabs?: PluginTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  children?: ReactNode;
  
  // Header controls
  actions?: PluginAction[];
  showSettings?: boolean;
  onSettingsClick?: () => void;
  
  // Search functionality
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  
  // Sidebar filters
  filterSections?: FilterSection[];
  showFilters?: boolean;
  onToggleFilters?: () => void;
  sidebarWidth?: number;
  onSidebarWidthChange?: (width: number) => void;
  
  // Metrics display
  metrics?: PluginMetric[];
  showMetrics?: boolean;
  onToggleMetrics?: () => void;
  metricsChart?: ReactNode;
  
  // Status and state
  status?: {
    isActive: boolean;
    label: string;
    color?: string;
  };
  
  // Layout options
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  
  // Misc
  icon?: React.ElementType;
  subtitle?: string;
  refreshAction?: () => void;
  clearAction?: () => void;
  exportActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

/**
 * Standard plugin panel wrapper component that all plugins can use
 * Provides consistent header, tab navigation, sidebar, metrics, and layout
 */
export function PluginPanel({
  title,
  tabs = [],
  activeTabId,
  onTabChange,
  children,
  actions = [],
  showSettings = false,
  onSettingsClick,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  filterSections = [],
  showFilters = false,
  onToggleFilters,
  sidebarWidth = 250,
  onSidebarWidthChange,
  metrics = [],
  showMetrics = false,
  onToggleMetrics,
  metricsChart,
  status,
  className,
  headerClassName,
  contentClassName,
  icon: Icon,
  subtitle,
  refreshAction,
  clearAction,
  exportActions = [],
}: PluginPanelProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Determine what content to show - tabs or children
  const contentToRender = tabs.length > 0 
    ? tabs.find(tab => tab.id === activeTabId)?.content || tabs[0]?.content
    : children;

  const handleSidebarResize = onSidebarWidthChange 
    ? createSidebarResizer(sidebarWidth, onSidebarWidthChange)
    : undefined;

  return (
    <div 
      style={mergeStyles(
        COMPONENT_STYLES.container.base,
        isMaximized ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 } : {},
        className ? {} : {}
      )}
      className={className}
    >
      {/* Header */}
      <div 
        style={mergeStyles(COMPONENT_STYLES.header.base, {})}
        className={headerClassName}
      >
        {/* Title section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: COMPONENT_STYLES.header.base.gap }}>
          {Icon && <Icon style={{ width: '20px', height: '20px', color: COLORS.text.accent }} />}
          <div>
            <h3 style={COMPONENT_STYLES.header.title}>
              {title}
            </h3>
            {subtitle && (
              <p style={COMPONENT_STYLES.header.subtitle}>
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Status indicator */}
          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
              <div
                style={mergeStyles(
                  COMPONENT_STYLES.status.indicator,
                  status.isActive 
                    ? COMPONENT_STYLES.status.active 
                    : COMPONENT_STYLES.status.inactive,
                  status.color ? { backgroundColor: status.color } : {}
                )}
              />
              <span style={{ fontSize: '10px', color: COLORS.text.secondary }}>
                {status.label}
              </span>
            </div>
          )}
        </div>

        {/* Controls section */}
        <div style={COMPONENT_STYLES.header.controls}>
          {/* Search input */}
          {showSearch && onSearchChange && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search 
                style={{ 
                  position: 'absolute', 
                  left: '8px', 
                  width: '14px', 
                  height: '14px', 
                  color: COLORS.text.secondary 
                }} 
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                style={mergeStyles(
                  COMPONENT_STYLES.input.base,
                  COMPONENT_STYLES.input.search,
                  { paddingLeft: '32px' }
                )}
              />
            </div>
          )}

          {/* Filters toggle */}
          {filterSections.length > 0 && onToggleFilters && (
            <button
              onClick={onToggleFilters}
              style={mergeStyles(
                COMPONENT_STYLES.button.base,
                COMPONENT_STYLES.button.small,
                showFilters ? COMPONENT_STYLES.button.active : {}
              )}
              title="Toggle filters"
            >
              {showFilters ? <ChevronDown style={{ width: '12px', height: '12px' }} /> : <ChevronRight style={{ width: '12px', height: '12px' }} />}
              <Filter style={{ width: '12px', height: '12px' }} />
              Filters
            </button>
          )}

          {/* Metrics toggle */}
          {(metrics.length > 0 || metricsChart) && onToggleMetrics && (
            <button
              onClick={onToggleMetrics}
              style={mergeStyles(
                COMPONENT_STYLES.button.base,
                COMPONENT_STYLES.button.small,
                showMetrics ? COMPONENT_STYLES.button.active : {}
              )}
              title="Toggle metrics"
            >
              <BarChart3 style={{ width: '12px', height: '12px' }} />
              Metrics
            </button>
          )}

          {/* Action buttons */}
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                style={mergeStyles(
                  COMPONENT_STYLES.button.base,
                  COMPONENT_STYLES.button.small,
                  action.variant === 'primary' ? COMPONENT_STYLES.button.primary :
                  action.variant === 'success' ? COMPONENT_STYLES.button.success :
                  action.variant === 'warning' ? COMPONENT_STYLES.button.warning :
                  action.variant === 'danger' ? COMPONENT_STYLES.button.danger : {},
                  action.disabled ? COMPONENT_STYLES.button.disabled : {}
                )}
                title={action.tooltip || action.label}
              >
                {ActionIcon && <ActionIcon style={{ width: '12px', height: '12px' }} />}
                {action.label}
              </button>
            );
          })}

          {/* Refresh button */}
          {refreshAction && (
            <button
              onClick={refreshAction}
              style={mergeStyles(COMPONENT_STYLES.button.base, COMPONENT_STYLES.button.small)}
              title="Refresh"
            >
              <RefreshCw style={{ width: '12px', height: '12px' }} />
            </button>
          )}

          {/* Clear button */}
          {clearAction && (
            <button
              onClick={clearAction}
              style={mergeStyles(COMPONENT_STYLES.button.base, COMPONENT_STYLES.button.small)}
              title="Clear"
            >
              <X style={{ width: '12px', height: '12px' }} />
              Clear
            </button>
          )}

          {/* Export buttons */}
          {exportActions.map((exportAction, index) => (
            <button
              key={index}
              onClick={exportAction.onClick}
              style={mergeStyles(COMPONENT_STYLES.button.base, COMPONENT_STYLES.button.small)}
              title={`Export as ${exportAction.label}`}
            >
              {exportAction.label}
            </button>
          ))}

          {/* Settings button */}
          {showSettings && onSettingsClick && (
            <button
              onClick={onSettingsClick}
              style={mergeStyles(COMPONENT_STYLES.button.base, COMPONENT_STYLES.button.icon)}
              title="Settings"
            >
              <Settings style={{ width: '16px', height: '16px' }} />
            </button>
          )}

          {/* Maximize button */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={mergeStyles(COMPONENT_STYLES.button.base, COMPONENT_STYLES.button.icon)}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized 
              ? <Minimize2 style={{ width: '16px', height: '16px' }} />
              : <Maximize2 style={{ width: '16px', height: '16px' }} />
            }
          </button>
        </div>
      </div>

      {/* Metrics Panel */}
      {showMetrics && (metrics.length > 0 || metricsChart) && (
        <div style={COMPONENT_STYLES.metrics.container}>
          {/* Metrics items */}
          {metrics.map((metric, index) => (
            <div key={index} style={COMPONENT_STYLES.metrics.item}>
              <span style={COMPONENT_STYLES.metrics.label}>{metric.label}:</span>
              <span style={mergeStyles(
                COMPONENT_STYLES.metrics.value,
                metric.color ? { color: metric.color } : {}
              )}>
                {formatMetricValue(metric.value, metric.format)}
              </span>
            </div>
          ))}
          
          {/* Custom chart */}
          {metricsChart && (
            <div style={COMPONENT_STYLES.metrics.chart.container}>
              {metricsChart}
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      {tabs.length > 0 && (
        <div style={COMPONENT_STYLES.tabs.container}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = tab.id === activeTabId || (activeTabId === undefined && tab.id === tabs[0].id);
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                style={mergeStyles(
                  COMPONENT_STYLES.tabs.tab.base,
                  isActive ? COMPONENT_STYLES.tabs.tab.active : {}
                )}
              >
                {TabIcon && <TabIcon style={{ width: '16px', height: '16px' }} />}
                {tab.label}
                {tab.badge && (
                  <span style={mergeStyles(
                    COMPONENT_STYLES.tabs.badge.base,
                    tab.badge.variant === 'critical' ? COMPONENT_STYLES.tabs.badge.critical :
                    tab.badge.variant === 'serious' ? COMPONENT_STYLES.tabs.badge.serious : {}
                  )}>
                    {tab.badge.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      <div style={COMPONENT_STYLES.content.split}>
        {/* Filters Sidebar */}
        {showFilters && filterSections.length > 0 && (
          <>
            <div style={mergeStyles(COMPONENT_STYLES.sidebar.base, { width: `${sidebarWidth}px` })}>
              {filterSections.map((section) => {
                const SectionIcon = section.icon;
                return (
                  <div key={section.title} style={COMPONENT_STYLES.sidebar.section}>
                    <h4 style={COMPONENT_STYLES.sidebar.sectionTitle}>
                      {SectionIcon && <SectionIcon style={{ width: '14px', height: '14px', marginRight: '4px' }} />}
                      {section.title}
                    </h4>
                    <div>
                      {section.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={item.onClick}
                          style={mergeStyles(
                            COMPONENT_STYLES.sidebar.item.base,
                            item.isActive ? COMPONENT_STYLES.sidebar.item.active : {}
                          )}
                        >
                          <span style={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: `${sidebarWidth - 60}px`,
                          }}>
                            {item.label}
                          </span>
                          {item.count !== undefined && (
                            <span style={{ color: COLORS.text.secondary }}>
                              {item.count}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resizer */}
            {handleSidebarResize && (
              <div style={COMPONENT_STYLES.sidebar.resizer} {...handleSidebarResize}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '1px',
                  height: '20px',
                  background: COLORS.text.muted,
                }} />
              </div>
            )}
          </>
        )}

        {/* Content Area */}
        <div 
          style={mergeStyles(COMPONENT_STYLES.content.base, {})}
          className={contentClassName}
        >
          {contentToRender}
        </div>
      </div>
    </div>
  );
}

// Helper function to format metric values
function formatMetricValue(value: string | number, format?: string): string {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'bytes':
      return formatBytes(value);
    case 'duration':
      return formatDuration(value);
    case 'rate':
      return `${value}/s`;
    case 'number':
    default:
      return typeof value === 'number' ? value.toLocaleString() : String(value);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export default PluginPanel;