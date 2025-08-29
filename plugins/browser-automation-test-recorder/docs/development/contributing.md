# Contributing Guide

Thank you for your interest in contributing to the Browser Automation Test Recorder Plugin! This guide will help you get started with development, understand our processes, and make meaningful contributions.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Standards](#code-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Submitting Changes](#submitting-changes)
8. [Release Process](#release-process)
9. [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Git** for version control
- A modern code editor (VS Code recommended)
- Basic understanding of TypeScript, React, and browser APIs

### Ways to Contribute

We welcome various types of contributions:

1. **Bug Reports** - Report issues you encounter
2. **Feature Requests** - Suggest new functionality
3. **Code Contributions** - Fix bugs or implement features
4. **Documentation** - Improve docs and examples
5. **Testing** - Add tests or improve test coverage
6. **Performance** - Optimize code for better performance
7. **Accessibility** - Improve accessibility compliance

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time community chat
- **Email**: Maintainer contact for sensitive issues

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/browser-automation-test-recorder-plugin.git
cd browser-automation-test-recorder-plugin
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install example app dependencies
cd example
npm install
cd ..
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Configure environment variables
# BROWSER_PATH=/path/to/chrome  # Optional: Custom browser path
# DEBUG=browser-automation:*     # Enable debug logging
```

### 4. Verify Setup

```bash
# Run tests to verify setup
npm test

# Start development mode
npm run dev

# Start example application
npm run example
```

### 5. IDE Configuration

**VS Code Extensions** (recommended):
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright"
  ]
}
```

**VS Code Settings**:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

## Project Structure

Understanding the project structure is crucial for effective contribution:

```
browser-automation-test-recorder-plugin/
├── src/                          # Source code
│   ├── components/               # React UI components
│   │   ├── BrowserAutomationPanel.tsx
│   │   ├── tabs/                 # Tab components
│   │   └── collaboration/        # Collaboration features
│   ├── core/                     # Core business logic
│   │   ├── recorder.ts           # Event recording
│   │   ├── selector-engine.ts    # Selector generation
│   │   ├── playback-engine.ts    # Event playback
│   │   ├── code-generator.ts     # Code generation
│   │   └── generators/           # Framework-specific generators
│   ├── types/                    # TypeScript definitions
│   ├── utils/                    # Utility functions
│   └── hooks/                    # Custom React hooks
├── example/                      # Example application
├── docs/                         # Documentation
├── src/__tests__/                # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── components/               # Component tests
│   ├── e2e/                      # End-to-end tests
│   └── performance/              # Performance tests
├── rollup.config.js              # Build configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project configuration
```

### Key Files

- **`src/index.ts`**: Main plugin entry point
- **`src/components/BrowserAutomationPanel.tsx`**: Root UI component
- **`src/core/devtools-store.ts`**: Zustand state management
- **`src/core/devtools-client.ts`**: TanStack DevTools integration
- **`src/types/automation.ts`**: Core type definitions

## Development Workflow

### 1. Choose an Issue

- Browse [GitHub Issues](https://github.com/tanstack/browser-automation-test-recorder-plugin/issues)
- Look for issues labeled `good first issue` for beginners
- Comment on the issue to indicate you're working on it

### 2. Create a Branch

```bash
# Create feature branch
git checkout -b feature/issue-description

# Or bug fix branch
git checkout -b fix/issue-description

# Or documentation branch
git checkout -b docs/improvement-description
```

### 3. Development Process

#### Start Development Server

```bash
# Terminal 1: Watch mode build
npm run dev

# Terminal 2: Example app
npm run example

# Terminal 3: Test watch mode
npm run test:watch
```

#### Code Changes

1. **Make Changes**: Implement your feature or fix
2. **Test Locally**: Verify changes work in example app
3. **Run Tests**: Ensure all tests pass
4. **Update Docs**: Update documentation if needed

#### Testing Your Changes

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run component tests
npm run test:components

# Run E2E tests (requires browser)
npm run test:e2e

# Run all tests
npm run test:all

# Check test coverage
npm run test:coverage
```

### 4. Code Quality Checks

```bash
# TypeScript compilation
npm run typecheck

# ESLint checks
npm run lint

# Prettier formatting
npm run format

# Fix auto-fixable issues
npm run lint:fix
```

## Code Standards

### TypeScript Guidelines

**Strict Type Safety**:
```typescript
// ✅ Good - Explicit typing
interface RecordingOptions {
  captureScreenshots: boolean;
  captureConsole: boolean;
  ignoredEvents: EventType[];
}

// ❌ Avoid - Any types
const options: any = { ... };

// ✅ Good - Proper generics
interface EventHandler<T extends RecordedEvent> {
  handle(event: T): Promise<void>;
}

// ❌ Avoid - Loose generics
interface EventHandler<T> {
  handle(event: T): Promise<void>;
}
```

**Proper Error Handling**:
```typescript
// ✅ Good - Custom error types
class RecordingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RecordingError';
  }
}

// ✅ Good - Async error handling
async function startRecording(): Promise<string> {
  try {
    const sessionId = await recorder.start();
    return sessionId;
  } catch (error) {
    if (error instanceof RecordingError) {
      throw new Error(`Recording failed: ${error.message}`);
    }
    throw error;
  }
}
```

### React Component Guidelines

**Component Structure**:
```typescript
// ✅ Good component structure
interface RecorderTabProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  events: RecordedEvent[];
  className?: string;
}

export function RecorderTab({
  isRecording,
  onStartRecording,
  onStopRecording,
  events,
  className
}: RecorderTabProps) {
  // Hooks at the top
  const [localState, setLocalState] = useState(false);
  const eventClient = useBrowserAutomationEventClient();
  
  // Event handlers
  const handleStartRecording = useCallback(() => {
    onStartRecording();
  }, [onStartRecording]);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Early returns
  if (!eventClient) {
    return <div>Loading...</div>;
  }
  
  // Main render
  return (
    <div className={clsx('recorder-tab', className)}>
      {/* Component JSX */}
    </div>
  );
}
```

**Accessibility Requirements**:
```typescript
// ✅ Good - Accessible button
<button
  type="button"
  aria-label="Start recording browser events"
  aria-pressed={isRecording}
  disabled={isLoading}
  onClick={handleStartRecording}
>
  {isRecording ? 'Stop' : 'Start'} Recording
</button>

// ✅ Good - Semantic HTML
<section aria-labelledby="events-heading">
  <h2 id="events-heading">Recorded Events</h2>
  <ul role="list">
    {events.map(event => (
      <li key={event.id} role="listitem">
        {event.type}
      </li>
    ))}
  </ul>
</section>
```

### Naming Conventions

**Files and Directories**:
```
✅ Good:
- BrowserAutomationPanel.tsx
- selector-engine.ts
- recording-workflow.test.ts

❌ Avoid:
- browserautomationpanel.tsx
- SelectorEngine.ts
- RecordingWorkflow.test.ts
```

**Variables and Functions**:
```typescript
// ✅ Good - Descriptive names
const isRecordingInProgress = recorder.isRecording;
const handleEventRecorded = (event: RecordedEvent) => { ... };
const generateOptimizedSelector = async (element: Element) => { ... };

// ❌ Avoid - Abbreviated names
const isRec = recorder.isRecording;
const handleEvt = (e: RecordedEvent) => { ... };
const genSel = async (el: Element) => { ... };
```

**Constants**:
```typescript
// ✅ Good - Clear constants
const DEFAULT_RECORDING_OPTIONS: RecordingOptions = { ... };
const MAX_EVENT_BUFFER_SIZE = 1000;
const SELECTOR_CONFIDENCE_THRESHOLD = 0.8;

// ❌ Avoid - Magic numbers/strings
const timeout = 5000; // What is this timeout for?
const threshold = 0.8; // Threshold for what?
```

### CSS and Styling

**CSS Class Naming** (BEM methodology):
```css
/* ✅ Good - BEM naming */
.browser-automation-panel { }
.browser-automation-panel__header { }
.browser-automation-panel__tab { }
.browser-automation-panel__tab--active { }
.browser-automation-panel__button { }
.browser-automation-panel__button--disabled { }

/* ❌ Avoid - Unclear naming */
.panel { }
.header { }
.tab { }
.active { }
```

**CSS Variables**:
```css
/* ✅ Good - CSS custom properties */
:root {
  --ba-color-primary: #2563eb;
  --ba-color-success: #16a34a;
  --ba-color-error: #dc2626;
  --ba-spacing-sm: 0.5rem;
  --ba-spacing-md: 1rem;
  --ba-border-radius: 0.375rem;
}

.browser-automation-panel {
  border-radius: var(--ba-border-radius);
  padding: var(--ba-spacing-md);
}
```

## Testing Guidelines

### Test Structure

Follow the AAA pattern (Arrange, Act, Assert):

```typescript
describe('EventRecorder', () => {
  let recorder: EventRecorder;
  let mockSelectorEngine: jest.Mocked<SelectorEngine>;
  let mockEventClient: jest.Mocked<BrowserAutomationEventClient>;
  
  beforeEach(() => {
    // Arrange - Set up test environment
    mockSelectorEngine = createMockSelectorEngine();
    mockEventClient = createMockEventClient();
    recorder = new EventRecorder(mockSelectorEngine, mockEventClient);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should start recording when start() is called', async () => {
    // Arrange
    const options: RecordingOptions = { captureScreenshots: true };
    
    // Act
    const sessionId = await recorder.start(options);
    
    // Assert
    expect(sessionId).toBeDefined();
    expect(recorder.isRecording).toBe(true);
    expect(mockEventClient.emit).toHaveBeenCalledWith(
      'recording-started',
      expect.objectContaining({ sessionId, options })
    );
  });
  
  it('should throw error when starting recording twice', async () => {
    // Arrange
    await recorder.start();
    
    // Act & Assert
    await expect(recorder.start()).rejects.toThrow(RecordingError);
  });
});
```

### Unit Test Guidelines

**Test One Thing**:
```typescript
// ✅ Good - Tests one specific behavior
it('should generate CSS selector for element with ID', async () => {
  const element = document.createElement('div');
  element.id = 'test-element';
  
  const result = await selectorEngine.generateSelector(element);
  
  expect(result.primary).toBe('#test-element');
  expect(result.confidence).toBeGreaterThan(0.9);
});

// ❌ Avoid - Tests multiple behaviors
it('should generate selectors and validate them', async () => {
  // Tests both generation and validation - split into separate tests
});
```

**Mock External Dependencies**:
```typescript
// ✅ Good - Mock dependencies
jest.mock('./selector-engine', () => ({
  SelectorEngine: jest.fn().mockImplementation(() => ({
    generateSelector: jest.fn().mockResolvedValue({
      primary: '[data-testid="button"]',
      confidence: 0.95
    })
  }))
}));
```

### Integration Test Guidelines

Test component interactions:

```typescript
describe('Recording Workflow Integration', () => {
  it('should complete full recording workflow', async () => {
    // Arrange - Set up components
    const recorder = new EventRecorder(selectorEngine, eventClient);
    const codeGenerator = new PlaywrightGenerator();
    
    // Act - Execute workflow
    await recorder.start();
    
    // Simulate user interactions
    const events = await simulateUserFlow([
      { type: 'click', selector: '[data-testid="button"]' },
      { type: 'input', selector: '[data-testid="input"]', value: 'test' }
    ]);
    
    const recordedEvents = await recorder.stop();
    const code = await codeGenerator.generate(recordedEvents);
    
    // Assert - Verify end-to-end behavior
    expect(recordedEvents).toHaveLength(2);
    expect(code).toContain('page.click');
    expect(code).toContain('page.fill');
  });
});
```

### Component Test Guidelines

Use Testing Library for React components:

```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { BrowserAutomationPanel } from '../BrowserAutomationPanel';

describe('BrowserAutomationPanel', () => {
  it('should start recording when record button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnStartRecording = jest.fn();
    
    render(
      <BrowserAutomationPanel
        onStartRecording={mockOnStartRecording}
        isRecording={false}
      />
    );
    
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);
    
    expect(mockOnStartRecording).toHaveBeenCalledTimes(1);
  });
  
  it('should be accessible via keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(<BrowserAutomationPanel />);
    
    // Tab through interactive elements
    await user.tab();
    expect(screen.getByRole('button', { name: /start recording/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('tab', { name: /events/i })).toHaveFocus();
  });
});
```

### E2E Test Guidelines

Use Playwright for end-to-end tests:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Browser Automation Plugin E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });
  
  test('should record and playback user interactions', async ({ page }) => {
    // Open DevTools panel (simulated)
    await page.click('[data-testid="devtools-toggle"]');
    await page.click('[data-testid="browser-automation-tab"]');
    
    // Start recording
    await page.click('[data-testid="start-recording"]');
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    
    // Perform user actions
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="submit-button"]');
    
    // Stop recording
    await page.click('[data-testid="stop-recording"]');
    
    // Verify events were recorded
    const eventCount = await page.locator('[data-testid="event-item"]').count();
    expect(eventCount).toBeGreaterThan(0);
    
    // Generate and verify test code
    await page.click('[data-testid="generate-code"]');
    const generatedCode = await page.locator('[data-testid="generated-code"]').textContent();
    expect(generatedCode).toContain('page.fill');
    expect(generatedCode).toContain('page.click');
  });
});
```

