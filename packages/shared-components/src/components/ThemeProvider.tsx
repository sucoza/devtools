import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme } from '../styles/plugin-styles';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * ThemeProvider component for managing light/dark theme in DevTools plugins
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="light">
 *   <YourPluginPanel />
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark',
  storageKey = 'devtools-theme',
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Try to load from localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(storageKey);
        if (stored === 'light' || stored === 'dark') {
          return stored;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return defaultTheme;
  });

  useEffect(() => {
    // Save to localStorage when theme changes
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, theme);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [theme, storageKey]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to access theme context
 *
 * @example
 * ```tsx
 * const { theme, setTheme, toggleTheme } = useTheme();
 * const colors = getColors(theme);
 * ```
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Optional hook that returns the current theme, or a default if no provider exists
 * Useful for plugins that want to support theming but don't require the provider
 *
 * @example
 * ```tsx
 * const theme = useThemeOptional();
 * const colors = getColors(theme);
 * ```
 */
export const useThemeOptional = (defaultTheme: Theme = 'dark'): Theme => {
  const context = useContext(ThemeContext);
  return context?.theme ?? defaultTheme;
};
