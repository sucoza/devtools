import { useState, useCallback, useEffect } from 'react';

export interface UseSettingsOptions<T> {
  initialSettings: T;
  storageKey?: string;
  onSettingsChange?: (settings: T) => void;
  validateSettings?: (settings: T) => boolean;
}

export interface UseSettingsReturn<T> {
  settings: T;
  updateSetting: (key: keyof T, value: any) => void;
  updateSettings: (updates: Partial<T>) => void;
  resetSettings: () => void;
  isValid: boolean;
}

/**
 * Shared settings management hook for all DevTools plugins
 * Provides consistent settings state with validation and persistence
 */
export function useSettings<T extends Record<string, any>>({
  initialSettings,
  storageKey,
  onSettingsChange,
  validateSettings
}: UseSettingsOptions<T>): UseSettingsReturn<T> {
  
  // Load settings from localStorage if available
  const loadStoredSettings = useCallback((): T => {
    if (!storageKey || typeof window === 'undefined') {
      return initialSettings;
    }
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedSettings = { ...initialSettings, ...JSON.parse(stored) };
        return validateSettings?.(parsedSettings) ? parsedSettings : initialSettings;
      }
    } catch (error) {
      console.warn(`Failed to load settings from localStorage:`, error);
    }
    
    return initialSettings;
  }, [initialSettings, storageKey, validateSettings]);

  const [settings, setSettings] = useState<T>(loadStoredSettings);

  // Validate current settings
  const isValid = validateSettings ? validateSettings(settings) : true;

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: T) => {
    if (!storageKey || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
    } catch (error) {
      console.warn(`Failed to save settings to localStorage:`, error);
    }
  }, [storageKey]);

  // Update single setting
  const updateSetting = useCallback((key: keyof T, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Validate if validator provided
      if (validateSettings && !validateSettings(newSettings)) {
        console.warn(`Invalid settings update rejected:`, { [key]: value });
        return prev;
      }
      
      saveSettings(newSettings);
      onSettingsChange?.(newSettings);
      return newSettings;
    });
  }, [saveSettings, onSettingsChange, validateSettings]);

  // Update multiple settings
  const updateSettings = useCallback((updates: Partial<T>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      
      // Validate if validator provided
      if (validateSettings && !validateSettings(newSettings)) {
        console.warn(`Invalid settings update rejected:`, updates);
        return prev;
      }
      
      saveSettings(newSettings);
      onSettingsChange?.(newSettings);
      return newSettings;
    });
  }, [saveSettings, onSettingsChange, validateSettings]);

  // Reset to initial settings
  const resetSettings = useCallback(() => {
    setSettings(initialSettings);
    saveSettings(initialSettings);
    onSettingsChange?.(initialSettings);
  }, [initialSettings, saveSettings, onSettingsChange]);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    isValid
  };
}