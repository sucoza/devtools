# Accessibility DevTools Plugin

A comprehensive accessibility auditing plugin for TanStack DevTools that provides real-time WCAG compliance testing, color contrast analysis, keyboard navigation visualization, ARIA validation, and more.

## Features

### 🔍 **Comprehensive Accessibility Auditing**
- Real-time accessibility scanning with axe-core integration
- WCAG 2.1 compliance testing (A, AA, AAA levels)
- Automated detection of common accessibility issues
- Performance-optimized continuous scanning

### 🎨 **Color Contrast Analysis**
- WCAG AA/AAA color contrast compliance checking
- Visual color swatch display
- Contrast ratio calculations
- Accessible color suggestions

### ⌨️ **Keyboard Navigation Testing**
- Tab order visualization
- Focus flow debugging
- Keyboard trap detection
- Skip link validation

### 🛡️ **ARIA Validation**
- Comprehensive ARIA attribute validation
- Role verification and redundancy detection
- Missing accessible name detection
- Reference integrity checking

### 🗺️ **Landmark Structure Analysis**
- Page structure visualization
- Landmark hierarchy mapping
- Missing landmark detection
- Visual overlay for page regions

### 🎯 **Focus Management Debugging**
- Real-time focus tracking
- Focus indicator visibility testing
- Focus history tracking
- Poor contrast detection for focus states

## Installation

```bash
npm install @sucoza/accessibility-devtools-plugin
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { AccessibilityDevToolsPanel } from '@sucoza/accessibility-devtools-plugin';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Accessibility DevTools Panel */}
      <AccessibilityDevToolsPanel />
    </div>
  );
}
```

### With Event Client Integration

```tsx
import React, { useEffect } from 'react';
import { 
  AccessibilityDevToolsPanel,
  createAccessibilityDevToolsEventClient 
} from '@sucoza/accessibility-devtools-plugin';

function App() {
  useEffect(() => {
    // Initialize the accessibility event client
    const client = createAccessibilityDevToolsEventClient();
    
    // Optional: Listen for accessibility events
    const unsubscribe = client.subscribe((event, type) => {
      if (type === 'accessibility:issue-found') {
        console.log('New accessibility issue:', event);
      }
    });
    
    return unsubscribe;
  }, []);

  return (
    <div>
      <AccessibilityDevToolsPanel />
    </div>
  );
}
```

### Using the Hook

```tsx
import React from 'react';
import { useAccessibilityAudit } from '@sucoza/accessibility-devtools-plugin';

function MyComponent() {
  const {
    currentAudit,
    scanState,
    startScan,
    getIssueStats
  } = useAccessibilityAudit();
  
  const stats = getIssueStats();
  
  return (
    <div>
      <button onClick={() => startScan()}>
        Start Accessibility Scan
      </button>
      
      {currentAudit && (
        <div>
          <p>Issues found: {stats.total}</p>
          <p>Critical: {stats.critical}</p>
          <p>Serious: {stats.serious}</p>
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Scan Options

```tsx
import { useAccessibilityAudit } from '@sucoza/accessibility-devtools-plugin';

function MyComponent() {
  const { updateScanOptions } = useAccessibilityAudit();
  
  // Configure scanning behavior
  updateScanOptions({
    continuous: true,
    debounceMs: 1000,
    includeColorContrast: true,
    includeKeyboardNav: true,
    includeARIA: true,
    includeFocus: true,
    config: {
      wcagLevel: 'AA',
      includeExperimental: false,
    }
  });
}
```

### Settings

```tsx
import { useAccessibilityAudit } from '@sucoza/accessibility-devtools-plugin';

function MyComponent() {
  const { updateSettings } = useAccessibilityAudit();
  
  // Configure plugin settings
  updateSettings({
    autoScan: true,
    scanDelay: 1000,
    maxHistoryEntries: 50,
    enableOverlay: true,
    enableSounds: false,
    enableNotifications: true,
    wcagLevel: 'AA',
    includeExperimental: false,
  });
}
```

## Components

### AccessibilityDevToolsPanel
The main panel component that provides the complete accessibility auditing interface.

### Individual Components
You can also use individual components for specific functionality:

- `IssueList` - Display accessibility violations
- `ColorContrastAnalyzer` - Color contrast analysis tool
- `KeyboardNavVisualizer` - Keyboard navigation testing
- `ARIAValidator` - ARIA attribute validation
- `LandmarkMapper` - Page structure analysis
- `FocusDebugger` - Focus management debugging

## API Reference

### Types

```typescript
interface AccessibilityIssue {
  id: string;
  rule: string;
  impact: SeverityLevel;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AccessibilityNode[];
  type: ViolationType;
  timestamp: number;
}

interface AccessibilityAuditResult {
  url: string;
  timestamp: number;
  violations: AccessibilityIssue[];
  incomplete: AccessibilityIssue[];
  passes: AccessibilityIssue[];
  inapplicable: AccessibilityIssue[];
  testEngine: {
    name: string;
    version: string;
  };
  // ... more properties
}
```

### Event Client

```typescript
interface AccessibilityDevToolsEvents {
  'accessibility:state': AccessibilityDevToolsState;
  'accessibility:action': AccessibilityDevToolsAction;
  'accessibility:audit-started': { timestamp: number; elementSelector?: string };
  'accessibility:audit-complete': { audit: AccessibilityAuditResult; metrics: ScanPerformanceMetrics };
  'accessibility:issue-found': { issue: AccessibilityIssue; isNew: boolean };
  'accessibility:overlay-toggle': { enabled: boolean; state: OverlayState };
  'accessibility:element-highlight': { selector: string | null };
}
```

## Examples

Check out the `example/` directory for a complete demonstration of the plugin with various accessibility issues to test against.

To run the example:

```bash
cd example
npm install
npm run dev
```

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

- [axe-core](https://github.com/dequelabs/axe-core) - Accessibility engine
- [TanStack DevTools](https://tanstack.com/devtools) - Development tools framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [colorjs.io](https://colorjs.io/) - Color manipulation and contrast calculations