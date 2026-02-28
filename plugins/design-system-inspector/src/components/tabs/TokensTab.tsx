import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Ruler, 
  Box, 
  Zap,
  Copy,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles } from '@sucoza/shared-components';
import { useDesignSystemInspector, useFilteredData, useTokenStats } from '../../hooks';

export function TokensTab() {
  const { state, actions } = useDesignSystemInspector();
  const filteredData = useFilteredData(state);
  const tokenStats = useTokenStats(filteredData.tokens);
  const [selectedToken, setSelectedToken] = useState<string | undefined>(
    state.ui.selectedToken
  );
  const [groupBy, setGroupBy] = useState<'type' | 'category'>('type');

  const handleSelectToken = (tokenId: string | undefined) => {
    setSelectedToken(tokenId);
    actions.selectToken(tokenId);
  };

  const selectedTokenData = selectedToken 
    ? filteredData.tokens.find(t => t.id === selectedToken)
    : null;

  const groupedTokens = filteredData.tokens.reduce((groups, token) => {
    const key = groupBy === 'type' ? token.type : token.category;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(token);
    return groups;
  }, {} as Record<string, typeof filteredData.tokens>);

  const typeIcons = {
    color: Palette,
    typography: Type,
    spacing: Ruler,
    size: Box,
    shadow: Zap,
    border: Box,
  };

  return (
    <div style={COMPONENT_STYLES.content.split}>
      {/* Token List */}
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: SPACING['2xl']
          }}>
            <h3 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.heading,
              margin: 0
            }}>
              Tokens ({filteredData.tokens.length})
            </h3>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'type' | 'category')}
              style={mergeStyles(
                COMPONENT_STYLES.input.base,
                {
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  padding: `${SPACING.sm} ${SPACING.lg}`,
                  minWidth: 'auto'
                }
              )}
            >
              <option value="type">Group by Type</option>
              <option value="category">Group by Category</option>
            </select>
          </div>
          
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: SPACING['2xl'],
            fontSize: TYPOGRAPHY.fontSize.sm
          }}>
            <div style={{
              backgroundColor: COLORS.background.primary,
              borderRadius: RADIUS.lg,
              padding: SPACING['2xl']
            }}>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.xl,
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.text.primary,
                margin: 0
              }}>
                {tokenStats.utilizationRate.toFixed(0)}%
              </div>
              <div style={{
                color: COLORS.text.secondary,
                fontSize: TYPOGRAPHY.fontSize.xs
              }}>Utilization</div>
            </div>
            <div style={{
              backgroundColor: COLORS.background.primary,
              borderRadius: RADIUS.lg,
              padding: SPACING['2xl']
            }}>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.xl,
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.text.primary,
                margin: 0
              }}>
                {tokenStats.validTokens}
              </div>
              <div style={{
                color: COLORS.text.secondary,
                fontSize: TYPOGRAPHY.fontSize.xs
              }}>Valid</div>
            </div>
          </div>
        </div>
        
        <div style={{
          overflowY: 'auto',
          flex: 1
        }}>
          {Object.keys(groupedTokens).length === 0 ? (
            <div style={{
              padding: SPACING['6xl'],
              textAlign: 'center',
              color: COLORS.text.muted
            }}>
              <Palette style={{
                width: '48px',
                height: '48px',
                margin: '0 auto',
                marginBottom: SPACING.xl,
                opacity: 0.5
              }} />
              <p style={{
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                margin: 0,
                marginBottom: SPACING.sm
              }}>No tokens found</p>
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                margin: 0
              }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{
              padding: SPACING.lg
            }}>
              {Object.entries(groupedTokens).map(([group, tokens]) => (
                <TokenGroup
                  key={group}
                  title={group}
                  tokens={tokens}
                  selectedToken={selectedToken}
                  onSelectToken={handleSelectToken}
                  typeIcons={typeIcons}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Token Details */}
      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {selectedTokenData ? (
          <TokenDetails token={selectedTokenData} />
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
              <Palette style={{
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
              }}>Select a token</p>
              <p style={{
                margin: 0
              }}>Choose a design token from the list to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TokenGroup({
  title,
  tokens,
  selectedToken,
  onSelectToken,
  typeIcons
}: {
  title: string;
  tokens: import('../../types').DesignToken[];
  selectedToken?: string;
  onSelectToken: (id: string) => void;
  typeIcons: Record<string, any>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{
      marginBottom: SPACING.xl
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: SPACING.lg,
          textAlign: 'left',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: RADIUS.lg,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.background.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          color: COLORS.text.primary,
          textTransform: 'capitalize'
        }}>
          {title} ({tokens.length})
        </span>
        <span style={{
          color: COLORS.text.muted
        }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
      
      {isExpanded && (
        <div style={{
          marginLeft: SPACING.xl,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm
        }}>
          {tokens.map((token) => (
            <TokenListItem
              key={token.id}
              token={token}
              isSelected={selectedToken === token.id}
              onSelect={onSelectToken}
              Icon={typeIcons[token.type] || Box}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TokenListItem({
  token,
  isSelected,
  onSelect,
  Icon
}: {
  token: import('../../types').DesignToken;
  isSelected: boolean;
  onSelect: (id: string) => void;
  Icon: any;
}) {
  const hasIssues = token.violations && token.violations.length > 0;

  return (
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
        }
      )}
      onClick={() => onSelect(token.id)}
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
          <Icon style={{
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
              {token.name}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.secondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {token.value}
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.lg,
          marginLeft: SPACING.lg
        }}>
          {hasIssues && (
            <AlertTriangle style={{
              width: '16px',
              height: '16px',
              color: COLORS.status.warning
            }} />
          )}
          {token.isValid && !hasIssues && (
            <CheckCircle style={{
              width: '16px',
              height: '16px',
              color: COLORS.status.success
            }} />
          )}
          <span style={{
            fontSize: TYPOGRAPHY.fontSize.xs,
            backgroundColor: COLORS.background.tertiary,
            color: COLORS.text.secondary,
            padding: `${SPACING.xs} ${SPACING.lg}`,
            borderRadius: RADIUS.md
          }}>
            {token.usageCount}x
          </span>
        </div>
      </div>
      
      {token.type === 'color' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: SPACING.lg
        }}>
          <div 
            style={{
              width: '16px',
              height: '16px',
              borderRadius: RADIUS.sm,
              border: `1px solid ${COLORS.border.primary}`,
              marginRight: SPACING.lg,
              backgroundColor: token.value
            }}
          />
          <TokenPreview token={token} />
        </div>
      )}
      
      {(token.type === 'typography' || token.type === 'spacing') && (
        <div style={{
          marginTop: SPACING.lg
        }}>
          <TokenPreview token={token} />
        </div>
      )}
    </div>
  );
}

function TokenPreview({ token }: { token: import('../../types').DesignToken }) {
  switch (token.type) {
    case 'color': {
      const colorToken = token as import('../../types').ColorToken;
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.lg,
          fontSize: TYPOGRAPHY.fontSize.xs,
          color: COLORS.text.secondary
        }}>
          <span>{colorToken.hex}</span>
          {colorToken.isAccessible !== undefined && (
            <span style={{
              padding: `${SPACING.xs} ${SPACING.sm}`,
              borderRadius: RADIUS.sm,
              fontSize: TYPOGRAPHY.fontSize.xs,
              backgroundColor: colorToken.isAccessible
                ? 'rgba(78, 201, 176, 0.1)'
                : 'rgba(231, 76, 60, 0.1)',
              color: colorToken.isAccessible
                ? COLORS.status.success
                : COLORS.status.error
            }}>
              {colorToken.isAccessible ? 'A11Y' : '!A11Y'}
            </span>
          )}
        </div>
      );
    }
      
    case 'typography': {
      const typographyToken = token as import('../../types').TypographyToken;
      return (
        <div 
          style={{ 
            fontSize: TYPOGRAPHY.fontSize.xs,
            color: COLORS.text.secondary,
            fontFamily: typographyToken.fontFamily,
            fontWeight: typographyToken.fontWeight 
          }}
        >
          {typographyToken.fontSize} / {typographyToken.fontWeight}
        </div>
      );
    }
      
    case 'spacing': {
      const spacingToken = token as import('../../types').SpacingToken;
      return (
        <div style={{
          fontSize: TYPOGRAPHY.fontSize.xs,
          color: COLORS.text.secondary
        }}>
          {spacingToken.pixels}px ({spacingToken.rem.toFixed(2)}rem)
        </div>
      );
    }
      
    default:
      return null;
  }
}

function TokenDetails({ 
  token 
}: { 
  token: import('../../types').DesignToken 
}) {
  const [activeSection, setActiveSection] = useState<'overview' | 'usage' | 'issues'>('overview');
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: Box, count: undefined },
    { id: 'usage', label: 'Usage', icon: Zap, count: undefined },
    { id: 'issues', label: 'Issues', icon: AlertTriangle, count: token.violations?.length || 0 },
  ];

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
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <TokenTypeIcon 
              type={token.type} 
              style={{
                width: '32px',
                height: '32px',
                marginRight: SPACING['2xl'],
                color: COLORS.text.muted
              }} 
            />
            <div>
              <h2 style={{
                fontSize: TYPOGRAPHY.fontSize.xl,
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.text.heading,
                margin: 0
              }}>
                {token.name}
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
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: RADIUS.full,
                    marginRight: SPACING.lg,
                    backgroundColor: token.isValid ? COLORS.status.success : COLORS.status.error
                  }} />
                  {token.isValid ? 'Valid' : 'Invalid'}
                </span>
                <span>{token.usageCount} uses</span>
                <span style={{ textTransform: 'capitalize' }}>{token.category}</span>
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg
          }}>
            <button
              onClick={() => copyToClipboard(token.value)}
              style={mergeStyles(
                COMPONENT_STYLES.button.base,
                {
                  fontSize: TYPOGRAPHY.fontSize.sm
                }
              )}
            >
              <Copy style={{
                width: '16px',
                height: '16px',
                marginRight: SPACING.lg
              }} />
              Copy Value
            </button>
            <button
              onClick={() => copyToClipboard(token.name)}
              style={mergeStyles(
                COMPONENT_STYLES.button.base,
                {
                  fontSize: TYPOGRAPHY.fontSize.sm
                }
              )}
            >
              <Copy style={{
                width: '16px',
                height: '16px',
                marginRight: SPACING.lg
              }} />
              Copy Name
            </button>
          </div>
        </div>
        
        {/* Token Preview */}
        <div style={{
          marginTop: SPACING.xl,
          padding: SPACING.xl,
          backgroundColor: COLORS.background.primary,
          borderRadius: RADIUS.lg
        }}>
          <TokenLargePreview token={token} />
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
                COMPONENT_STYLES.tabs.tab.base,
                activeSection === section.id 
                  ? COMPONENT_STYLES.tabs.tab.active 
                  : undefined,
                {
                  padding: `${SPACING.lg} ${SPACING['2xl']}`,
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  border: 'none',
                  borderRadius: RADIUS.lg,
                  backgroundColor: activeSection === section.id 
                    ? 'rgba(52, 152, 219, 0.1)' 
                    : 'transparent'
                }
              )}
              onMouseEnter={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.color = COLORS.text.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.id) {
                  e.currentTarget.style.color = COLORS.text.secondary;
                }
              }}
            >
              <section.icon style={{
                width: '16px',
                height: '16px',
                marginRight: SPACING.lg
              }} />
              {section.label}
              {section.count !== undefined && section.count > 0 && (
                <span style={{
                  marginLeft: SPACING.lg,
                  padding: `${SPACING.xs} ${SPACING.lg}`,
                  backgroundColor: 'rgba(231, 76, 60, 0.1)',
                  color: COLORS.status.error,
                  borderRadius: RADIUS.full,
                  fontSize: TYPOGRAPHY.fontSize.xs
                }}>
                  {section.count}
                </span>
              )}
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
          <TokenOverview token={token} />
        )}
        {activeSection === 'usage' && (
          <TokenUsage token={token} />
        )}
        {activeSection === 'issues' && (
          <TokenIssues token={token} />
        )}
      </div>
    </div>
  );
}

