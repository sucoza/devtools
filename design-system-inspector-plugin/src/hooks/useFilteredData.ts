import { useMemo } from 'react';
import type { 
  DesignSystemState,
  ComponentUsage,
  DesignToken,
  ConsistencyIssue
} from '../types';

/**
 * Hook for filtering design system data based on search and filters
 */
export function useFilteredData(state: DesignSystemState) {
  const {
    componentUsage,
    tokens,
    consistencyIssues,
    ui: { searchQuery, filters, showOnlyIssues }
  } = state;

  const filteredData = useMemo(() => {
    // Filter components
    const filteredComponents = componentUsage.filter(component => {
      // Search filter
      if (searchQuery && !component.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !component.displayName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Show only issues filter
      if (showOnlyIssues) {
        // Check if component has any related issues
        const hasIssues = consistencyIssues.some(issue => 
          issue.element && getComponentFromElement(issue.element)?.name === component.name
        );
        return hasIssues;
      }
      
      return true;
    });

    // Filter tokens
    const filteredTokens = tokens.filter(token => {
      // Search filter
      if (searchQuery && !token.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !token.value.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Token type filter
      if (filters.tokenTypes.length > 0 && !filters.tokenTypes.includes(token.type)) {
        return false;
      }
      
      // Show only issues filter
      if (showOnlyIssues && token.violations && token.violations.length === 0) {
        return false;
      }
      
      return true;
    });

    // Filter issues
    const filteredIssues = consistencyIssues.filter(issue => {
      // Search filter
      if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !issue.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Severity filter
      if (filters.severity.length > 0 && !filters.severity.includes(issue.severity)) {
        return false;
      }
      
      // Issue type filter
      if (filters.issueTypes.length > 0 && !filters.issueTypes.includes(issue.type)) {
        return false;
      }
      
      return true;
    });

    return {
      components: filteredComponents,
      tokens: filteredTokens,
      issues: filteredIssues,
    };
  }, [componentUsage, tokens, consistencyIssues, searchQuery, filters, showOnlyIssues]);

  return filteredData;
}

/**
 * Hook for getting component statistics
 */
export function useComponentStats(components: ComponentUsage[]) {
  return useMemo(() => {
    const totalUsage = components.reduce((sum, component) => sum + component.usageCount, 0);
    const mostUsedComponent = components.reduce((max, component) => 
      component.usageCount > max.usageCount ? component : max, components[0] || { usageCount: 0 });
    
    const propStats = components.reduce((stats, component) => {
      component.props.forEach(prop => {
        if (!stats[prop.name]) {
          stats[prop.name] = { count: 0, components: [] };
        }
        stats[prop.name].count++;
        stats[prop.name].components.push(component.name);
      });
      return stats;
    }, {} as Record<string, { count: number; components: string[] }>);

    const mostUsedProps = Object.entries(propStats)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10);

    return {
      totalComponents: components.length,
      totalUsage,
      mostUsedComponent: mostUsedComponent.usageCount > 0 ? mostUsedComponent : null,
      mostUsedProps,
      averageUsage: components.length > 0 ? totalUsage / components.length : 0,
    };
  }, [components]);
}

/**
 * Hook for getting token statistics
 */
export function useTokenStats(tokens: DesignToken[]) {
  return useMemo(() => {
    const byType = tokens.reduce((stats, token) => {
      if (!stats[token.type]) {
        stats[token.type] = [];
      }
      stats[token.type].push(token);
      return stats;
    }, {} as Record<string, DesignToken[]>);

    const totalUsage = tokens.reduce((sum, token) => sum + token.usageCount, 0);
    const validTokens = tokens.filter(token => token.isValid);
    const tokensWithIssues = tokens.filter(token => token.violations && token.violations.length > 0);

    const mostUsedTokens = tokens
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    return {
      totalTokens: tokens.length,
      totalUsage,
      validTokens: validTokens.length,
      tokensWithIssues: tokensWithIssues.length,
      byType,
      mostUsedTokens,
      utilizationRate: tokens.length > 0 ? (tokens.filter(t => t.usageCount > 0).length / tokens.length) * 100 : 0,
    };
  }, [tokens]);
}

/**
 * Hook for getting issue statistics
 */
export function useIssueStats(issues: ConsistencyIssue[]) {
  return useMemo(() => {
    const bySeverity = issues.reduce((stats, issue) => {
      stats[issue.severity] = (stats[issue.severity] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    const byType = issues.reduce((stats, issue) => {
      stats[issue.type] = (stats[issue.type] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    const fixableIssues = issues.filter(issue => issue.fixable);
    const criticalIssues = issues.filter(issue => issue.severity === 'error');

    return {
      totalIssues: issues.length,
      bySeverity,
      byType,
      fixableIssues: fixableIssues.length,
      criticalIssues: criticalIssues.length,
      fixablePercentage: issues.length > 0 ? (fixableIssues.length / issues.length) * 100 : 0,
    };
  }, [issues]);
}

/**
 * Hook for searching across all data types
 */
export function useSearch(state: DesignSystemState, query: string) {
  return useMemo(() => {
    if (!query.trim()) {
      return {
        components: [],
        tokens: [],
        issues: [],
        hasResults: false,
      };
    }

    const lowerQuery = query.toLowerCase();

    const components = state.componentUsage.filter(component =>
      component.name.toLowerCase().includes(lowerQuery) ||
      component.displayName.toLowerCase().includes(lowerQuery) ||
      component.filePath.toLowerCase().includes(lowerQuery)
    );

    const tokens = state.tokens.filter(token =>
      token.name.toLowerCase().includes(lowerQuery) ||
      token.value.toLowerCase().includes(lowerQuery) ||
      token.category.toLowerCase().includes(lowerQuery) ||
      token.type.toLowerCase().includes(lowerQuery)
    );

    const issues = state.consistencyIssues.filter(issue =>
      issue.title.toLowerCase().includes(lowerQuery) ||
      issue.description.toLowerCase().includes(lowerQuery) ||
      issue.type.toLowerCase().includes(lowerQuery) ||
      (issue.recommendation && issue.recommendation.toLowerCase().includes(lowerQuery))
    );

    return {
      components,
      tokens,
      issues,
      hasResults: components.length > 0 || tokens.length > 0 || issues.length > 0,
    };
  }, [state, query]);
}

/**
 * Helper function to get component from DOM element (simplified)
 */
function getComponentFromElement(element: HTMLElement): { name: string } | null {
  // This would integrate with the component detector utility
  // For now, return a simple implementation
  const componentName = element.getAttribute('data-component') || 
                       element.className.split(' ').find(c => c.includes('Component'));
  
  return componentName ? { name: componentName } : null;
}