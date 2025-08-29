/**
 * Utility functions for route parameter validation and editing
 */

import { RouteParamEditContext } from '../types/router';

/**
 * Validate route parameters
 */
export function validateParams(
  params: Record<string, string>,
  validators: Record<string, (value: string) => string | null> = {}
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    // Basic validation
    if (value.includes('/')) {
      errors[key] = 'Parameter cannot contain forward slashes';
    }
    
    if (value.includes('?')) {
      errors[key] = 'Parameter cannot contain question marks';
    }
    
    if (value.includes('#')) {
      errors[key] = 'Parameter cannot contain hash symbols';
    }
    
    // Custom validation if provided
    if (validators[key]) {
      const customError = validators[key](value);
      if (customError) {
        errors[key] = customError;
      }
    }
  });
  
  return errors;
}

/**
 * Validate search parameters
 */
export function validateSearch(search: string): string | null {
  try {
    // Remove leading ? if present
    const searchString = search.startsWith('?') ? search.slice(1) : search;
    
    // Try to parse as URLSearchParams
    new URLSearchParams(searchString);
    
    return null; // No error
  } catch (error) {
    return 'Invalid search parameter format';
  }
}

/**
 * Parse search string into key-value pairs
 */
export function parseSearchParams(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  const searchString = search.startsWith('?') ? search.slice(1) : search;
  
  if (!searchString) {
    return params;
  }
  
  try {
    const urlParams = new URLSearchParams(searchString);
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch (error) {
    console.warn('Error parsing search params:', error);
  }
  
  return params;
}

/**
 * Build search string from key-value pairs
 */
export function buildSearchString(params: Record<string, string>): string {
  const urlParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '') {
      urlParams.set(key, value);
    }
  });
  
  const searchString = urlParams.toString();
  return searchString ? `?${searchString}` : '';
}

/**
 * Create a parameter editing context
 */
export function createParamEditContext(
  currentParams: Record<string, string>,
  currentSearch: string
): RouteParamEditContext {
  return {
    currentParams: { ...currentParams },
    currentSearch: new URLSearchParams(currentSearch.startsWith('?') ? currentSearch.slice(1) : currentSearch),
    isEditing: false,
    pendingParams: { ...currentParams },
    pendingSearch: currentSearch,
    errors: {}
  };
}

/**
 * Update parameter editing context with new values
 */
export function updateParamEditContext(
  context: RouteParamEditContext,
  updates: Partial<{
    pendingParams: Record<string, string>;
    pendingSearch: string;
    isEditing: boolean;
  }>
): RouteParamEditContext {
  const updatedContext = { ...context, ...updates };
  
  // Validate parameters if they were updated
  if (updates.pendingParams) {
    updatedContext.errors = {
      ...updatedContext.errors,
      ...validateParams(updates.pendingParams)
    };
  }
  
  // Validate search if it was updated
  if (updates.pendingSearch !== undefined) {
    const searchError = validateSearch(updates.pendingSearch);
    if (searchError) {
      updatedContext.errors = {
        ...updatedContext.errors,
        search: searchError
      };
    } else {
      // Remove search error if validation passes
      const { search, ...otherErrors } = updatedContext.errors;
      updatedContext.errors = otherErrors;
    }
  }
  
  return updatedContext;
}

/**
 * Check if parameter editing context has any errors
 */
export function hasParamErrors(context: RouteParamEditContext): boolean {
  return Object.keys(context.errors).length > 0;
}

/**
 * Get formatted error message for display
 */
export function getParamErrorMessage(
  context: RouteParamEditContext,
  paramName?: string
): string | null {
  if (paramName) {
    return context.errors[paramName] || null;
  }
  
  const errorMessages = Object.entries(context.errors).map(
    ([key, message]) => `${key}: ${message}`
  );
  
  return errorMessages.length > 0 ? errorMessages.join(', ') : null;
}

/**
 * Common parameter validators
 */
export const commonValidators = {
  /**
   * Validate numeric parameter
   */
  numeric: (value: string): string | null => {
    if (!/^\d+$/.test(value)) {
      return 'Must be a number';
    }
    return null;
  },
  
  /**
   * Validate UUID parameter
   */
  uuid: (value: string): string | null => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return 'Must be a valid UUID';
    }
    return null;
  },
  
  /**
   * Validate slug parameter (URL-safe string)
   */
  slug: (value: string): string | null => {
    if (!/^[a-z0-9-]+$/.test(value)) {
      return 'Must be lowercase letters, numbers, and hyphens only';
    }
    return null;
  },
  
  /**
   * Validate required parameter (non-empty)
   */
  required: (value: string): string | null => {
    if (!value.trim()) {
      return 'This parameter is required';
    }
    return null;
  },
  
  /**
   * Validate minimum length
   */
  minLength: (min: number) => (value: string): string | null => {
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },
  
  /**
   * Validate maximum length
   */
  maxLength: (max: number) => (value: string): string | null => {
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  }
};