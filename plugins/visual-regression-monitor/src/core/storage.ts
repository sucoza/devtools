import type { 
  Screenshot, 
  VisualDiff, 
  TestSuite, 
  VisualRegressionSettings,
  ExportData
} from '../types';
import { compressString, decompressString } from '../utils';

const STORAGE_KEYS = {
  SCREENSHOTS: 'visual-regression:screenshots',
  VISUAL_DIFFS: 'visual-regression:diffs',
  TEST_SUITES: 'visual-regression:suites',
  SETTINGS: 'visual-regression:settings',
  VERSION: 'visual-regression:version',
} as const;

const CURRENT_VERSION = '1.0.0';

/**
 * Storage engine for persisting visual regression data
 */
export class StorageEngine {
  private isLocalStorageAvailable: boolean;

  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
  }

  /**
   * Check if localStorage is available
   */
  private checkLocalStorageAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get item from storage with error handling
   */
  private getItem(key: string): string | null {
    if (!this.isLocalStorageAvailable) {
      return null;
    }
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item from storage: ${key}`, error);
      return null;
    }
  }

  /**
   * Set item in storage with error handling
   */
  private setItem(key: string, value: string): boolean {
    if (!this.isLocalStorageAvailable) {
      return false;
    }
    
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set item in storage: ${key}`, error);
      // Try to free up space by removing old data
      this.cleanup();
      
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (secondError) {
        console.error(`Failed to set item in storage after cleanup: ${key}`, secondError);
        return false;
      }
    }
  }

  /**
   * Remove item from storage
   */
  private removeItem(key: string): void {
    if (!this.isLocalStorageAvailable) {
      return;
    }
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item from storage: ${key}`, error);
    }
  }

  /**
   * Parse JSON with error handling
   */
  private parseJSON<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to parse JSON from storage:', error);
      return defaultValue;
    }
  }

  /**
   * Stringify JSON with compression
   */
  private stringifyJSON(data: unknown, compress: boolean = false): string {
    try {
      const json = JSON.stringify(data);
      return compress ? compressString(json) : json;
    } catch (error) {
      console.error('Failed to stringify JSON for storage:', error);
      return '{}';
    }
  }

  /**
   * Load screenshots from storage
   */
  loadScreenshots(): Record<string, Screenshot> {
    const data = this.getItem(STORAGE_KEYS.SCREENSHOTS);
    if (!data) {
      return {};
    }
    
    const decompressed = decompressString(data);
    return this.parseJSON(decompressed, {});
  }

  /**
   * Save screenshots to storage
   */
  saveScreenshots(screenshots: Record<string, Screenshot>): void {
    const json = this.stringifyJSON(screenshots, true);
    this.setItem(STORAGE_KEYS.SCREENSHOTS, json);
  }

  /**
   * Load visual diffs from storage
   */
  loadVisualDiffs(): Record<string, VisualDiff> {
    const data = this.getItem(STORAGE_KEYS.VISUAL_DIFFS);
    if (!data) {
      return {};
    }
    
    const decompressed = decompressString(data);
    return this.parseJSON(decompressed, {});
  }

  /**
   * Save visual diffs to storage
   */
  saveVisualDiffs(diffs: Record<string, VisualDiff>): void {
    const json = this.stringifyJSON(diffs, true);
    this.setItem(STORAGE_KEYS.VISUAL_DIFFS, json);
  }

  /**
   * Load test suites from storage
   */
  loadTestSuites(): Record<string, TestSuite> {
    const data = this.getItem(STORAGE_KEYS.TEST_SUITES);
    if (!data) {
      return {};
    }
    
    return this.parseJSON(data, {});
  }

  /**
   * Save test suites to storage
   */
  saveTestSuites(suites: Record<string, TestSuite>): void {
    const json = this.stringifyJSON(suites);
    this.setItem(STORAGE_KEYS.TEST_SUITES, json);
  }

  /**
   * Load settings from storage
   */
  loadSettings(): Partial<VisualRegressionSettings> {
    const data = this.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      return {};
    }
    
    return this.parseJSON(data, {});
  }

  /**
   * Save settings to storage
   */
  saveSettings(settings: VisualRegressionSettings): void {
    const json = this.stringifyJSON(settings);
    this.setItem(STORAGE_KEYS.SETTINGS, json);
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; total: number } {
    if (!this.isLocalStorageAvailable) {
      return { used: 0, available: 0, total: 0 };
    }
    
    try {
      let used = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('visual-regression:')) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }
      
      // Rough estimate of localStorage limit (usually 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB
      const available = total - used;
      
      return { used, available, total };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }

  /**
   * Cleanup old data to free up space
   */
  cleanup(): void {
    try {
      // Remove old screenshots (keep only last 100)
      const screenshots = this.loadScreenshots();
      const screenshotEntries = Object.entries(screenshots)
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(0, 100);
      
      if (screenshotEntries.length > 0) {
        const cleanedScreenshots = Object.fromEntries(screenshotEntries);
        this.saveScreenshots(cleanedScreenshots);
      }
      
      // Remove old diffs (keep only last 50)
      const diffs = this.loadVisualDiffs();
      const diffEntries = Object.entries(diffs)
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(0, 50);
      
      if (diffEntries.length > 0) {
        const cleanedDiffs = Object.fromEntries(diffEntries);
        this.saveVisualDiffs(cleanedDiffs);
      }
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }

  /**
   * Export all data
   */
  exportData(): ExportData {
    const screenshots = Object.values(this.loadScreenshots());
    const diffs = Object.values(this.loadVisualDiffs());
    const suites = Object.values(this.loadTestSuites());
    const settings = this.loadSettings();
    
    return {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      screenshots,
      diffs,
      suites,
      settings: settings as VisualRegressionSettings,
    };
  }

  /**
   * Import data
   */
  importData(data: ExportData): boolean {
    try {
      // Validate data version
      if (data.version !== CURRENT_VERSION) {
        console.warn(`Version mismatch: expected ${CURRENT_VERSION}, got ${data.version}`);
      }
      
      // Convert arrays back to records
      const screenshots = Object.fromEntries(
        data.screenshots.map(screenshot => [screenshot.id, screenshot])
      );
      const diffs = Object.fromEntries(
        data.diffs.map(diff => [diff.id, diff])
      );
      const suites = Object.fromEntries(
        data.suites.map(suite => [suite.id, suite])
      );
      
      // Save imported data
      this.saveScreenshots(screenshots);
      this.saveVisualDiffs(diffs);
      this.saveTestSuites(suites);
      this.saveSettings(data.settings);
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Migrate data from older versions
   */
  migrate(): void {
    const version = this.getItem(STORAGE_KEYS.VERSION);
    
    if (!version || version !== CURRENT_VERSION) {
      // Migrating visual regression data
      
      // Add migration logic here if needed for future versions
      // For now, just update the version
      this.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    }
  }

  /**
   * Check if storage has data
   */
  hasData(): boolean {
    const screenshots = this.getItem(STORAGE_KEYS.SCREENSHOTS);
    const diffs = this.getItem(STORAGE_KEYS.VISUAL_DIFFS);
    const suites = this.getItem(STORAGE_KEYS.TEST_SUITES);
    
    return !!(screenshots || diffs || suites);
  }
}

// Singleton instance
let storageEngineInstance: StorageEngine | null = null;

export function getStorageEngine(): StorageEngine {
  if (!storageEngineInstance) {
    storageEngineInstance = new StorageEngine();
    storageEngineInstance.migrate();
  }
  return storageEngineInstance;
}