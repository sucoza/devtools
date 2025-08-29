# Design System Inspector Plugin

A comprehensive design system analysis plugin for TanStack DevTools that provides real-time design token consistency analysis, component usage tracking, color palette inspection, typography scale validation, and spacing consistency monitoring.

## Features

### 🎨 **Design Token Analysis**
- Comprehensive design token extraction and validation
- Color, typography, spacing, shadow, and border token detection
- Token usage tracking and consistency monitoring
- Design system compliance scoring and recommendations

### 🧩 **Component Usage Tracking**
- React component usage statistics and analytics
- Prop usage patterns and variant analysis
- Component lifecycle tracking and adoption metrics
- Design system component adoption reporting

### 🌈 **Color Palette Inspection**
- Automatic color palette extraction and categorization
- WCAG accessibility compliance checking for color combinations
- Color usage statistics and optimization recommendations
- Brand color consistency analysis and validation

### ✏️ **Typography Scale Validation**
- Typography scale detection and consistency analysis
- Font size, weight, and line height validation
- Typography token usage tracking and compliance scoring
- Readability and accessibility assessment

### 📏 **Spacing Consistency Monitoring**
- Spacing scale analysis and consistency detection
- Margin, padding, and gap usage pattern analysis
- Design system spacing token compliance tracking
- Visual spacing inconsistency identification and recommendations

### 🔍 **Real-time Consistency Analysis**
- Live design system compliance monitoring
- Inconsistency detection with severity classification
- Automated fix suggestions and implementation guides
- Visual highlighting of design system violations

### 📊 **Dashboard & Analytics**
- Design system health dashboard with key metrics
- Component adoption and usage trend analysis
- Token utilization statistics and optimization opportunities
- Consistency score tracking over time

## Installation

```bash
npm install @sucoza/design-system-inspector-devtools-plugin
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { DesignSystemInspectorPanel } from '@sucoza/design-system-inspector-devtools-plugin';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Design System Inspector DevTools Panel */}
      <DesignSystemInspectorPanel />
    </div>
  );
}
```

### With Event Client Integration

```tsx
import React, { useEffect } from 'react';
import { 
  DesignSystemInspectorPanel,
  createDesignSystemEventClient 
} from '@sucoza/design-system-inspector-devtools-plugin';

function App() {
  useEffect(() => {
    // Initialize the design system event client
    const client = createDesignSystemEventClient();
    
    // Optional: Listen for design system events
    const unsubscribe = client.subscribe((event, type) => {
      if (type === 'design-system:analysis-complete') {
        console.log('Design system analysis completed:', event);
      }
      if (type === 'design-system:consistency-issue') {
        console.log('New consistency issue found:', event);
      }
    });
    
    return unsubscribe;
  }, []);

  return (
    <div>
      <DesignSystemInspectorPanel />
    </div>
  );
}
```

### Using the Hook

```tsx
import React from 'react';
import { useDesignSystemInspector } from '@sucoza/design-system-inspector-devtools-plugin';

function MyComponent() {
  const {
    stats,
    tokens,
    componentUsage,
    consistencyIssues,
    colorPalette,
    isAnalysisEnabled,
    startAnalysis,
    toggleRealTimeMode,
    updateSettings
  } = useDesignSystemInspector();
  
  return (
    <div>
      <div>
        <h3>Design System Health</h3>
        <p>Consistency Score: {(stats.consistencyScore * 100).toFixed(1)}%</p>
        <p>Total Tokens: {stats.totalTokens}</p>
        <p>Token Utilization: {(stats.tokensUtilization * 100).toFixed(1)}%</p>
        <p>Total Issues: {stats.totalIssues}</p>
      </div>
      
      <div>
        <button onClick={startAnalysis}>
          Start Analysis
        </button>
        <button onClick={toggleRealTimeMode}>
          {isAnalysisEnabled ? 'Disable' : 'Enable'} Real-time Monitoring
        </button>
      </div>
      
      {consistencyIssues.length > 0 && (
        <div>
          <h3>Consistency Issues</h3>
          {consistencyIssues.map(issue => (
            <div key={issue.id} className={`issue-${issue.severity}`}>
              <h4>{issue.title}</h4>
              <p>{issue.description}</p>
              {issue.recommendation && (
                <p><strong>Recommendation:</strong> {issue.recommendation}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Analysis Options

```tsx
import { useDesignSystemInspector } from '@sucoza/design-system-inspector-devtools-plugin';

