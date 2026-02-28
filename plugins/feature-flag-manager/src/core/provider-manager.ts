import { 
  ProviderSettings, 
  FeatureFlag, 
  FlagProvider 
} from '../types';
import { FeatureFlagDevToolsStore } from './devtools-store';
import { LaunchDarklyAdapter } from '../adapters/launchdarkly-adapter';
import { CustomProviderAdapter } from '../adapters/custom-provider-adapter';

export class ProviderManager {
  private providers: Map<string, FlagProvider> = new Map();
  private adapters: Map<string, any> = new Map();

  constructor(private store: FeatureFlagDevToolsStore) {
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    this.adapters.set('launchdarkly', LaunchDarklyAdapter);
    this.adapters.set('custom', CustomProviderAdapter);
  }

  async addProvider(settings: ProviderSettings): Promise<void> {
    try {
      const AdapterClass = this.adapters.get(settings.type);
      if (!AdapterClass) {
        throw new Error(`Unsupported provider type: ${settings.type}`);
      }

      const adapter = new AdapterClass(settings.config);
      const client = await adapter.initialize();

      const provider: FlagProvider = {
        name: settings.name,
        type: settings.type,
        config: settings.config,
        client
      };

      this.providers.set(settings.name, provider);

      // Load flags from provider
      await this.loadFlagsFromProvider(settings.name);

      // Update settings
      const currentSettings = this.store.getState().settings;
      const providerExists = currentSettings.providers.some(p => p.name === settings.name);
      
      if (!providerExists) {
        const updatedProviders = [...currentSettings.providers, settings];
        this.store.updateSettings({ providers: updatedProviders });
      }

    } catch (error) {
      console.error(`Failed to add provider ${settings.name}:`, error);
      throw error;
    }
  }

  async removeProvider(name: string): Promise<void> {
    try {
      const provider = this.providers.get(name);
      if (provider) {
        // Cleanup provider client if needed
        if (provider.client && typeof provider.client.cleanup === 'function') {
          await provider.client.cleanup();
        }
        
        this.providers.delete(name);

        // Update settings
        const currentSettings = this.store.getState().settings;
        const updatedProviders = currentSettings.providers.filter(p => p.name !== name);
        this.store.updateSettings({ providers: updatedProviders });
      }
    } catch (error) {
      console.error(`Failed to remove provider ${name}:`, error);
      throw error;
    }
  }

  async loadFlagsFromProvider(providerName: string): Promise<void> {
    try {
      const provider = this.providers.get(providerName);
      if (!provider) {
        throw new Error(`Provider ${providerName} not found`);
      }

      const AdapterClass = this.adapters.get(provider.type);
      if (!AdapterClass) {
        throw new Error(`No adapter found for provider type: ${provider.type}`);
      }

      const adapter = new AdapterClass(provider.config);
      adapter.setClient(provider.client);

      const flags = await adapter.getFlags();
      
      // Merge with existing flags
      const existingFlags = this.store.getFlags();
      const mergedFlags = this.mergeFlags(existingFlags, flags);
      
      this.store.setFlags(mergedFlags);

    } catch (error) {
      console.error(`Failed to load flags from provider ${providerName}:`, error);
      throw error;
    }
  }

  async refreshAllProviders(): Promise<void> {
    const refreshPromises = Array.from(this.providers.keys()).map(name => 
      this.loadFlagsFromProvider(name).catch(error => {
        console.error(`Failed to refresh provider ${name}:`, error);
      })
    );

    await Promise.all(refreshPromises);
  }

  private mergeFlags(existingFlags: FeatureFlag[], providerFlags: FeatureFlag[]): FeatureFlag[] {
    const flagMap = new Map<string, FeatureFlag>();
    
    // Add existing flags
    existingFlags.forEach(flag => {
      flagMap.set(flag.id, flag);
    });

    // Merge or add provider flags
    providerFlags.forEach(providerFlag => {
      const existingFlag = flagMap.get(providerFlag.id);
      if (existingFlag) {
        // Merge flags, preferring provider data for core properties
        const mergedFlag: FeatureFlag = {
          ...existingFlag,
          ...providerFlag,
          // Preserve local overrides and DevTools-specific data
          tags: [...new Set([...existingFlag.tags, ...providerFlag.tags])],
          updatedAt: new Date()
        };
        flagMap.set(providerFlag.id, mergedFlag);
      } else {
        flagMap.set(providerFlag.id, providerFlag);
      }
    });

    return Array.from(flagMap.values());
  }

  getProvider(name: string): FlagProvider | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): FlagProvider[] {
    return Array.from(this.providers.values());
  }

  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  async syncFlag(flagId: string, providerName?: string): Promise<void> {
    if (providerName) {
      await this.loadFlagsFromProvider(providerName);
    } else {
      // Sync with all providers
      await this.refreshAllProviders();
    }
  }

  cleanup(): void {
    // Cleanup all providers - fire cleanup calls then clear synchronously
    const cleanupPromises: Promise<void>[] = [];
    for (const provider of this.providers.values()) {
      if (provider.client && typeof provider.client.cleanup === 'function') {
        cleanupPromises.push(
          provider.client.cleanup().catch((error: unknown) => {
            console.error(`Error cleaning up provider ${provider.name}:`, error);
          })
        );
      }
    }
    this.providers.clear();

    // Best-effort: wait for all cleanup promises (callers can't await void, but
    // at least individual failures are caught above)
    if (cleanupPromises.length > 0) {
      Promise.all(cleanupPromises).catch(() => {
        // individual errors already logged above
      });
    }
  }
}