function TokenTypeIcon({ type, style }: { type: string; style?: React.CSSProperties }) {
  const icons = {
    color: Palette,
    typography: Type,
    spacing: Ruler,
    size: Box,
    shadow: Zap,
    border: Box,
  };
  
  const Icon = icons[type as keyof typeof icons] || Box;
  return <Icon style={style} />;
}

function TokenLargePreview({ token }: { token: import('../../types').DesignToken }) {
  switch (token.type) {
    case 'color': {
      const colorToken = token as import('../../types').ColorToken;
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xl
        }}>
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: RADIUS.lg,
              border: `1px solid ${COLORS.border.primary}`,
              flexShrink: 0,
              backgroundColor: colorToken.value
            }}
          />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm
          }}>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily.mono,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary
            }}>
              {colorToken.value}
            </div>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily.mono,
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.secondary
            }}>
              HEX: {colorToken.hex}
            </div>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily.mono,
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.secondary
            }}>
              RGB: {colorToken.rgb}
            </div>
            <div style={{
              fontFamily: TYPOGRAPHY.fontFamily.mono,
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.secondary
            }}>
              HSL: {colorToken.hsl}
            </div>
          </div>
        </div>
      );
    }
      
    case 'typography': {
      const typographyToken = token as import('../../types').TypographyToken;
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING['2xl']
        }}>
          <div 
            style={{ 
              fontSize: typographyToken.fontSize,
              fontWeight: typographyToken.fontWeight,
              fontFamily: typographyToken.fontFamily,
              lineHeight: typographyToken.lineHeight,
              color: COLORS.text.primary
            }}
          >
            The quick brown fox jumps
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: SPACING.xl,
            fontSize: TYPOGRAPHY.fontSize.sm
          }}>
            <div>
              <span style={{ color: COLORS.text.secondary }}>Size:</span>
              <span style={{
                marginLeft: SPACING.lg,
                fontFamily: TYPOGRAPHY.fontFamily.mono
              }}>{typographyToken.fontSize}</span>
            </div>
            <div>
              <span style={{ color: COLORS.text.secondary }}>Weight:</span>
              <span style={{
                marginLeft: SPACING.lg,
                fontFamily: TYPOGRAPHY.fontFamily.mono
              }}>{typographyToken.fontWeight}</span>
            </div>
            <div>
              <span style={{ color: COLORS.text.secondary }}>Line Height:</span>
              <span style={{
                marginLeft: SPACING.lg,
                fontFamily: TYPOGRAPHY.fontFamily.mono
              }}>{typographyToken.lineHeight}</span>
            </div>
            <div>
              <span style={{ color: COLORS.text.secondary }}>Family:</span>
              <span style={{
                marginLeft: SPACING.lg,
                fontFamily: TYPOGRAPHY.fontFamily.mono,
                fontSize: TYPOGRAPHY.fontSize.xs
              }}>{typographyToken.fontFamily}</span>
            </div>
          </div>
        </div>
      );
    }
      
    case 'spacing': {
      const spacingToken = token as import('../../types').SpacingToken;
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING['2xl']
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xl
          }}>
            <div 
              style={{
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                border: `2px dashed ${COLORS.border.focus}`,
                width: `${Math.min(spacingToken.pixels, 200)}px`,
                height: '32px'
              }}
            />
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.secondary
            }}>
              {spacingToken.pixels}px visual representation
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: SPACING.xl,
            fontSize: TYPOGRAPHY.fontSize.sm
          }}>
            <div>
              <span style={{ color: COLORS.text.secondary }}>Pixels:</span>
              <span style={{
                marginLeft: SPACING.lg,
                fontFamily: TYPOGRAPHY.fontFamily.mono
              }}>{spacingToken.pixels}px</span>
            </div>
            <div>
              <span style={{ color: COLORS.text.secondary }}>REM:</span>
              <span style={{
                marginLeft: SPACING.lg,
                fontFamily: TYPOGRAPHY.fontFamily.mono
              }}>{spacingToken.rem.toFixed(2)}rem</span>
            </div>
            <div>
              <span style={{ color: COLORS.text.secondary }}>Scale:</span>
              <span style={{
                marginLeft: SPACING.lg,
                fontFamily: TYPOGRAPHY.fontFamily.mono
              }}>{spacingToken.scale}</span>
            </div>
          </div>
        </div>
      );
    }
      
    default:
      return (
        <div style={{
          fontFamily: TYPOGRAPHY.fontFamily.mono,
          fontSize: TYPOGRAPHY.fontSize.lg,
          color: COLORS.text.primary
        }}>
          {token.value}
        </div>
      );
  }
}

