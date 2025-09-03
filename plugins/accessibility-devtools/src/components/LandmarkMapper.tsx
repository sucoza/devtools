import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles, ScrollableContainer, Badge, Alert } from '@sucoza/shared-components';

import { 
  MapPin, 
  Eye, 
  RotateCw,
  ChevronRight,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import type { LandmarkInfo } from '../types';

export interface LandmarkMapperProps {
  className?: string;
}

/**
 * Component for analyzing and visualizing page landmark structure
 */
export function LandmarkMapper({ className }: LandmarkMapperProps) {
  const [landmarks, setLandmarks] = useState<LandmarkInfo[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showOverlay, setShowOverlay] = useState(false);

  const analyzeLandmarks = useCallback((): LandmarkInfo[] => {
    const landmarks: LandmarkInfo[] = [];
    
    // Landmark selectors and their roles
    const landmarkSelectors = {
      'main, [role="main"]': 'main',
      'nav, [role="navigation"]': 'navigation',
      'aside, [role="complementary"]': 'complementary',
      'header, [role="banner"]': 'banner',
      'footer, [role="contentinfo"]': 'contentinfo',
      'section, [role="region"]': 'region',
      'article, [role="article"]': 'article',
      'form, [role="form"]': 'form',
      '[role="search"]': 'search',
      '[role="application"]': 'application',
    };

    Object.entries(landmarkSelectors).forEach(([selector, role]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const landmarkInfo = createLandmarkInfo(element, role, 0);
        if (landmarkInfo) {
          landmarks.push(landmarkInfo);
        }
      });
    });

    // Sort landmarks by document order
    landmarks.sort((a, b) => {
      const aRect = a.element.getBoundingClientRect();
      const bRect = b.element.getBoundingClientRect();
      
      // Sort by vertical position first, then horizontal
      if (Math.abs(aRect.top - bRect.top) > 10) {
        return aRect.top - bRect.top;
      }
      return aRect.left - bRect.left;
    });

    // Build hierarchy
    return buildLandmarkHierarchy(landmarks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const landmarkStructure = analyzeLandmarks();
      setLandmarks(landmarkStructure);
    } catch (error) {
      console.error('Landmark analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeLandmarks]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const createLandmarkInfo = (element: Element, role: string, level: number): LandmarkInfo | null => {
    const selector = generateSelector(element);
    const label = getLandmarkLabel(element);
    
    return {
      role,
      label,
      element,
      selector,
      level,
      children: [],
    };
  };

  const getLandmarkLabel = (element: Element): string | undefined => {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    // Check aria-labelledby
    const labelledby = element.getAttribute('aria-labelledby');
    if (labelledby) {
      const labelElement = document.getElementById(labelledby);
      if (labelElement) return labelElement.textContent?.trim();
    }
    
    // For navigation, try to find heading or first link
    if (element.matches('nav, [role="navigation"]')) {
      const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) return heading.textContent?.trim();
      
      const firstLink = element.querySelector('a');
      if (firstLink) return `Navigation starting with: ${firstLink.textContent?.trim()?.substring(0, 30)}...`;
    }
    
    // For main content area, look for headings
    if (element.matches('main, [role="main"]')) {
      const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) return heading.textContent?.trim();
    }
    
    // For articles and sections, look for headings
    if (element.matches('article, section, [role="article"], [role="region"]')) {
      const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) return heading.textContent?.trim();
    }
    
    // For forms, look for legend or first label
    if (element.matches('form, [role="form"]')) {
      const legend = element.querySelector('legend');
      if (legend) return legend.textContent?.trim();
      
      const label = element.querySelector('label');
      if (label) return `Form starting with: ${label.textContent?.trim()?.substring(0, 30)}...`;
    }
    
    return undefined;
  };

  const buildLandmarkHierarchy = (landmarks: LandmarkInfo[]): LandmarkInfo[] => {
    const rootLandmarks: LandmarkInfo[] = [];
    
    landmarks.forEach(landmark => {
      // Find parent landmark
      let parent = null;
      for (const potentialParent of landmarks) {
        if (potentialParent !== landmark && 
            potentialParent.element.contains(landmark.element)) {
          if (!parent || parent.element.contains(potentialParent.element)) {
            parent = potentialParent;
          }
        }
      }
      
      if (parent) {
        landmark.level = parent.level + 1;
        parent.children.push(landmark);
      } else {
        rootLandmarks.push(landmark);
      }
    });
    
    return rootLandmarks;
  };

  const generateSelector = (element: Element): string => {
    if (element.id) return `#${element.id}`;
    
    const role = element.getAttribute('role');
    const tagName = element.tagName.toLowerCase();
    
    if (role) return `[role="${role}"]`;
    
    if (element.className) {
      const classes = element.className.trim().split(/\s+/).slice(0, 2);
      return `${tagName}.${classes.join('.')}`;
    }
    
    return tagName;
  };

  const highlightLandmark = (landmark: LandmarkInfo) => {
    const element = landmark.element;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add temporary highlight
    if (element instanceof HTMLElement) {
      element.style.outline = '3px solid #8b5cf6';
      element.style.outlineOffset = '2px';
      element.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
      
      setTimeout(() => {
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.backgroundColor = '';
      }, 2000);
    }
  };

  const toggleOverlay = () => {
    if (!showOverlay) {
      createLandmarkOverlays();
    } else {
      removeLandmarkOverlays();
    }
    setShowOverlay(!showOverlay);
  };

  const createLandmarkOverlays = () => {
    removeLandmarkOverlays(); // Clean up existing overlays
    
    const allLandmarks = flattenLandmarks(landmarks);
    allLandmarks.forEach((landmark, _index) => {
      const element = landmark.element;
      const rect = element.getBoundingClientRect();
      
      const overlay = document.createElement('div');
      overlay.className = 'landmark-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid #8b5cf6;
        background: rgba(139, 92, 246, 0.05);
        pointer-events: none;
        z-index: 9999;
        border-radius: 4px;
      `;
      
      // Add label
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: -2px;
        left: -2px;
        background: #8b5cf6;
        color: white;
        padding: 2px 6px;
        font-size: 12px;
        font-weight: bold;
        border-radius: 4px 0 4px 0;
        white-space: nowrap;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      label.textContent = `${landmark.role}${landmark.label ? ': ' + landmark.label : ''}`;
      overlay.appendChild(label);
      
      document.body.appendChild(overlay);
    });
  };

  const removeLandmarkOverlays = () => {
    document.querySelectorAll('.landmark-overlay').forEach(el => el.remove());
  };

  const flattenLandmarks = (landmarks: LandmarkInfo[]): LandmarkInfo[] => {
    const flattened: LandmarkInfo[] = [];
    
    const addToFlattened = (landmark: LandmarkInfo) => {
      flattened.push(landmark);
      landmark.children.forEach(addToFlattened);
    };
    
    landmarks.forEach(addToFlattened);
    return flattened;
  };

  const toggleExpanded = (selector: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(selector)) {
      newExpanded.delete(selector);
    } else {
      newExpanded.add(selector);
    }
    setExpandedNodes(newExpanded);
  };

  const allLandmarks = flattenLandmarks(landmarks);
  const stats = {
    total: allLandmarks.length,
    navigation: allLandmarks.filter(l => l.role === 'navigation').length,
    main: allLandmarks.filter(l => l.role === 'main').length,
    complementary: allLandmarks.filter(l => l.role === 'complementary').length,
    contentinfo: allLandmarks.filter(l => l.role === 'contentinfo').length,
    banner: allLandmarks.filter(l => l.role === 'banner').length,
  };

  const issues = [];
  if (stats.main === 0) {
    issues.push('Missing main landmark');
  }
  if (stats.main > 1) {
    issues.push('Multiple main landmarks');
  }
  if (stats.banner > 1) {
    issues.push('Multiple banner landmarks');
  }
  if (stats.contentinfo > 1) {
    issues.push('Multiple contentinfo landmarks');
  }

  return (
    <div style={mergeStyles(COMPONENT_STYLES.container.base, className ? {} : {})}>
      {/* Header */}
      <div style={mergeStyles(COMPONENT_STYLES.header.base, { borderBottom: `1px solid ${COLORS.border.primary}` })}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <MapPin style={{ width: '20px', height: '20px', color: COLORS.status.info }} />
            <h2 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary
            }}>
              Landmark Structure
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <button
              onClick={toggleOverlay}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                padding: `${SPACING.sm} ${SPACING.md}`,
                fontSize: TYPOGRAPHY.fontSize.sm,
                backgroundColor: showOverlay ? COLORS.background.tertiary : COLORS.background.secondary,
                color: showOverlay ? COLORS.status.info : COLORS.text.secondary,
                border: 'none',
                borderRadius: RADIUS.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!showOverlay) {
                  e.currentTarget.style.backgroundColor = COLORS.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                if (!showOverlay) {
                  e.currentTarget.style.backgroundColor = COLORS.background.secondary;
                }
              }}
            >
              <Eye style={{ width: '16px', height: '16px' }} />
              {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
            </button>
            
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                padding: `${SPACING.sm} ${SPACING.md}`,
                fontSize: TYPOGRAPHY.fontSize.sm,
                backgroundColor: isAnalyzing ? COLORS.background.tertiary : COLORS.status.info,
                color: COLORS.text.primary,
                border: 'none',
                borderRadius: RADIUS.md,
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                opacity: isAnalyzing ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isAnalyzing) {
                  e.currentTarget.style.backgroundColor = COLORS.background.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isAnalyzing) {
                  e.currentTarget.style.backgroundColor = COLORS.status.info;
                }
              }}
            >
              <RotateCw style={{
                width: '16px',
                height: '16px',
                animation: isAnalyzing ? 'spin 1s linear infinite' : 'none'
              }} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: SPACING.md
        }}>
          <div style={{
            textAlign: 'center',
            padding: SPACING.md,
            backgroundColor: COLORS.background.secondary,
            borderRadius: RADIUS.lg
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.text.primary
            }}>
              {stats.total}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.secondary
            }}>Total</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING.md,
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderRadius: RADIUS.lg
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.status.info
            }}>
              {stats.main}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.status.info
            }}>Main</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING.md,
            backgroundColor: 'rgba(78, 201, 176, 0.1)',
            borderRadius: RADIUS.lg
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.status.success
            }}>
              {stats.navigation}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.status.success
            }}>Nav</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING.md,
            backgroundColor: 'rgba(155, 89, 182, 0.1)',
            borderRadius: RADIUS.lg
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: '#9b59b6'
            }}>
              {stats.complementary}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: '#9b59b6'
            }}>Aside</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING.md,
            backgroundColor: 'rgba(241, 196, 15, 0.1)',
            borderRadius: RADIUS.lg
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.status.warning
            }}>
              {stats.banner}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.status.warning
            }}>Header</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING.md,
            backgroundColor: 'rgba(102, 51, 153, 0.1)',
            borderRadius: RADIUS.lg
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.status.info
            }}>
              {stats.contentinfo}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.status.info
            }}>Footer</div>
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div style={{
            marginTop: SPACING.lg,
            padding: SPACING.md,
            backgroundColor: 'rgba(241, 196, 15, 0.1)',
            border: `1px solid ${COLORS.status.warning}`,
            borderRadius: RADIUS.lg
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING.sm }}>
              <AlertTriangle style={{
                width: '16px',
                height: '16px',
                color: COLORS.status.warning,
                marginTop: '2px'
              }} />
              <div>
                <h4 style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  color: COLORS.status.warning
                }}>
                  Landmark Issues Detected
                </h4>
                <ul style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.status.warning,
                  marginTop: SPACING.xs,
                  listStyle: 'disc',
                  paddingLeft: SPACING.lg
                }}>
                  {issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Landmark Tree */}
      <ScrollableContainer>
        {isAnalyzing ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <div style={{ textAlign: 'center' }}>
              <RotateCw style={{
                width: '32px',
                height: '32px',
                margin: '0 auto 8px auto',
                animation: 'spin 1s linear infinite',
                color: COLORS.status.info
              }} />
              <p style={{ color: COLORS.text.secondary }}>Analyzing landmark structure...</p>
            </div>
          </div>
        ) : landmarks.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: COLORS.text.secondary
          }}>
            <div style={{ textAlign: 'center' }}>
              <MapPin style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px auto',
                color: COLORS.text.muted
              }} />
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.lg,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                marginBottom: SPACING.sm
              }}>No Landmarks Found</p>
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.sm
              }}>Consider adding landmark roles for better navigation</p>
            </div>
          </div>
        ) : (
          <div style={{ padding: SPACING.lg }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
              {landmarks.map((landmark, index) => (
                <LandmarkItem
                  key={`${landmark.selector}-${index}`}
                  landmark={landmark}
                  isExpanded={expandedNodes.has(landmark.selector)}
                  onToggleExpanded={() => toggleExpanded(landmark.selector)}
                  onHighlight={() => highlightLandmark(landmark)}
                />
              ))}
            </div>
          </div>
        )}
      </ScrollableContainer>
    </div>
  );
}

interface LandmarkItemProps {
  landmark: LandmarkInfo;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onHighlight: () => void;
}

function LandmarkItem({ landmark, isExpanded, onToggleExpanded, onHighlight }: LandmarkItemProps) {
  const getRoleStyle = (role: string) => {
    const styles = {
      'main': { color: COLORS.status.info, backgroundColor: 'rgba(52, 152, 219, 0.1)' },
      'navigation': { color: COLORS.status.success, backgroundColor: 'rgba(78, 201, 176, 0.1)' },
      'complementary': { color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
      'banner': { color: COLORS.status.warning, backgroundColor: 'rgba(243, 156, 18, 0.1)' },
      'contentinfo': { color: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' },
      'region': { color: COLORS.text.secondary, backgroundColor: COLORS.background.tertiary },
      'article': { color: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)' },
      'form': { color: '#ec4899', backgroundColor: 'rgba(236, 72, 153, 0.1)' },
      'search': { color: '#14b8a6', backgroundColor: 'rgba(20, 184, 166, 0.1)' },
    };
    return styles[role as keyof typeof styles] || { color: COLORS.text.secondary, backgroundColor: COLORS.background.tertiary };
  };

  return (
    <div style={{ marginLeft: `${landmark.level * 20}px` }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        padding: SPACING.lg,
        borderRadius: RADIUS.md,
        transition: 'background-color 0.15s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.background.hover}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        {landmark.children.length > 0 ? (
          <button
            onClick={onToggleExpanded}
            style={{
              color: COLORS.text.muted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: SPACING.xs,
              borderRadius: RADIUS.sm,
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = COLORS.text.secondary}
            onMouseLeave={(e) => e.currentTarget.style.color = COLORS.text.muted}
          >
            {isExpanded ? (
              <ChevronDown style={{ width: '16px', height: '16px' }} />
            ) : (
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            )}
          </button>
        ) : (
          <div style={{ width: '16px' }} />
        )}
        
        <Badge style={mergeStyles(
          COMPONENT_STYLES.tag.base,
          {
            padding: `${SPACING.xs} ${SPACING.lg}`,
            fontSize: TYPOGRAPHY.fontSize.sm,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            borderRadius: RADIUS.full,
            ...getRoleStyle(landmark.role)
          }
        )}>
          {landmark.role}
        </Badge>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.base,
            color: COLORS.text.primary,
            marginBottom: SPACING.xs
          }}>
            {landmark.label || 'Unlabeled landmark'}
          </div>
          <code style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.muted,
            fontFamily: TYPOGRAPHY.fontFamily.mono
          }}>
            {landmark.selector}
          </code>
        </div>
        
        <button
          onClick={onHighlight}
          style={{
            color: '#6366f1',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: SPACING.sm,
            borderRadius: RADIUS.md,
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = COLORS.text.accent}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6366f1'}
          title="Highlight landmark"
        >
          <Eye style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
      
      {isExpanded && landmark.children.length > 0 && (
        <div style={{ marginTop: SPACING.xs }}>
          {landmark.children.map((child, index) => (
            <LandmarkItem
              key={`${child.selector}-${index}`}
              landmark={child}
              isExpanded={false} // For simplicity, don't nest expansion
              onToggleExpanded={() => {}}
              onHighlight={() => onHighlight()}
            />
          ))}
        </div>
      )}
    </div>
  );
}