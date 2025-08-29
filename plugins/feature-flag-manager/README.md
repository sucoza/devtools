# Feature Flag Manager DevTools Plugin

A comprehensive TanStack DevTools plugin for managing and testing feature flags at runtime during development. This plugin provides a powerful interface for controlling feature flags, testing A/B experiments, simulating user segments, and monitoring flag evaluations in real-time.

![Feature Flag Manager Demo](https://via.placeholder.com/800x400?text=Feature+Flag+Manager+Demo)

## ✨ Features

### 🎛️ **Real-time Flag Management**
- **Dashboard Overview**: Visual summary of all feature flags with their current states
- **Interactive Controls**: Toggle boolean flags, switch between variants, and set custom values
- **Override System**: Local overrides with persistence across browser sessions
- **Instant Updates**: See changes reflected immediately in your application

### 🧪 **A/B Testing & Experimentation**
- **Variant Switcher**: Easily switch between different test variations
- **Experiment Metrics**: Track conversion rates and performance metrics
- **Statistical Analysis**: View significance levels and confidence intervals
- **Rollout Controls**: Adjust percentage-based rollouts and targeting rules

### 👥 **User Segmentation**
- **Segment Simulator**: Test how flags behave for different user types
- **Context Management**: Simulate different user attributes and environments
- **Targeting Rules**: Visualize and test complex targeting conditions
- **Quick Personas**: Switch between predefined user personas instantly

### 📊 **Monitoring & Analytics**
- **Evaluation History**: Track all flag evaluations with detailed context
- **Dependency Visualization**: Understand flag dependencies and relationships
- **Performance Metrics**: Monitor flag evaluation performance
- **Event Timeline**: See a chronological view of all flag changes

### 🔌 **Provider Integration**
- **LaunchDarkly**: Built-in adapter for LaunchDarkly integration
- **Custom APIs**: Connect to your own feature flag service
- **Multiple Providers**: Support for multiple flag providers simultaneously
- **Real-time Sync**: Keep flags synchronized with external services

## 🚀 Quick Start

### Installation

```bash
npm install @sucoza/feature-flag-manager-devtools-plugin
```

### Basic Usage

```tsx
import React from 'react';
import { 
  FeatureFlagManagerPanel, 
  createFeatureFlagDevToolsClient 
} from '@sucoza/feature-flag-manager-devtools-plugin';

// Create a client instance
const client = createFeatureFlagDevToolsClient();

function App() {
  return (
    <div>
      {/* Your application content */}
      <main>
        {/* Feature flag controlled components */}
      </main>

      {/* DevTools Panel */}
      <FeatureFlagManagerPanel 
        client={client} 
        defaultTab="dashboard"
        height={600}
      />
    </div>
  );
}
```

### Using the React Hook

```tsx
import React from 'react';
import { useFeatureFlagManager } from '@sucoza/feature-flag-manager-devtools-plugin';

function MyComponent() {
  const { 
    evaluateFlag, 
    toggleFlag, 
    setContext,
    state,
    isReady 
  } = useFeatureFlagManager({
    initialContext: {
      userId: 'user-123',
      userSegment: 'beta-users',
      attributes: {
        plan: 'premium',
        region: 'us-east-1'
      }
    }
  });

  const [showNewFeature, setShowNewFeature] = React.useState(false);

  React.useEffect(() => {
    if (!isReady) return;
    
    evaluateFlag('new-feature-flag').then(value => {
      setShowNewFeature(!!value);
    });
  }, [isReady, evaluateFlag, state]);

  const handleToggleFeature = () => {
    toggleFlag('new-feature-flag');
  };

  if (!isReady) return <div>Loading...</div>;

  return (
    <div>
      {showNewFeature && <NewFeatureComponent />}
      <button onClick={handleToggleFeature}>
        Toggle New Feature
      </button>
    </div>
  );
}
```

## 🎯 Advanced Usage

### Setting up LaunchDarkly Integration

```tsx
import { createFeatureFlagDevToolsClient } from '@sucoza/feature-flag-manager-devtools-plugin';

const client = createFeatureFlagDevToolsClient();

// Add LaunchDarkly provider
await client.addProvider({
  name: 'launchdarkly-prod',
  type: 'launchdarkly',
  enabled: true,
  config: {
    apiKey: 'your-sdk-key',
    environmentId: 'production',
    clientId: 'your-client-id'
  }
});
```

### Custom Provider Integration

```tsx
// Add custom API provider
await client.addProvider({
  name: 'my-feature-service',
  type: 'custom',
  enabled: true,
  config: {
    baseUrl: 'https://api.mycompany.com',
    apiKey: 'Bearer your-api-token'
  }
});
```

### Working with Complex Flags

```tsx
// Multivariate flag with variants
const paymentMethodVariant = await client.evaluateFlag('payment-methods');

// The flag might return different values based on user segment:
// - 'control': Credit card only
// - 'apple-pay': Credit card + Apple Pay  
// - 'all-methods': All payment methods

switch (paymentMethodVariant.value) {
  case 'apple-pay':
    return <ApplePayCheckout />;
  case 'all-methods':
    return <AllMethodsCheckout />;
  default:
    return <CreditCardCheckout />;
}
```

### User Context and Segmentation

```tsx
// Update user context for targeting
await client.setEvaluationContext({
  userId: 'user-456',
  userSegment: 'premium-users',
  attributes: {
    plan: 'enterprise',
    region: 'eu-west-1',
    betaOptIn: true,
    accountAge: 365
  },
  environment: 'production'
});

// Flags will be re-evaluated with new context
const premiumFeatures = await client.evaluateFlag('premium-dashboard');
```

## 📋 Panel Features

### Dashboard Tab
- **Flag Overview**: Summary cards showing total flags, overrides, and experiments
- **Recent Activity**: Latest flag updates and evaluations
- **Quick Actions**: Fast toggle controls for boolean flags
- **Status Indicators**: Visual indicators for flag states and health

### Flags Tab
- **Flag List**: Comprehensive list of all available flags
- **Advanced Filtering**: Filter by environment, type, tags, or status
- **Sorting Options**: Sort by name, update date, or type
- **Bulk Operations**: Apply changes to multiple flags at once
- **Flag Details**: Detailed view with configuration and history

### Overrides Tab
- **Active Overrides**: View all currently active flag overrides
- **Override Management**: Easy creation and removal of overrides
- **Persistence Control**: Choose which overrides to persist
- **Context Awareness**: See how overrides interact with user context

### Experiments Tab
- **A/B Test Overview**: Monitor running experiments and their performance
- **Variant Performance**: Compare conversion rates across variants
- **Statistical Significance**: View confidence intervals and p-values
- **Experiment History**: Track experiment lifecycle and results

### Segments Tab
- **User Segments**: View and manage user segmentation rules
- **Segment Testing**: Test how current user matches different segments
- **Rule Validation**: Validate targeting rules against user context
- **Quick Switching**: Rapidly switch between user personas

### History Tab
- **Evaluation Timeline**: Chronological view of all flag evaluations
- **Filtering Options**: Filter by flag, reason, or time period
- **Detailed Context**: See exact evaluation context and results
- **Export Capabilities**: Export evaluation data for analysis

### Settings Tab
- **General Settings**: Configure refresh intervals, history size, and notifications
- **Provider Management**: Add, configure, and remove flag providers
- **Data Management**: Export settings and clear local data
- **Theme Options**: Choose between light, dark, or auto themes

## 🔧 Configuration Options

### Panel Configuration

```tsx
<FeatureFlagManagerPanel
  client={client}
  theme="auto"              // 'light' | 'dark' | 'auto'
  defaultTab="dashboard"    // Default tab to show
  height={600}             // Panel height in pixels
/>
```

### Client Configuration

```tsx
const client = createFeatureFlagDevToolsClient();

// Configure settings
const settings = {
  autoRefresh: true,
  refreshInterval: 5000,     // 5 seconds
  maxHistorySize: 100,
  persistOverrides: true,
  showNotifications: true,
  theme: 'auto'
};
```

### Hook Configuration

```tsx
const { ... } = useFeatureFlagManager({
  autoCreate: true,          // Automatically create client
  initialContext: { ... },   // Initial evaluation context
  onReady: (client) => { ... },        // Callback when ready
  onStateChange: (state) => { ... }    // Callback on state changes
});
```

## 🎨 Theming and Customization

The plugin supports light, dark, and auto themes that integrate seamlessly with your application:

```css
/* Custom theme variables */
.feature-flag-manager-panel {
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --background-color: #ffffff;
  --text-color: #111827;
}

.feature-flag-manager-panel.dark {
  --background-color: #1f2937;
  --text-color: #f9fafb;
}
```

## 🧪 Testing and Development

### Running the Demo

```bash
# Clone the repository
git clone https://github.com/tanstack/feature-flag-manager-devtools

# Install dependencies
cd feature-flag-manager-plugin
npm install

# Start the demo application
npm run example:basic
```

### Building the Plugin

```bash
# Build the plugin
npm run build

# Watch for changes during development
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck
```

## 📚 API Reference

### Client Methods

```tsx
interface FeatureFlagDevToolsClient {
  // Flag operations
  getFlags(): Promise<FeatureFlag[]>;
  getFlag(id: string): Promise<FeatureFlag | null>;
  evaluateFlag(id: string, context?: EvaluationContext): Promise<FlagEvaluation>;
  
  // Override management
  setOverride(override: FlagOverride): Promise<void>;
  removeOverride(flagId: string): Promise<void>;
  clearAllOverrides(): Promise<void>;
  
  // Context management
  setEvaluationContext(context: EvaluationContext): Promise<void>;
  
  // History and events
  getEvaluationHistory(): Promise<FlagEvaluation[]>;
  getEvents(limit?: number): Promise<FlagEvent[]>;
  
  // Subscriptions
  subscribe(callback: (state: FeatureFlagDevToolsState) => void): () => void;
  
  // Provider integration
  addProvider(provider: ProviderSettings): Promise<void>;
  removeProvider(name: string): Promise<void>;
}
```

### Hook Return Value

```tsx
interface UseFeatureFlagManagerReturn {
  client: FeatureFlagDevToolsClient | null;
  state: FeatureFlagDevToolsState | null;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Convenience methods
  evaluateFlag: (flagId: string, context?: EvaluationContext) => Promise<any>;
  toggleFlag: (flagId: string) => Promise<void>;
  setOverride: (flagId: string, value: any, reason?: string) => Promise<void>;
  removeOverride: (flagId: string) => Promise<void>;
  setContext: (context: EvaluationContext) => Promise<void>;
  refreshFlags: () => Promise<void>;
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/feature-flag-manager-devtools

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## 📄 License

MIT

---

Part of the @sucoza TanStack DevTools ecosystem.

## 🙏 Acknowledgments

- Built with [TanStack DevTools](https://tanstack.com/devtools) architecture
- Inspired by modern feature flag management tools
- Thanks to the React and TypeScript communities

## 📞 Support

- 📖 [Documentation](https://tanstack.com/devtools)
- 🐛 [Issue Tracker](https://github.com/tanstack/feature-flag-manager-devtools/issues)
- 💬 [Discord Community](https://tanstack.com/discord)
- 📧 [Email Support](mailto:support@tanstack.com)

---

**Part of the @sucoza TanStack DevTools ecosystem**