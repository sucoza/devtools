import React, { useState } from 'react';
import { 
  Component, 
  FileText, 
  TrendingUp, 
  Settings,
  ChevronRight,
  ChevronDown,
  Clock,
  Hash,
  Code
} from 'lucide-react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles } from '@sucoza/shared-components';
import { useDesignSystemInspector, useFilteredData, useComponentStats } from '../../hooks';

export function ComponentsTab() {
  const { state, actions } = useDesignSystemInspector();
  const filteredData = useFilteredData(state);
  const componentStats = useComponentStats(filteredData.components);
  const [selectedComponent, setSelectedComponent] = useState<string | undefined>(
    state.ui.selectedComponent
  );
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  const handleSelectComponent = (componentId: string | undefined) => {
    setSelectedComponent(componentId);
    actions.selectComponent(componentId);
  };

  const toggleComponentExpanded = (componentId: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedComponents(newExpanded);
  };

  const selectedComponentData = selectedComponent 
    ? filteredData.components.find(c => c.id === selectedComponent)
    : null;

  return (
    <div style={COMPONENT_STYLES.content.split}>
      {/* Component List */}
      <div style={mergeStyles(
        COMPONENT_STYLES.sidebar.base,
        {
          width: '320px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column'
        }
      )}>
        <div style={{
          padding: SPACING.xl,
          borderBottom: `1px solid ${COLORS.border.primary}`
        }}>
          <h3 style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.heading,
            margin: 0
          }}>
            Components ({filteredData.components.length})
          </h3>
          
          {/* Stats */}
          <div style={{
            marginTop: SPACING['2xl'],
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: SPACING['2xl']
          }}>
            <div style={mergeStyles(
              COMPONENT_STYLES.container.panel,
              {
                padding: SPACING['2xl']
              }
            )}>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.xl,
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.text.heading,
                margin: 0
              }}>
                {componentStats.totalUsage}
              </div>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: COLORS.text.secondary
              }}>Total Usage</div>
            </div>
            <div style={mergeStyles(
              COMPONENT_STYLES.container.panel,
              {
                padding: SPACING['2xl']
              }
            )}>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.xl,
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.text.heading,
                margin: 0
              }}>
                {Math.round(componentStats.averageUsage)}
              </div>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: COLORS.text.secondary
              }}>Avg Usage</div>
            </div>
          </div>
        </div>
        
        <div style={{
          overflowY: 'auto',
          flex: 1
        }}>
          {filteredData.components.length === 0 ? (
            <div style={mergeStyles(
              COMPONENT_STYLES.empty.container,
              {
                padding: SPACING['6xl'],
                textAlign: 'center',
                color: COLORS.text.muted
              }
            )}>
              <Component style={{
                width: '48px',
                height: '48px',
                margin: '0 auto',
                marginBottom: SPACING.xl,
                opacity: 0.5
              }} />
              <p style={{
                margin: 0,
                marginBottom: SPACING.sm
              }}>No components found</p>
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                margin: 0
              }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{
              padding: SPACING.lg
            }}>
              {filteredData.components.map((component) => (
                <ComponentListItem
                  key={component.id}
                  component={component}
                  isSelected={selectedComponent === component.id}
                  isExpanded={expandedComponents.has(component.id)}
                  onSelect={handleSelectComponent}
                  onToggleExpanded={toggleComponentExpanded}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Component Details */}
      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {selectedComponentData ? (
          <ComponentDetails component={selectedComponentData} />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: COLORS.text.muted
          }}>
            <div style={{
              textAlign: 'center'
            }}>
              <Component style={{
                width: '64px',
                height: '64px',
                margin: '0 auto',
                marginBottom: SPACING.xl,
                opacity: 0.5
              }} />
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.lg,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                margin: 0,
                marginBottom: SPACING.sm
              }}>Select a component</p>
              <p style={{
                margin: 0
              }}>Choose a component from the list to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentListItem({
  component,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpanded
}: {
  component: import('../../types').ComponentUsage;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggleExpanded: (id: string) => void;
}) {
  return (
    <div style={{
      marginBottom: SPACING.lg
    }}>
      <div
        style={mergeStyles(
          COMPONENT_STYLES.list.item.base,
          {
            padding: SPACING['2xl'],
            borderRadius: RADIUS.lg,
            cursor: 'pointer',
            border: `1px solid ${COLORS.border.primary}`,
            backgroundColor: isSelected ? COLORS.background.selected : COLORS.background.secondary,
            borderColor: isSelected ? COLORS.border.focus : COLORS.border.primary
          },
          isSelected ? {} : COMPONENT_STYLES.list.item.hover
        )}
        onClick={() => onSelect(component.id)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = COLORS.background.hover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = COLORS.background.secondary;
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0
          }}>
            <Component style={{
              width: '16px',
              height: '16px',
              marginRight: SPACING.lg,
              flexShrink: 0,
              color: isSelected ? COLORS.text.accent : COLORS.text.muted
            }} />
            <div style={{
              minWidth: 0,
              flex: 1
            }}>
              <div style={{
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {component.displayName}
              </div>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: COLORS.text.secondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {component.name}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg,
            marginLeft: SPACING.lg
          }}>
            <span style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              backgroundColor: COLORS.background.tertiary,
              color: COLORS.text.secondary,
              padding: `${SPACING.xs} ${SPACING.lg}`,
              borderRadius: RADIUS.md
            }}>
              {component.usageCount}x
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(component.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.text.muted,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.text.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.text.muted;
              }}
            >
              {isExpanded ? (
                <ChevronDown style={{ width: '16px', height: '16px' }} />
              ) : (
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              )}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div style={{
            marginTop: SPACING.lg,
            paddingTop: SPACING.lg,
            borderTop: `1px solid ${COLORS.border.secondary}`,
            fontSize: TYPOGRAPHY.fontSize.xs
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: COLORS.text.secondary,
              marginBottom: SPACING.sm
            }}>
              <FileText style={{ width: '12px', height: '12px', marginRight: SPACING.sm }} />
              {component.filePath}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: COLORS.text.secondary }}>
                {component.props.length} props
              </span>
              <span style={{ color: COLORS.text.secondary }}>
                {component.variants.length} variants
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentDetails({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  const [activeSection, setActiveSection] = useState<'overview' | 'props' | 'variants' | 'usage'>('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: Component },
    { id: 'props', label: 'Props', icon: Settings },
    { id: 'variants', label: 'Variants', icon: Code },
    { id: 'usage', label: 'Usage', icon: TrendingUp },
  ] as const;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        borderBottom: `1px solid ${COLORS.border.primary}`,
        backgroundColor: COLORS.background.secondary,
        padding: SPACING['5xl']
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.text.heading,
              margin: 0
            }}>
              {component.displayName}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: SPACING.lg,
              gap: SPACING.xl,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.secondary
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <FileText style={{ width: '16px', height: '16px', marginRight: SPACING.sm }} />
                {component.filePath}
              </span>
              <span style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <Hash style={{ width: '16px', height: '16px', marginRight: SPACING.sm }} />
                {component.usageCount} uses
              </span>
              <span style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <Clock style={{ width: '16px', height: '16px', marginRight: SPACING.sm }} />
                Last seen {formatRelativeTime(component.lastSeen)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Section Navigation */}
        <div style={{
          display: 'flex',
          gap: SPACING.sm,
          marginTop: SPACING.xl
        }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              style={mergeStyles(
                COMPONENT_STYLES.button.base,
                COMPONENT_STYLES.button.small,
                {
                  borderRadius: RADIUS.lg
                },
                activeSection === section.id
                  ? {
                      backgroundColor: 'rgba(0, 122, 204, 0.1)',
                      color: COLORS.text.accent,
                      borderColor: COLORS.border.focus
                    }
                  : {
                      color: COLORS.text.secondary
                    }
              )}
              onMouseEnter={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.color = COLORS.text.primary;
                  e.currentTarget.style.backgroundColor = COLORS.background.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.color = COLORS.text.secondary;
                  e.currentTarget.style.backgroundColor = COLORS.background.tertiary;
                }
              }}
            >
              <section.icon style={{ width: '16px', height: '16px', marginRight: SPACING.lg }} />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: SPACING['5xl']
      }}>
        {activeSection === 'overview' && (
          <ComponentOverview component={component} />
        )}
        {activeSection === 'props' && (
          <ComponentProps component={component} />
        )}
        {activeSection === 'variants' && (
          <ComponentVariants component={component} />
        )}
        {activeSection === 'usage' && (
          <ComponentUsage component={component} />
        )}
      </div>
    </div>
  );
}

