/**
 * Custom error types for feature flag operations
 */

/**
 * Base error class for all feature flag errors
 */
export class FeatureFlagError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FeatureFlagError';
    Object.setPrototypeOf(this, FeatureFlagError.prototype);
  }
}

/**
 * Thrown when a flag is not found
 */
export class FlagNotFoundError extends FeatureFlagError {
  constructor(public flagId: string) {
    super(`Flag not found: ${flagId}`, 'FLAG_NOT_FOUND');
    this.name = 'FlagNotFoundError';
    Object.setPrototypeOf(this, FlagNotFoundError.prototype);
  }
}

/**
 * Thrown when a flag dependency is not satisfied
 */
export class DependencyNotSatisfiedError extends FeatureFlagError {
  constructor(
    public flagId: string,
    public dependencyFlagId: string,
    public reason: string
  ) {
    super(
      `Dependency not satisfied for flag "${flagId}": ${reason} (dependency: "${dependencyFlagId}")`,
      'DEPENDENCY_NOT_SATISFIED'
    );
    this.name = 'DependencyNotSatisfiedError';
    Object.setPrototypeOf(this, DependencyNotSatisfiedError.prototype);
  }
}

/**
 * Thrown when targeting rules are not matched
 */
export class TargetingNotMatchedError extends FeatureFlagError {
  constructor(
    public flagId: string,
    public reason: string
  ) {
    super(
      `Targeting not matched for flag "${flagId}": ${reason}`,
      'TARGETING_NOT_MATCHED'
    );
    this.name = 'TargetingNotMatchedError';
    Object.setPrototypeOf(this, TargetingNotMatchedError.prototype);
  }
}

/**
 * Thrown when evaluating a multivariate flag without variants
 */
export class InvalidVariantError extends FeatureFlagError {
  constructor(public flagId: string, message?: string) {
    super(
      message || `Invalid or missing variants for multivariate flag "${flagId}"`,
      'INVALID_VARIANT'
    );
    this.name = 'InvalidVariantError';
    Object.setPrototypeOf(this, InvalidVariantError.prototype);
  }
}

/**
 * Thrown when storage operations fail
 */
export class StorageError extends FeatureFlagError {
  constructor(
    public operation: 'read' | 'write' | 'delete' | 'clear',
    public key: string | null,
    public originalError?: Error
  ) {
    super(
      `Storage ${operation} failed${key ? ` for key "${key}"` : ''}${originalError ? `: ${originalError.message}` : ''}`,
      'STORAGE_ERROR'
    );
    this.name = 'StorageError';
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/**
 * Thrown when an invalid flag configuration is provided
 */
export class InvalidFlagConfigError extends FeatureFlagError {
  constructor(
    public flagId: string,
    public field: string,
    public reason: string
  ) {
    super(
      `Invalid flag configuration for "${flagId}": ${field} - ${reason}`,
      'INVALID_FLAG_CONFIG'
    );
    this.name = 'InvalidFlagConfigError';
    Object.setPrototypeOf(this, InvalidFlagConfigError.prototype);
  }
}