## Submitting Changes

### 1. Pre-submission Checklist

Before submitting a pull request:

- [ ] All tests pass (`npm run test:all`)
- [ ] Code follows style guidelines (`npm run lint`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Code is properly formatted (`npm run format`)
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional commits
- [ ] PR description explains the changes
- [ ] Screenshots included for UI changes

### 2. Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

# Examples
feat(recorder): add intelligent event filtering
fix(selectors): resolve issue with nested element selectors  
docs: update API documentation for code generators
test(e2e): add tests for playback functionality
perf: optimize selector caching mechanism
refactor(core): simplify event processing pipeline
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `perf`: Performance improvements
- `chore`: Maintenance tasks

### 3. Pull Request Process

**PR Title**: Use the same format as commit messages

**PR Description Template**:
```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing performed

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Documentation has been updated
- [ ] Tests have been added or updated
- [ ] Changes generate no new warnings
```

### 4. Review Process

**What Reviewers Look For**:
1. **Functionality**: Does the code work as intended?
2. **Code Quality**: Is the code well-structured and maintainable?
3. **Performance**: Are there any performance implications?
4. **Security**: Are there any security concerns?
5. **Testing**: Is the code adequately tested?
6. **Documentation**: Is the code properly documented?

**Addressing Review Comments**:
- Respond to all comments, even if just to acknowledge
- Make requested changes in separate commits
- Mark conversations as resolved when addressed
- Ask for clarification if comments are unclear

## Release Process

### Version Management

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Incompatible API changes
- **MINOR** version: New functionality (backward compatible)
- **PATCH** version: Bug fixes (backward compatible)

### Release Steps

1. **Update Version**: Update package.json version
2. **Update Changelog**: Document changes in CHANGELOG.md
3. **Create Release PR**: Submit PR with version and changelog updates
4. **Tag Release**: Create Git tag after PR merge
5. **Publish Package**: Automated NPM publish via CI/CD
6. **Release Notes**: Create GitHub release with notes

### Release Checklist

- [ ] All tests passing in CI
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped appropriately
- [ ] Breaking changes documented
- [ ] Migration guide provided (if needed)
- [ ] Browser compatibility verified
- [ ] Performance regressions checked

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and constructive in discussions
- Help others learn and grow
- Focus on what is best for the community
- Show empathy towards other community members
- Report any unacceptable behavior

### Getting Help

**For Development Questions**:
- Check existing [GitHub Discussions](https://github.com/tanstack/browser-automation-test-recorder-plugin/discussions)
- Join our [Discord server](https://discord.gg/tanstack)
- Review the [documentation](../README.md)

**For Bug Reports**:
- Search existing [issues](https://github.com/tanstack/browser-automation-test-recorder-plugin/issues)
- Use the bug report template
- Provide minimal reproduction steps
- Include environment details

**For Feature Requests**:
- Check the [roadmap](../ROADMAP.md) first
- Use the feature request template  
- Explain the use case and benefits
- Be open to discussion and alternatives

### Recognition

Contributors are recognized in:
- **README.md**: Contributors section
- **Release Notes**: Major contributions highlighted
- **Discord**: Contributor role and recognition
- **Annual Report**: Top contributors featured

Thank you for contributing to the Browser Automation Test Recorder Plugin! Your efforts help make browser testing more accessible and reliable for everyone.

---

*For more information, see our [Architecture Guide](./architecture.md) and [API Documentation](../api/README.md).*