function TokenOverview({ token }: { token: import('../../types').DesignToken }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING['5xl']
    }}>
      <div>
        <h3 style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.heading,
          margin: 0,
          marginBottom: SPACING.xl
        }}>
          Token Information
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
              color: COLORS.text.secondary
            }}>Name</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary,
              fontFamily: TYPOGRAPHY.fontFamily.mono
            }}>{token.name}</dd>
          </div>
          <div>
            <dt style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary
            }}>Value</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary,
              fontFamily: TYPOGRAPHY.fontFamily.mono
            }}>{token.value}</dd>
          </div>
          <div>
            <dt style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary
            }}>Type</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary,
              textTransform: 'capitalize'
            }}>{token.type}</dd>
          </div>
          <div>
            <dt style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary
            }}>Category</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary,
              textTransform: 'capitalize'
            }}>{token.category}</dd>
          </div>
          <div>
            <dt style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary
            }}>Usage Count</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary
            }}>{token.usageCount}</dd>
          </div>
          <div>
            <dt style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary
            }}>Status</dt>
            <dd style={{
              marginTop: SPACING.sm,
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: token.isValid ? COLORS.status.success : COLORS.status.error
            }}>
              {token.isValid ? 'Valid' : 'Invalid'}
            </dd>
          </div>
        </dl>
      </div>
      
      {token.description && (
        <div>
          <h4 style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            color: COLORS.text.secondary,
            marginBottom: SPACING.lg
          }}>Description</h4>
          <p style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.primary,
            margin: 0
          }}>{token.description}</p>
        </div>
      )}
    </div>
  );
}

