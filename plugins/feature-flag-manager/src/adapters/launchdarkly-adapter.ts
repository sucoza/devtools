import { FeatureFlag, ProviderConfig, Environment } from '../types';

export class LaunchDarklyAdapter {
  private client: any = null;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async initialize(): Promise<any> {
    // In a real implementation, this would initialize the LaunchDarkly client
    // For demo purposes, we'll simulate the client
    this.client = {
      allFlags: () => this.mockLaunchDarklyFlags(),
      close: () => Promise.resolve(),
      initialized: true
    };

    return this.client;
  }

  setClient(client: any): void {
    this.client = client;
  }

  async getFlags(): Promise<FeatureFlag[]> {
    if (!this.client) {
      throw new Error('LaunchDarkly client not initialized');
    }

    try {
      // In a real implementation, this would call the actual LaunchDarkly API
      const ldFlags = this.mockLaunchDarklyFlags();
      return this.transformLaunchDarklyFlags(ldFlags);
    } catch (error) {
      console.error('Failed to fetch flags from LaunchDarkly:', error);
      throw error;
    }
  }

  private mockLaunchDarklyFlags(): any {
    // Mock LaunchDarkly flag structure for demo
    return {
      'ld-new-checkout': {
        key: 'ld-new-checkout',
        version: 1,
        on: true,
        prerequisites: [],
        targets: [],
        rules: [],
        fallthrough: { variation: 0 },
        offVariation: 1,
        variations: [true, false],
        debugEventsUntilDate: null,
        deleted: false,
        trackEvents: true,
        trackEventsFallthrough: false,
        clientSide: false
      },
      'ld-beta-features': {
        key: 'ld-beta-features',
        version: 2,
        on: false,
        prerequisites: [],
        targets: [],
        rules: [
          {
            variation: 0,
            id: 'rule-1',
            clauses: [
              {
                attribute: 'segmentMatch',
                op: 'segmentMatch',
                values: ['beta-users'],
                negate: false
              }
            ],
            trackEvents: false
          }
        ],
        fallthrough: { variation: 1 },
        offVariation: 1,
        variations: ['enabled', 'disabled'],
        debugEventsUntilDate: null,
        deleted: false,
        trackEvents: false,
        trackEventsFallthrough: false,
        clientSide: true
      }
    };
  }

  private transformLaunchDarklyFlags(ldFlags: any): FeatureFlag[] {
    const flags: FeatureFlag[] = [];

    Object.entries(ldFlags).forEach(([key, ldFlag]: [string, any]) => {
      const flag: FeatureFlag = {
        id: key,
        name: this.formatFlagName(key),
        description: `LaunchDarkly flag: ${key}`,
        enabled: ldFlag.on,
        type: this.inferFlagType(ldFlag.variations),
        value: this.getCurrentValue(ldFlag),
        environment: (this.config.environmentId as Environment) || 'development',
        tags: ['launchdarkly'],
        createdAt: new Date(), // LaunchDarkly doesn't provide creation date in this format
        updatedAt: new Date(),
        
        // Transform variations if present
        variants: this.transformVariations(ldFlag),
        
        // Transform targeting rules
        targeting: this.transformRules(ldFlag),
        
        // Add provider metadata
        providerMetadata: {
          provider: 'launchdarkly',
          version: ldFlag.version,
          trackEvents: ldFlag.trackEvents,
          clientSide: ldFlag.clientSide,
          prerequisites: ldFlag.prerequisites || []
        }
      };

      flags.push(flag);
    });

    return flags;
  }

  private formatFlagName(key: string): string {
    return key
      .replace(/^ld-/, '') // Remove ld- prefix
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private inferFlagType(variations: any[]): 'boolean' | 'string' | 'number' | 'json' | 'multivariate' {
    if (!variations || variations.length === 0) return 'boolean';
    
    if (variations.length === 2 && 
        variations.every(v => typeof v === 'boolean')) {
      return 'boolean';
    }
    
    if (variations.length > 2) return 'multivariate';
    
    const firstType = typeof variations[0];
    if (firstType === 'string') return 'string';
    if (firstType === 'number') return 'number';
    if (firstType === 'object') return 'json';
    
    return 'multivariate';
  }

  private getCurrentValue(ldFlag: any): any {
    if (!ldFlag.on) {
      return ldFlag.offVariation !== undefined 
        ? ldFlag.variations[ldFlag.offVariation] 
        : false;
    }
    
    if (ldFlag.fallthrough && ldFlag.fallthrough.variation !== undefined) {
      return ldFlag.variations[ldFlag.fallthrough.variation];
    }
    
    return ldFlag.variations?.[0] ?? false;
  }

  private transformVariations(ldFlag: any): any[] | undefined {
    if (!ldFlag.variations || ldFlag.variations.length <= 2) return undefined;
    
    return ldFlag.variations.map((variation: any, index: number) => ({
      id: `variant-${index}`,
      name: `Variant ${index + 1}`,
      value: variation,
      weight: Math.floor(100 / ldFlag.variations.length), // Equal distribution for demo
      description: `LaunchDarkly variation ${index}`
    }));
  }

  private transformRules(ldFlag: any): any | undefined {
    if (!ldFlag.rules || ldFlag.rules.length === 0) return undefined;
    
    const rules = ldFlag.rules.map((rule: any, index: number) => {
      const clauses = rule.clauses || [];
      return {
        id: rule.id || `rule-${index}`,
        attribute: clauses[0]?.attribute || 'userId',
        operator: this.mapLaunchDarklyOperator(clauses[0]?.op || 'in'),
        values: clauses[0]?.values || [],
        enabled: true
      };
    });

    return { rules };
  }

  private mapLaunchDarklyOperator(ldOp: string): string {
    const operatorMap: Record<string, string> = {
      'in': 'in',
      'contains': 'contains',
      'startsWith': 'contains',
      'endsWith': 'contains',
      'matches': 'contains',
      'greaterThan': 'greater_than',
      'lessThan': 'less_than',
      'greaterThanOrEqual': 'greater_than',
      'lessThanOrEqual': 'less_than',
      'segmentMatch': 'in'
    };

    return operatorMap[ldOp] || 'equals';
  }

  async cleanup(): Promise<void> {
    if (this.client && typeof this.client.close === 'function') {
      await this.client.close();
    }
    this.client = null;
  }
}