# Visual Regression Monitor DevTools Plugin

A comprehensive TanStack DevTools plugin for visual regression testing with screenshot capture, comparison, and Playwright integration.

## Features

### 📸 Screenshot Capture
- **Playwright Integration**: Seamless integration with Playwright MCP tools for browser automation
- **Responsive Testing**: Capture screenshots across multiple viewport breakpoints
- **Cross-Browser Support**: Test on Chromium, Firefox, and WebKit engines
- **Element Targeting**: Capture specific page elements using CSS selectors
- **Animation Capture**: Frame-by-frame recording of UI animations and transitions

### 🔍 Visual Comparison
- **Advanced Diff Algorithm**: Pixel-by-pixel comparison with configurable sensitivity
- **SSIM Analysis**: Structural Similarity Index for perceptually accurate comparisons
- **Perceptual Hashing**: Fast similarity detection using image fingerprinting
- **Threshold Configuration**: Customizable difference thresholds for pass/fail criteria
- **Region Analysis**: Detailed breakdown of changed areas with severity levels

### 📱 Responsive Testing
- **Breakpoint Management**: Predefined and custom viewport configurations
- **Layout Shift Detection**: Automatic detection of significant layout changes
- **Cross-Viewport Comparison**: Compare the same URL across different screen sizes
- **Mobile/Desktop Testing**: Simulate different device types and orientations

### 📊 Timeline & Analytics
- **Activity Timeline**: Chronological view of testing activities
- **Test Suite Management**: Organize screenshots into logical test groups
- **Statistics Dashboard**: Comprehensive metrics on test results and coverage
- **Export/Import**: Configuration and results export for CI/CD integration

## Installation

```bash
npm install @sucoza/visual-regression-monitor-devtools
```

## Usage

### Basic Setup

```typescript
import { PluginPanel } from '@sucoza/visual-regression-monitor-devtools';

// Use as a standalone component
function DevTools() {
  return (
    <div className="devtools-container">
      <PluginPanel />
    </div>
  );
}
```

### With TanStack DevTools

```typescript
import { createVisualRegressionDevToolsClient } from '@sucoza/visual-regression-monitor-devtools';

const client = createVisualRegressionDevToolsClient();

// Access plugin functionality
const { screenshots, visualDiffs, settings } = client.getState();
```

### Hooks API

```typescript
import { useScreenshots, useVisualDiff, useResponsiveTesting } from '@sucoza/visual-regression-monitor-devtools';

function MyComponent() {
  const { screenshots, actions } = useScreenshots();
  const { visualDiffs, actions: diffActions } = useVisualDiff();
  const { breakpoints, actions: responsiveActions } = useResponsiveTesting();

  // Capture a screenshot
  const handleCapture = async () => {
    await actions.captureScreenshot({
      url: 'https://example.com',
      name: 'Homepage',
      viewport: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false }
    });
  };

  // Compare screenshots
  const handleCompare = async () => {
    await diffActions.compareScreenshots(baselineId, comparisonId);
  };

  // Responsive testing
  const handleResponsiveTesting = async () => {
    await responsiveActions.testUrlAcrossBreakpoints('https://example.com');
  };

  return (
    <div>
      <button onClick={handleCapture}>Capture Screenshot</button>
      <button onClick={handleCompare}>Compare Screenshots</button>
      <button onClick={handleResponsiveTesting}>Test Responsive</button>
    </div>
  );
}
```

## Configuration

### Screenshot Settings

```typescript
const settings = {
  captureSettings: {
    fullPage: false,
    hideScrollbars: true,
    disableAnimations: false,
    waitForFonts: true,
    waitForImages: true,
    delay: 0,
    quality: 90,
    format: 'png'
  }
};
```

### Responsive Breakpoints

```typescript
const breakpoints = [
  { name: 'Mobile', width: 375, height: 667, deviceScaleFactor: 2, isMobile: true },
  { name: 'Tablet', width: 768, height: 1024, deviceScaleFactor: 1, isMobile: false },
  { name: 'Desktop', width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
];
```

### Diff Configuration

```typescript
const diffOptions = {
  ignoreAntialiasing: true,
  ignoreColors: false,
  threshold: 0.2,
  regions: [
    { x: 0, y: 0, width: 100, height: 100 } // Exclude specific regions
  ]
};
```

## Playwright MCP Integration