function TokenUsage({ token }: { token: import('../../types').DesignToken }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING['5xl']
    }}>
      <div>
        <h3 style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.heading,
          margin: 0,
          marginBottom: SPACING.xl
        }}>
          Usage Analysis
        </h3>
        
        <div style={{
          backgroundColor: COLORS.background.tertiary,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: COLORS.text.primary,
            marginBottom: SPACING.lg
          }}>
            {token.usageCount}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>
            Times used in your application
          </div>
        </div>
      </div>
      
      <div>
        <h4 style={{
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          color: COLORS.text.primary,
          marginBottom: SPACING['2xl']
        }}>Recommendations</h4>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
          fontSize: TYPOGRAPHY.fontSize.sm
        }}>
          {token.usageCount === 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: SPACING['2xl'],
              backgroundColor: 'rgba(243, 156, 18, 0.1)',
              borderRadius: RADIUS.lg
            }}>
              <AlertTriangle style={{
                width: '16px',
                height: '16px',
                color: COLORS.status.warning,
                marginRight: SPACING.lg
              }} />
              <span style={{
                color: COLORS.status.warning
              }}>
                This token is not being used. Consider removing it or documenting its purpose.
              </span>
            </div>
          )}
          {token.usageCount === 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: SPACING['2xl'],
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderRadius: RADIUS.lg
            }}>
              <Box style={{
                width: '16px',
                height: '16px',
                color: COLORS.status.info,
                marginRight: SPACING.lg
              }} />
              <span style={{
                color: COLORS.status.info
              }}>
                This token is only used once. Consider if it should be a token or just a value.
              </span>
            </div>
          )}
          {token.usageCount > 10 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: SPACING['2xl'],
              backgroundColor: 'rgba(78, 201, 176, 0.1)',
              borderRadius: RADIUS.lg
            }}>
              <CheckCircle style={{
                width: '16px',
                height: '16px',
                color: COLORS.status.success,
                marginRight: SPACING.lg
              }} />
              <span style={{
                color: COLORS.status.success
              }}>
                This token is well-utilized across your application.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TokenIssues({ token }: { token: import('../../types').DesignToken }) {
  const issues = token.violations || [];
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING['5xl']
    }}>
      <div>
        <h3 style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.heading,
          margin: 0,
          marginBottom: SPACING.xl
        }}>
          Issues ({issues.length})
        </h3>
        
        {issues.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: SPACING.xl,
            backgroundColor: 'rgba(78, 201, 176, 0.1)',
            borderRadius: RADIUS.lg
          }}>
            <CheckCircle style={{
              width: '20px',
              height: '20px',
              color: COLORS.status.success,
              marginRight: SPACING['2xl']
            }} />
            <span style={{
              color: COLORS.status.success
            }}>
              No issues found with this token.
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING['2xl']
          }}>
            {issues.map((issue, index) => (
              <div key={index} style={{
                padding: SPACING.xl,
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderRadius: RADIUS.lg,
                border: `1px solid rgba(231, 76, 60, 0.2)`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  <AlertTriangle style={{
                    width: '20px',
                    height: '20px',
                    color: COLORS.status.error,
                    marginRight: SPACING['2xl'],
                    marginTop: '2px',
                    flexShrink: 0
                  }} />
                  <div style={{
                    flex: 1
                  }}>
                    <p style={{
                      color: COLORS.status.error,
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      margin: 0
                    }}>
                      {issue}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}