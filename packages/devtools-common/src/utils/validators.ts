/**
 * Common validation utilities for all TanStack DevTools plugins
 */

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate number within range
 */
export function validateNumberRange(
  value: number, 
  min?: number, 
  max?: number
): ValidationResult {
  const errors: string[] = [];

  if (isNaN(value)) {
    errors.push('Value must be a number');
  }

  if (min !== undefined && value < min) {
    errors.push(`Value must be at least ${min}`);
  }

  if (max !== undefined && value > max) {
    errors.push(`Value must be at most ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength?: number,
  maxLength?: number
): ValidationResult {
  const errors: string[] = [];

  if (minLength !== undefined && value.length < minLength) {
    errors.push(`Must be at least ${minLength} characters`);
  }

  if (maxLength !== undefined && value.length > maxLength) {
    errors.push(`Must be at most ${maxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate required fields in object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): ValidationResult {
  const errors: string[] = [];

  requiredFields.forEach(field => {
    const value = obj[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`${String(field)} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate JSON string
 */
export function validateJSON(jsonString: string): ValidationResult {
  try {
    JSON.parse(jsonString);
    return { isValid: true, errors: [] };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Validate regex pattern
 */
export function validateRegex(pattern: string): ValidationResult {
  try {
    new RegExp(pattern);
    return { isValid: true, errors: [] };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Invalid regex: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Validate configuration object against schema
 */
export function validateConfig<T>(
  config: T,
  schema: ValidationSchema<T>
): ValidationResult {
  const errors: string[] = [];

  Object.entries(schema).forEach(([key, rules]) => {
    const value = (config as any)[key];
    const fieldErrors = validateField(value, rules as FieldValidationRules);
    errors.push(...fieldErrors.map(error => `${key}: ${error}`));
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

export interface FieldValidationRules {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => string | null;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: FieldValidationRules;
};

function validateField(value: any, rules: FieldValidationRules): string[] {
  const errors: string[] = [];

  // Required check
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push('is required');
    return errors; // Don't continue validation if required field is missing
  }

  // Skip further validation if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return errors;
  }

  // Type check
  if (rules.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rules.type) {
      errors.push(`must be of type ${rules.type}`);
    }
  }

  // Number range validation
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`must be at most ${rules.max}`);
    }
  }

  // String length validation
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push(`must be at least ${rules.minLength} characters`);
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push(`must be at most ${rules.maxLength} characters`);
    }
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string') {
    if (!rules.pattern.test(value)) {
      errors.push('format is invalid');
    }
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(value)) {
    errors.push(`must be one of: ${rules.enum.join(', ')}`);
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return errors;
}