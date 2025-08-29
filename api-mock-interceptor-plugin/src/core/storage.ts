import type { MockRule, MockScenario, ExportData, NetworkConditions } from '../types';

/**
 * Local storage persistence layer for mock configurations
 */
export class StorageEngine {
  private readonly STORAGE_KEYS = {
    MOCK_RULES: 'api-mock-interceptor:mock-rules',
    MOCK_SCENARIOS: 'api-mock-interceptor:mock-scenarios',
    ACTIVE_SCENARIO: 'api-mock-interceptor:active-scenario',
    NETWORK_CONDITIONS: 'api-mock-interceptor:network-conditions',
    SETTINGS: 'api-mock-interceptor:settings',
  };

  /**
   * Save mock rules to localStorage
   */
  saveMockRules(rules: Record<string, MockRule>): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.MOCK_RULES, JSON.stringify(rules));
    } catch (error) {
      console.error('Failed to save mock rules to localStorage:', error);
    }
  }

  /**
   * Load mock rules from localStorage
   */
  loadMockRules(): Record<string, MockRule> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.MOCK_RULES);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load mock rules from localStorage:', error);
      return {};
    }
  }

  /**
   * Save mock scenarios to localStorage
   */
  saveMockScenarios(scenarios: Record<string, MockScenario>): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.MOCK_SCENARIOS, JSON.stringify(scenarios));
    } catch (error) {
      console.error('Failed to save mock scenarios to localStorage:', error);
    }
  }

  /**
   * Load mock scenarios from localStorage
   */
  loadMockScenarios(): Record<string, MockScenario> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.MOCK_SCENARIOS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load mock scenarios from localStorage:', error);
      return {};
    }
  }

  /**
   * Save active scenario ID
   */
  saveActiveScenario(scenarioId: string | undefined): void {
    try {
      if (scenarioId) {
        localStorage.setItem(this.STORAGE_KEYS.ACTIVE_SCENARIO, scenarioId);
      } else {
        localStorage.removeItem(this.STORAGE_KEYS.ACTIVE_SCENARIO);
      }
    } catch (error) {
      console.error('Failed to save active scenario to localStorage:', error);
    }
  }

  /**
   * Load active scenario ID
   */
  loadActiveScenario(): string | undefined {
    try {
      return localStorage.getItem(this.STORAGE_KEYS.ACTIVE_SCENARIO) || undefined;
    } catch (error) {
      console.error('Failed to load active scenario from localStorage:', error);
      return undefined;
    }
  }

  /**
   * Save network conditions
   */
  saveNetworkConditions(conditions: NetworkConditions): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.NETWORK_CONDITIONS, JSON.stringify(conditions));
    } catch (error) {
      console.error('Failed to save network conditions to localStorage:', error);
    }
  }

  /**
   * Load network conditions
   */
  loadNetworkConditions(): NetworkConditions {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.NETWORK_CONDITIONS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load network conditions from localStorage:', error);
      return {};
    }
  }

  /**
   * Save general settings
   */
  saveSettings(settings: Record<string, any>): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  /**
   * Load general settings
   */
  loadSettings(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
      return {};
    }
  }

  /**
   * Export all configuration data
   */
  exportData(): ExportData {
    const rules = this.loadMockRules();
    const scenarios = this.loadMockScenarios();

    return {
      version: '1.0.0',
      timestamp: Date.now(),
      scenarios: Object.values(scenarios),
      rules: Object.values(rules),
    };
  }

  /**
   * Import configuration data
   */
  importData(data: ExportData): { success: boolean; error?: string; imported: { rules: number; scenarios: number } } {
    try {
      // Validate data structure
      if (!data.version || !Array.isArray(data.rules) || !Array.isArray(data.scenarios)) {
        return {
          success: false,
          error: 'Invalid import data format',
          imported: { rules: 0, scenarios: 0 },
        };
      }

      // Load current data
      const currentRules = this.loadMockRules();
      const currentScenarios = this.loadMockScenarios();

      // Merge imported rules (avoiding ID conflicts)
      let importedRulesCount = 0;
      data.rules.forEach(rule => {
        if (!currentRules[rule.id]) {
          currentRules[rule.id] = rule;
          importedRulesCount++;
        } else {
          // Generate new ID if conflict
          const newId = `${rule.id}-imported-${Date.now()}`;
          currentRules[newId] = { ...rule, id: newId };
          importedRulesCount++;
        }
      });

      // Merge imported scenarios (avoiding ID conflicts)
      let importedScenariosCount = 0;
      data.scenarios.forEach(scenario => {
        if (!currentScenarios[scenario.id]) {
          currentScenarios[scenario.id] = scenario;
          importedScenariosCount++;
        } else {
          // Generate new ID if conflict
          const newId = `${scenario.id}-imported-${Date.now()}`;
          currentScenarios[newId] = { ...scenario, id: newId };
          importedScenariosCount++;
        }
      });

      // Save merged data
      this.saveMockRules(currentRules);
      this.saveMockScenarios(currentScenarios);

      return {
        success: true,
        imported: {
          rules: importedRulesCount,
          scenarios: importedScenariosCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown import error',
        imported: { rules: 0, scenarios: 0 },
      };
    }
  }

  /**
   * Clear all stored data
   */
  clearAllData(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear storage data:', error);
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; total: number } {
    try {
      const used = new Blob(Object.values(this.STORAGE_KEYS).map(key => localStorage.getItem(key) || '')).size;
      
      // Estimate available storage (simplified calculation)
      const total = 5 * 1024 * 1024; // Assume 5MB localStorage limit
      const available = Math.max(0, total - used);

      return { used, available, total };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 5 * 1024 * 1024, total: 5 * 1024 * 1024 };
    }
  }

  /**
   * Check if localStorage is available
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = 'api-mock-interceptor:storage-test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let storageInstance: StorageEngine | null = null;

export function getStorageEngine(): StorageEngine {
  if (!storageInstance) {
    storageInstance = new StorageEngine();
  }
  return storageInstance;
}