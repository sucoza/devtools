import { FeatureFlag, FlagValue, FilterOptions, SortOptions } from '../types';

/**
 * Format flag names for display
 */
export function formatFlagName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get display value for a flag
 */
export function getDisplayValue(flag: FeatureFlag, value?: FlagValue): string {
  const actualValue = value !== undefined ? value : flag.value;
  
  if (actualValue === null || actualValue === undefined) {
    return 'null';
  }
  
  if (typeof actualValue === 'boolean') {
    return actualValue ? 'true' : 'false';
  }
  
  if (typeof actualValue === 'string') {
    return `"${actualValue}"`;
  }
  
  if (typeof actualValue === 'number') {
    return actualValue.toString();
  }
  
  if (typeof actualValue === 'object') {
    try {
      return JSON.stringify(actualValue, null, 2);
    } catch {
      return '[Object]';
    }
  }
  
  return String(actualValue);
}

/**
 * Get flag status color based on state
 */
export function getFlagStatusColor(flag: FeatureFlag, hasOverride: boolean = false): string {
  if (hasOverride) return '#f59e0b'; // amber
  if (!flag.enabled) return '#ef4444'; // red
  return '#10b981'; // green
}

/**
 * Get flag type color for UI
 */
export function getFlagTypeColor(type: string): string {
  const colors = {
    boolean: '#3b82f6', // blue
    string: '#10b981', // green
    number: '#f59e0b', // amber
    json: '#8b5cf6', // purple
    multivariate: '#ec4899' // pink
  };
  return colors[type as keyof typeof colors] || '#6b7280'; // gray
}

/**
 * Filter flags based on criteria
 */
export function filterFlags(flags: FeatureFlag[], filters: FilterOptions): FeatureFlag[] {
  return flags.filter(flag => {
    // Text filter
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      const matchesText = 
        flag.name.toLowerCase().includes(searchText) ||
        flag.id.toLowerCase().includes(searchText) ||
        flag.description.toLowerCase().includes(searchText) ||
        flag.tags.some(tag => tag.toLowerCase().includes(searchText));
      
      if (!matchesText) return false;
    }
    
    // Environment filter
    if (filters.environment && filters.environment !== 'all') {
      if (flag.environment !== filters.environment) return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'enabled':
          if (!flag.enabled) return false;
          break;
        case 'disabled':
          if (flag.enabled) return false;
          break;
      }
    }
    
    // Tags filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(filterTag => 
        flag.tags.some(flagTag => flagTag.toLowerCase().includes(filterTag.toLowerCase()))
      );
      if (!hasMatchingTag) return false;
    }
    
    // Flag type filter
    if (filters.flagType && filters.flagType !== 'all') {
      if (flag.type !== filters.flagType) return false;
    }
    
    return true;
  });
}

/**
 * Sort flags based on criteria
 */
export function sortFlags(flags: FeatureFlag[], sortOptions: SortOptions): FeatureFlag[] {
  return [...flags].sort((a, b) => {
    let comparison = 0;
    
    switch (sortOptions.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'environment':
        comparison = a.environment.localeCompare(b.environment);
        break;
    }
    
    return sortOptions.direction === 'desc' ? -comparison : comparison;
  });
}

/**
 * Get all unique tags from flags
 */
export function getUniqueTagsFromFlags(flags: FeatureFlag[]): string[] {
  const tags = new Set<string>();
  flags.forEach(flag => {
    flag.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Get all unique environments from flags
 */
export function getUniqueEnvironmentsFromFlags(flags: FeatureFlag[]): string[] {
  const environments = new Set<string>();
  flags.forEach(flag => {
    environments.add(flag.environment);
  });
  return Array.from(environments).sort();
}

/**
 * Calculate rollout percentage for display
 */
export function formatRolloutPercentage(percentage: number | undefined): string {
  if (percentage === undefined) return '100%';
  return `${percentage}%`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  if (!date) return 'N/A';
  
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Use standard date format
  return new Date(date).toLocaleDateString();
}

/**
 * Validate flag configuration
 */
export function validateFlag(flag: Partial<FeatureFlag>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!flag.id || flag.id.trim().length === 0) {
    errors.push('Flag ID is required');
  }
  
  if (!flag.name || flag.name.trim().length === 0) {
    errors.push('Flag name is required');
  }
  
  if (!flag.type) {
    errors.push('Flag type is required');
  }
  
  if (flag.variants && flag.variants.length > 0) {
    const totalWeight = flag.variants.reduce((sum, variant) => sum + variant.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push('Variant weights must sum to 100%');
    }
  }
  
  if (flag.rollout && (flag.rollout.percentage < 0 || flag.rollout.percentage > 100)) {
    errors.push('Rollout percentage must be between 0 and 100');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}