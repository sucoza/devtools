/**
 * Test type definitions for Vitest + Testing Library
 */

/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom/vitest';

declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {
    toBeInTheDocument(): T;
    toHaveClass(className: string): T;
    toHaveAttribute(attr: string, value?: string): T;
    toHaveTextContent(text: string | RegExp): T;
    toHaveFocus(): T;
    toBeVisible(): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
  }
}

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {
      toBeInTheDocument(): T;
      toHaveClass(className: string): T;
      toHaveAttribute(attr: string, value?: string): T;
      toHaveTextContent(text: string | RegExp): T;
      toHaveFocus(): T;
      toBeVisible(): T;
      toBeDisabled(): T;
      toBeEnabled(): T;
    }
  }
}