function ComponentOverview({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING['5xl']
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: SPACING.xl
      }}>
        <div style={mergeStyles(
          COMPONENT_STYLES.container.panel,
          {
            padding: SPACING.xl
          }
        )}>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: COLORS.text.heading,
            margin: 0
          }}>
            {component.usageCount}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Times Used</div>
        </div>
        <div style={mergeStyles(
          COMPONENT_STYLES.container.panel,
          {
            padding: SPACING.xl
          }
        )}>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: COLORS.text.heading,
            margin: 0
          }}>
            {component.props.length}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Props</div>
        </div>
        <div style={mergeStyles(
          COMPONENT_STYLES.container.panel,
          {
            padding: SPACING.xl
          }
        )}>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: COLORS.text.heading,
            margin: 0
          }}>
            {component.variants.length}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Variants</div>
        </div>
      </div>

      <div>
        <h3 style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.heading,
          margin: `0 0 ${SPACING.xl} 0`
        }}>
          Component Information
        </h3>
        <dl style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: SPACING.xl
        }}>
          <div>
            <dt style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              margin: 0
            }}>Name</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary,
              margin: `${SPACING.sm} 0 0 0`
            }}>{component.name}</dd>
          </div>
          <div>
            <dt style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              margin: 0
            }}>Display Name</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary,
              margin: `${SPACING.sm} 0 0 0`
            }}>{component.displayName}</dd>
          </div>
          <div>
            <dt style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              margin: 0
            }}>File Path</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.primary,
              fontFamily: TYPOGRAPHY.fontFamily.mono,
              margin: `${SPACING.sm} 0 0 0`
            }}>
              {component.filePath}
            </dd>
          </div>
          <div>
            <dt style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              margin: 0
            }}>First Seen</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary,
              margin: `${SPACING.sm} 0 0 0`
            }}>
              {formatRelativeTime(component.firstSeen)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function ComponentProps({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Props Usage ({component.props.length})
      </h3>
      
      {component.props.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No props detected for this component.</p>
      ) : (
        <div className="space-y-4">
          {component.props.map((prop) => (
            <div key={prop.name} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {prop.name}
                  {prop.isRequired && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </h4>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{prop.type}</span>
                  <span>•</span>
                  <span>{prop.usageCount} uses</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Values:</h5>
                <div className="grid grid-cols-1 gap-2">
                  {prop.values.slice(0, 5).map((value, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <code className="text-sm text-gray-700 dark:text-gray-300">
                        {value.value}
                      </code>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{value.count}x</span>
                        <span>({value.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                  {prop.values.length > 5 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      +{prop.values.length - 5} more values
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentVariants({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Variants ({component.variants.length})
      </h3>
      
      {component.variants.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No variants detected for this component.</p>
      ) : (
        <div className="space-y-3">
          {component.variants.map((variant, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Variant {index + 1}
                </h4>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{variant.count} uses</span>
                  <span>•</span>
                  <span>{variant.percentage.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                  {JSON.stringify(variant.props, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentUsage({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Usage Analysis
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Timeline</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">First seen:</span>
              <span className="text-gray-900 dark:text-white">{formatRelativeTime(component.firstSeen)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Last seen:</span>
              <span className="text-gray-900 dark:text-white">{formatRelativeTime(component.lastSeen)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total usage:</span>
              <span className="text-gray-900 dark:text-white">{component.usageCount}x</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
          <div className="space-y-2 text-sm">
            {component.usageCount === 1 && (
              <div className="text-yellow-600 dark:text-yellow-400">
                • Component used only once - consider if it should be abstracted
              </div>
            )}
            {component.usageCount > 20 && (
              <div className="text-green-600 dark:text-green-400">
                • High usage component - good candidate for documentation
              </div>
            )}
            {component.props.length === 0 && (
              <div className="text-blue-600 dark:text-blue-400">
                • Consider adding props to make this component more flexible
              </div>
            )}
            {component.variants.length > 10 && (
              <div className="text-orange-600 dark:text-orange-400">
                • Many variants detected - consider standardizing usage patterns
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  return 'Just now';
}