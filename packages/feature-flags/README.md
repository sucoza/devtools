# @sucoza/feature-flags

A powerful, standalone feature flag management library with evaluation engine, targeting, rollouts, and experiments support.

## Features

- 🎯 **Advanced Targeting** - User segments, attributes, and complex rules
- 🎲 **Percentage Rollouts** - Gradual feature releases with sticky assignments
- 🧪 **A/B Testing** - Multi-variant experiments with weighted distribution
- 🔗 **Flag Dependencies** - Chain flags together with conditional logic
- 💾 **Persistent Storage** - LocalStorage and memory adapters included
- 🔄 **Real-time Updates** - Event-driven architecture for live flag changes
- 📦 **Zero Dependencies** - Lightweight, framework-agnostic library
- 📝 **TypeScript First** - Full type safety and IntelliSense support

## Installation

```bash
npm install @sucoza/feature-flags
# or
yarn add @sucoza/feature-flags
# or
pnpm add @sucoza/feature-flags
```

## Quick Start

```typescript
import { FeatureFlagManager } from '@sucoza/feature-flags';

// Create a manager instance
const flags = new FeatureFlagManager({
  defaultContext: {
    userId: 'user-123',
    environment: 'production'
  }
});

// Add feature flags
flags.addFlag({
  id: 'new-feature',
  name: 'New Feature',
  type: 'boolean',
  value: true,
  enabled: true,
  rollout: {
    percentage: 50,
    stickiness: 'userId'
  }
});

// Evaluate a flag
const evaluation = await flags.evaluate('new-feature');
console.log(evaluation.value); // true or false based on rollout
```

## Core Concepts

### Feature Flags

```typescript
const flag = {
  id: 'premium-features',
  name: 'Premium Features',
  type: 'boolean',
  value: true,
  enabled: true,
  tags: ['frontend', 'monetization'],
  environments: ['production', 'staging']
};

flags.addFlag(flag);
```

### Evaluation Context

```typescript
// Set user context for evaluations
flags.setContext({
  userId: 'user-456',
  sessionId: 'session-789',
  userSegment: 'premium',
  attributes: {
    plan: 'enterprise',
    region: 'us-west',
    beta: true
  }
});
```

### Targeting Rules

```typescript
const targetedFlag = {
  id: 'beta-feature',
  name: 'Beta Feature',
  type: 'boolean',
  value: true,
  enabled: true,
  targeting: {
    userSegments: ['beta-testers'],
    rules: [
      {
        id: 'region-rule',
        attribute: 'attributes.region',
        operator: 'in',
        values: ['us-west', 'us-east'],
        enabled: true
      }
    ]
  }
};
```

### Percentage Rollouts

```typescript
const rolloutFlag = {
  id: 'gradual-rollout',
  name: 'Gradual Rollout Feature',
  type: 'boolean',
  value: true,
  enabled: true,
  rollout: {
    percentage: 25, // 25% of users
    stickiness: 'userId' // Consistent per user
  }
};
```

### Multi-Variant Experiments

```typescript
const experiment = {
  id: 'button-color',
  name: 'Button Color Test',
  type: 'multivariate',
  enabled: true,
  variants: [
    { id: 'control', name: 'Blue', value: '#0066cc', weight: 33 },
    { id: 'variant-a', name: 'Green', value: '#00aa00', weight: 33 },
    { id: 'variant-b', name: 'Red', value: '#cc0000', weight: 34 }
  ]
};

flags.addFlag(experiment);
const result = await flags.evaluate('button-color');
console.log(result.variant); // Selected variant with value
```

### Flag Dependencies

```typescript
const dependentFlag = {
  id: 'advanced-feature',
  name: 'Advanced Feature',
  type: 'boolean',
  value: true,
  enabled: true,
  dependencies: [
    {
      flagId: 'premium-features',
      condition: 'enabled'
    },
    {
      flagId: 'user-limit',
      condition: 'equals',
      value: 'unlimited'
    }
  ]
};
```

## API Reference

### FeatureFlagManager

#### Constructor Options

```typescript
interface FeatureFlagManagerOptions {
  storage?: StorageAdapter;        // Storage adapter (default: LocalStorage)
  defaultContext?: EvaluationContext; // Default evaluation context
  persistOverrides?: boolean;      // Persist flag overrides (default: true)
  autoRefresh?: boolean;           // Auto-refresh flags (default: false)
  refreshInterval?: number;        // Refresh interval in ms (default: 30000)
}
```