This plugin integrates with Playwright MCP (Model Context Protocol) tools for browser automation:

```typescript
// Example MCP tool usage (handled internally by the plugin)
// mcp__playwright__browser_navigate({ url: 'https://example.com' })
// mcp__playwright__browser_resize({ width: 1920, height: 1080 })
// mcp__playwright__browser_take_screenshot({ fullPage: true })
```

## API Reference

### Core Functions

#### Screenshot Management
- `captureScreenshot(request: CaptureRequest)`: Capture a single screenshot
- `captureResponsiveScreenshots(url: string, viewports: Viewport[])`: Capture across multiple viewports
- `captureAnimationFrames(url: string, selector: string, duration: number)`: Record animation frames

#### Visual Comparison
- `compareScreenshots(baselineId: string, comparisonId: string)`: Compare two screenshots
- `batchCompareScreenshots(baselineId: string, comparisonIds: string[])`: Batch comparison
- `calculateSimilarityScore(image1: ImageData, image2: ImageData)`: Calculate similarity

#### State Management
- `getState()`: Get current plugin state
- `subscribe(callback: Function)`: Subscribe to state changes
- `dispatch(action: DevToolsAction)`: Dispatch state updates

### Types

```typescript
interface Screenshot {
  id: string;
  name: string;
  url: string;
  selector?: string;
  viewport: Viewport;
  browserEngine: BrowserEngine;
  timestamp: number;
  dataUrl: string;
  metadata: ScreenshotMetadata;
  tags?: string[];
}

interface VisualDiff {
  id: string;
  baselineId: string;
  comparisonId: string;
  timestamp: number;
  status: 'passed' | 'failed' | 'pending';
  differences: DiffRegion[];
  metrics: DiffMetrics;
  threshold: number;
}

interface CaptureRequest {
  url: string;
  selector?: string;
  viewport?: Viewport;
  options?: Partial<CaptureSettings>;
  browserEngine?: BrowserEngine;
  name?: string;
  tags?: string[];
}
```

## Example Application

Run the example application to see the plugin in action:

```bash
cd example
npm install
npm run dev
```

The example includes:
- Plugin demonstration with all features
- Different layout patterns for testing
- Interactive controls for exploring functionality

## Development

### Build

```bash
npm run build        # Build for production
npm run dev          # Build in watch mode
npm run typecheck    # Type checking
npm run lint         # ESLint
npm run format       # Prettier
```

### Testing

```bash
npm test             # Run tests
npm run test:ui      # Run tests with UI
```

## Architecture

The plugin follows TanStack DevTools patterns:

- **Event-Driven Architecture**: Uses `@tanstack/devtools-event-client` for communication
- **Zustand State Management**: Central state store with `useSyncExternalStore`
- **Component Architecture**: Modular React components with hooks
- **TypeScript**: Full type safety throughout the codebase
- **Build System**: Rollup with dual CJS/ESM output

### Directory Structure

```
src/
├── components/          # React UI components
│   ├── PluginPanel.tsx     # Main devtools panel
│   ├── ScreenshotCapture.tsx # Screenshot interface
│   ├── VisualDiff.tsx      # Diff visualization
│   ├── Timeline.tsx        # Activity timeline
│   ├── ComparisonView.tsx  # Animation analysis
│   └── Settings.tsx        # Configuration
├── core/               # Business logic
│   ├── devtools-client.ts  # Event client integration
│   ├── devtools-store.ts   # Zustand store
│   ├── screenshot-engine.ts # Playwright integration
│   ├── diff-algorithm.ts   # Visual comparison
│   └── storage.ts          # Persistence layer
├── hooks/              # Custom React hooks
│   ├── useScreenshots.ts   # Screenshot management
│   ├── useVisualDiff.ts    # Diff operations
│   └── useResponsiveTesting.ts # Responsive testing
├── types/              # TypeScript definitions
├── utils/              # Utility functions
│   ├── image-processing.ts # Image manipulation
│   └── index.ts           # General utilities
└── index.ts            # Main exports
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 📖 [Documentation](https://github.com/tanstack/devtools)
- 🐛 [Bug Reports](https://github.com/tanstack/devtools/issues)
- 💬 [Discussions](https://github.com/tanstack/devtools/discussions)
- 📧 [Support](mailto:support@tanstack.com)

---

Built with ❤️ by the TanStack team