function MyComponent() {
  const { updateAnalysisOptions } = useDesignSystemInspector();
  
  // Configure analysis behavior
  updateAnalysisOptions({
    includeComponents: true,
    includeTokens: true,
    includeColors: true,
    includeTypography: true,
    includeSpacing: true,
    includeBorders: true,
    includeShadows: true,
    depth: 'deep',
    includeThirdParty: false,
    customSelectors: ['.custom-component', '[data-testid]'],
  });
}
```

### Settings Configuration

```tsx
import { useDesignSystemInspector } from '@sucoza/design-system-inspector-devtools-plugin';

function MyComponent() {
  const { updateSettings } = useDesignSystemInspector();
  
  // Configure inspector settings
  updateSettings({
    isAnalysisEnabled: true,
    isRealTimeMode: true,
    analysisDepth: 'medium',
    includeThirdParty: false,
    autoFixEnabled: false,
    notificationsEnabled: true,
  });
}
```

### Filter Options

```tsx
import { useDesignSystemInspector } from '@sucoza/design-system-inspector-devtools-plugin';

function MyComponent() {
  const { updateFilters } = useDesignSystemInspector();
  
  // Configure filtering options
  updateFilters({
    severity: ['error', 'warning'], // Only show errors and warnings
    issueTypes: ['inconsistent-colors', 'inconsistent-spacing'],
    tokenTypes: ['color', 'typography', 'spacing'],
    showOnlyIssues: false,
    searchQuery: 'button',
  });
}
```

## Components

### DesignSystemInspectorPanel
The main panel component that provides the complete design system inspection interface with multiple tabs.

### Individual Tab Components
You can also use individual tab components for specific functionality:

- `DashboardTab` - Design system health overview and key metrics
- `ComponentsTab` - Component usage tracking and analysis
- `TokensTab` - Design token management and validation
- `ColorsTab` - Color palette analysis and consistency checking
- `TypographyTab` - Typography scale validation and usage analysis
- `SpacingTab` - Spacing consistency monitoring and analysis
- `IssuesTab` - Consistency issues listing and management

## API Reference

### Types

```typescript
interface DesignToken {
  id: string;
  name: string;
  value: string;
  type: DesignTokenType;
  category: string;
  description?: string;
  usageCount: number;
  isValid: boolean;
  violations?: string[];
}

interface ComponentUsage {
  id: string;
  name: string;
  displayName: string;
  filePath: string;
  usageCount: number;
  props: PropUsage[];
  variants: ComponentVariant[];
  firstSeen: number;
  lastSeen: number;
}

interface ConsistencyIssue {
  id: string;
  type: ConsistencyIssueType;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  element?: HTMLElement;
  selector?: string;
  recommendation?: string;
  fixable?: boolean;
  occurrences: ConsistencyOccurrence[];
}

interface ColorPalette {
  primary: ColorToken[];
  secondary: ColorToken[];
  neutral: ColorToken[];
  semantic: ColorToken[];
  custom: ColorToken[];
}

interface DesignSystemStats {
  totalComponents: number;
  totalTokens: number;
  totalIssues: number;
  tokensUtilization: number;
  consistencyScore: number;
  accessibilityScore: number;
  lastAnalysis: number;
  analysisTime: number;
}
```

### Event Client

```typescript
interface DesignSystemEvents {
  'design-system:state': DesignSystemState;
  'design-system:action': DesignSystemAction;
  'design-system:analysis-started': { timestamp: number; options: AnalysisOptions };
  'design-system:analysis-complete': { result: AnalysisResult; metrics: AnalysisMetrics };
  'design-system:consistency-issue': { issue: ConsistencyIssue; isNew: boolean };
  'design-system:token-detected': { token: DesignToken };
  'design-system:component-tracked': { component: ComponentUsage };
  'design-system:realtime-toggle': { enabled: boolean };
}
```

## Examples

Check out the `example/` directory for a complete demonstration of the plugin with various design system scenarios and consistency issues.

To run the example:

```bash
cd example
npm install
npm run dev
```

The example includes:
- Design system implementation with tokens and components
- Various consistency issues for testing and demonstration
- Color palette and typography scale examples
- Component usage tracking demonstrations
- Real-time monitoring examples

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

Part of the @sucoza TanStack DevTools ecosystem.

## Powered By

- [CSS Tree](https://github.com/csstree/csstree) - CSS parsing and analysis
- [TanStack DevTools](https://tanstack.com/devtools) - Development tools framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Color](https://github.com/Qix-/color) - Color manipulation and analysis
- [Fuse.js](https://fusejs.io/) - Fuzzy search for design token matching