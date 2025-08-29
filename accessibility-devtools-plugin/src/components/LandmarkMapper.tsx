import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  MapPin, 
  Eye, 
  Tree, 
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

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const landmarkStructure = analyzeLandmarks();
      setLandmarks(landmarkStructure);
    } catch (error) {
      console.error('Landmark analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeLandmarks = (): LandmarkInfo[] => {
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
  };

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
    element.style.outline = '3px solid #8b5cf6';
    element.style.outlineOffset = '2px';
    element.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
    
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
      element.style.backgroundColor = '';
    }, 2000);
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
    allLandmarks.forEach((landmark, index) => {
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
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Landmark Structure
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleOverlay}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors',
                showOverlay
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              <Eye className="w-4 h-4" />
              {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
            </button>
            
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCw className={clsx('w-4 h-4', isAnalyzing && 'animate-spin')} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {stats.main}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Main</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {stats.navigation}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">Nav</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {stats.complementary}
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300">Aside</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.banner}
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300">Header</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.contentinfo}
            </div>
            <div className="text-xs text-indigo-700 dark:text-indigo-300">Footer</div>
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Landmark Issues Detected
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-1 list-disc list-inside">
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
      <div className="flex-1 overflow-auto">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RotateCw className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-500" />
              <p className="text-gray-600 dark:text-gray-400">Analyzing landmark structure...</p>
            </div>
          </div>
        ) : landmarks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium mb-2">No Landmarks Found</p>
              <p className="text-sm">Consider adding landmark roles for better navigation</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="space-y-2">
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
      </div>
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
  const getRoleColor = (role: string) => {
    const colors = {
      'main': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      'navigation': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      'complementary': 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
      'banner': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
      'contentinfo': 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30',
      'region': 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30',
      'article': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
      'form': 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30',
      'search': 'text-teal-600 bg-teal-100 dark:text-teal-400 dark:bg-teal-900/30',
    };
    return colors[role as keyof typeof colors] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
  };

  return (
    <div style={{ marginLeft: `${landmark.level * 20}px` }}>
      <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        {landmark.children.length > 0 ? (
          <button
            onClick={onToggleExpanded}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        
        <span className={clsx(
          'px-2 py-0.5 text-xs font-medium rounded-full',
          getRoleColor(landmark.role)
        )}>
          {landmark.role}
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-900 dark:text-white">
            {landmark.label || 'Unlabeled landmark'}
          </div>
          <code className="text-xs text-gray-500 dark:text-gray-400">
            {landmark.selector}
          </code>
        </div>
        
        <button
          onClick={onHighlight}
          className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
          title="Highlight landmark"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      
      {isExpanded && landmark.children.length > 0 && (
        <div className="mt-1">
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