#### Methods

| Method | Description |
|--------|-------------|
| `setFlags(flags: FeatureFlag[])` | Set all feature flags |
| `addFlag(flag: FeatureFlag)` | Add a single flag |
| `updateFlag(flag: FeatureFlag)` | Update an existing flag |
| `removeFlag(flagId: string)` | Remove a flag |
| `getFlag(id: string)` | Get a specific flag |
| `getAllFlags()` | Get all flags |
| `evaluate(flagId: string, context?)` | Evaluate a flag |
| `evaluateAll(context?)` | Evaluate all flags |
| `setOverride(override: FlagOverride)` | Set a flag override |
| `removeOverride(flagId: string)` | Remove an override |
| `clearAllOverrides()` | Clear all overrides |
| `setContext(context: EvaluationContext)` | Set evaluation context |
| `getContext()` | Get current context |
| `on(event: string, listener: Function)` | Subscribe to events |
| `off(event: string, listener: Function)` | Unsubscribe from events |
| `destroy()` | Clean up resources |

### Events

```typescript
// Subscribe to flag events
flags.on('flag-updated', (flag) => {
  console.log('Flag updated:', flag);
});

flags.on('flag-evaluated', ({ flagId, evaluation, context }) => {
  console.log('Flag evaluated:', flagId, evaluation);
});

flags.on('context-updated', (context) => {
  console.log('Context changed:', context);
});
```

Available events:
- `flags-updated` - All flags updated
- `flag-added` - Single flag added
- `flag-updated` - Single flag updated
- `flag-removed` - Flag removed
- `flag-evaluated` - Flag evaluation completed
- `override-set` - Override applied
- `override-removed` - Override removed
- `overrides-cleared` - All overrides cleared
- `context-updated` - Evaluation context changed
- `segments-updated` - User segments updated
- `experiments-updated` - Experiments updated

## Storage Adapters

### LocalStorage Adapter (Default)

```typescript
import { LocalStorageAdapter } from '@sucoza/feature-flags';

const storage = new LocalStorageAdapter('my-app-flags');
const flags = new FeatureFlagManager({ storage });
```

### Memory Adapter

```typescript
import { MemoryStorageAdapter } from '@sucoza/feature-flags';

const storage = new MemoryStorageAdapter();
const flags = new FeatureFlagManager({ storage });
```

### Custom Adapter

```typescript
import { StorageAdapter } from '@sucoza/feature-flags';

class CustomAdapter implements StorageAdapter {
  getItem<T>(key: string): T | null {
    // Your implementation
  }
  
  setItem(key: string, value: any): void {
    // Your implementation
  }
  
  removeItem(key: string): void {
    // Your implementation
  }
  
  clear(): void {
    // Your implementation
  }
  
  getAllKeys(): string[] {
    // Your implementation
  }
}
```

## Advanced Usage

### User Segments

```typescript
flags.setUserSegments([
  {
    id: 'premium-users',
    name: 'Premium Users',
    rules: [
      {
        attribute: 'plan',
        operator: 'in',
        values: ['premium', 'enterprise']
      }
    ]
  },
  {
    id: 'beta-testers',
    name: 'Beta Testers',
    rules: [
      {
        attribute: 'betaUser',
        operator: 'equals',
        values: [true]
      }
    ]
  }
]);
```

### Direct Evaluator Usage

```typescript
import { FlagEvaluator } from '@sucoza/feature-flags';

const evaluator = new FlagEvaluator({
  getFlag: (id) => myFlagStore.get(id),
  getOverride: (id) => myOverrideStore.get(id),
  getUserSegments: () => mySegments
});

const result = await evaluator.evaluate('my-flag', context);
```

## TypeScript Support

The library is written in TypeScript and provides comprehensive type definitions:

```typescript
import type {
  FeatureFlag,
  FlagEvaluation,
  EvaluationContext,
  FlagOverride,
  UserSegment,
  Experiment
} from '@sucoza/feature-flags';
```

## License

MIT © tyevco

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please use the [GitHub issues page](https://github.com/sucoza/feature-flags/issues).