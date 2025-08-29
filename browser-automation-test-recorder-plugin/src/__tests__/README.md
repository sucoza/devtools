# Browser Automation Test Recorder Plugin - Test Suite

This comprehensive test suite ensures the reliability, performance, and quality of the Browser Automation Test Recorder DevTools plugin.

## 🧪 Test Structure

The test suite is organized into several categories, each focusing on different aspects of the plugin:

```
src/__tests__/
├── __mocks__/                    # Mock implementations and test data factories
│   ├── chrome-devtools-protocol.ts    # CDP API mocks
│   ├── playwright.ts                  # Playwright mock
│   └── test-data-factory.ts          # Test data generation utilities
├── unit/                         # Unit tests for individual components
│   ├── core/                     # Core functionality tests
│   │   ├── devtools-store.test.ts     # Zustand store tests
│   │   ├── selector-engine.test.ts    # Selector generation tests
│   │   ├── recorder.test.ts           # Event recording tests
│   │   └── generators/               # Code generator tests
│   │       └── playwright-generator.test.ts
│   └── utils/                    # Utility function tests
├── integration/                  # Integration tests for workflows
│   └── recording-workflow.test.ts     # End-to-end recording flow
├── components/                   # React component tests
│   └── BrowserAutomationPanel.test.tsx # Main panel component
├── e2e/                         # End-to-end browser tests
│   ├── playwright.config.ts           # E2E test configuration
│   └── browser-automation.spec.ts     # Real browser automation tests
└── performance/                  # Performance and load tests
    └── plugin-performance.test.ts     # Scalability and memory tests
```

## 🚀 Test Categories

### Unit Tests (`unit/`)
Tests individual classes, functions, and modules in isolation.

**Coverage Areas:**
- **DevTools Store**: State management, actions, and data flow
- **Selector Engine**: Smart selector generation and validation
- **Event Recorder**: DOM event capture and processing
- **Code Generators**: Test code generation for different frameworks
- **Utility Functions**: Helper functions and utilities

**Running Unit Tests:**
```bash
npm run test:unit
```

### Integration Tests (`integration/`)
Tests the interaction between different components and complete workflows.

**Coverage Areas:**
- Recording → Processing → Code Generation workflow
- Store integration with recording components
- Event processing pipeline
- Error handling and recovery

**Running Integration Tests:**
```bash
npm run test:integration
```

### Component Tests (`components/`)
Tests React UI components with focus on user interactions and accessibility.

**Coverage Areas:**
- Component rendering and state management
- User interaction handling (clicks, form input, etc.)
- Accessibility compliance (ARIA, keyboard navigation)
- Responsive design and theme support
- Error states and loading indicators

**Running Component Tests:**
```bash
npm run test:components
```

### End-to-End Tests (`e2e/`)
Tests the complete plugin functionality in real browser environments.

**Coverage Areas:**
- Plugin installation and initialization
- Real browser interaction recording
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile device testing
- Visual regression testing
- Performance monitoring

**Running E2E Tests:**
```bash
npm run test:e2e

# With UI for debugging
npm run test:e2e:ui
```

### Performance Tests (`performance/`)
Tests plugin performance, scalability, and resource usage.

**Coverage Areas:**
- Event recording performance under load
- Code generation speed with large datasets
- Memory usage and garbage collection
- Concurrent operation handling
- Stress testing with rapid user interactions

**Running Performance Tests:**
```bash
npm run test:performance
```

## 🛠️ Test Utilities

### Mock Factories (`__mocks__/test-data-factory.ts`)
Provides utilities for creating consistent test data:

```typescript
import { 
  createMockRecordedEvent,
  createMockLoginFlow,
  createMockUserFlow,
  resetCounters 
} from './__mocks__/test-data-factory';

// Create a single click event
const clickEvent = createMockRecordedEvent('click');

// Create a complete login flow
const loginEvents = createMockLoginFlow();

// Create custom user flow
const customFlow = createMockUserFlow(['navigation', 'click', 'input', 'submit']);
```

### Chrome DevTools Protocol Mocks (`__mocks__/chrome-devtools-protocol.ts`)
Mocks CDP interactions for testing browser automation features:

```typescript
import { createMockCDPClient, createMockCDPSession } from './__mocks__/chrome-devtools-protocol';

const mockClient = createMockCDPClient();
const mockSession = createMockCDPSession();
```

### Playwright Mocks (`__mocks__/playwright.ts`)
Provides mock implementations for Playwright APIs:

```typescript
import { mockPage, mockBrowser, mockPlaywright } from './__mocks__/playwright';
```

## 📊 Coverage and Quality

### Coverage Targets
The test suite maintains high code coverage standards:

- **Overall Coverage**: 90%+ lines, 85%+ branches
- **Core Components**: 95%+ lines, 90%+ branches  
- **UI Components**: 85%+ lines, 80%+ branches

### Quality Metrics
- **Mutation Testing**: Tests are validated against code mutations
- **Performance Benchmarks**: Response time and memory usage limits
- **Accessibility Testing**: WCAG 2.1 compliance verification
- **Cross-Browser Testing**: Chrome, Firefox, Safari, and mobile browsers

### Running Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
npm run test:coverage:ui
```

## 🎯 Testing Best Practices

### 1. Test Structure
Each test follows the AAA pattern:
```typescript
// Arrange - Set up test data and mocks
const mockEvent = createMockRecordedEvent('click');
const recorder = new EventRecorder(mockSelectorEngine, mockDevToolsClient);

// Act - Perform the action being tested
await recorder.handleDOMEvent(mockEvent);

// Assert - Verify the expected outcome
expect(recorder.getRecordedEvents()).toHaveLength(1);
```

### 2. Mock Strategy
- **Unit Tests**: Mock all external dependencies
- **Integration Tests**: Mock only external APIs (CDP, network)
- **E2E Tests**: Use real browser environments

### 3. Test Data Management
- Use factory functions for consistent test data
- Reset counters and state between tests
- Isolate tests from each other

### 4. Async Testing
Handle asynchronous operations properly:
```typescript
// Wait for async operations
await recorder.start();
await recorder.handleDOMEvent(event);
const results = await recorder.stop();

// Use act() for React state updates
act(() => {
  result.current.addEvent(mockEvent);
});
```

### 5. Error Testing
Test both success and failure scenarios:
```typescript
// Test error handling
mockSelectorEngine.generateSelector.mockRejectedValue(new Error('Selector failed'));
await expect(recorder.handleDOMEvent(event)).not.toThrow();
```

## 🔧 Configuration Files

### Vitest Configuration (`vitest.config.ts`)
Main test runner configuration with coverage settings and test environment setup.

### Playwright Configuration (`e2e/playwright.config.ts`)
E2E test configuration with multi-browser support and reporting.

### Jest Configuration (`jest.config.js`)
Additional coverage reporting and HTML report generation.

### SonarCloud Configuration (`sonar-project.properties`)
Code quality analysis and technical debt tracking.

## 🚀 Continuous Integration

### GitHub Actions (`.github/workflows/ci.yml`)
Automated testing pipeline:

1. **Test Phase**: Unit, integration, component tests
2. **E2E Phase**: Cross-browser end-to-end testing
3. **Performance Phase**: Load testing and benchmarks
4. **Security Phase**: Vulnerability scanning
5. **Quality Phase**: Code quality analysis
6. **Build Phase**: Production build verification
7. **Release Phase**: Automated publishing

### Pre-commit Hooks
- Linting and formatting
- Type checking
- Unit test execution
- Coverage validation

## 📝 Writing New Tests

### Adding Unit Tests
1. Create test file in appropriate `unit/` subdirectory
2. Import necessary utilities and mocks
3. Follow existing test patterns
4. Ensure proper cleanup in `afterEach`

### Adding Component Tests
1. Create test file in `components/` directory
2. Use `@testing-library/react` for rendering
3. Test user interactions with `@testing-library/user-event`
4. Verify accessibility with appropriate queries

### Adding E2E Tests
1. Add test cases to `e2e/browser-automation.spec.ts`
2. Use real browser interactions
3. Test across multiple browsers
4. Include visual regression checks

### Adding Performance Tests
1. Create test file in `performance/` directory
2. Measure timing and memory usage
3. Set reasonable performance expectations
4. Test with realistic data volumes

## 🔍 Debugging Tests

### Local Development
```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test src/__tests__/unit/core/recorder.test.ts

# Debug with UI
npm run test:ui
```

### E2E Test Debugging
```bash
# Run E2E tests with UI for debugging
npm run test:e2e:ui

# Run in headed mode
npx playwright test --headed

# Generate test reports
npx playwright show-report
```

### Performance Debugging
```bash
# Run performance tests with detailed output
npm run test:performance -- --reporter=verbose

# Profile memory usage
node --inspect node_modules/.bin/vitest run src/__tests__/performance/
```

## 📈 Test Metrics and Reporting

### Coverage Reports
- HTML reports: `coverage/index.html`
- LCOV format: `coverage/lcov.info`
- JSON summary: `coverage/coverage-summary.json`

### Performance Benchmarks
- Response time measurements
- Memory usage tracking
- Throughput analysis
- Load testing results

### Quality Reports
- SonarCloud analysis
- Technical debt tracking
- Code complexity metrics
- Maintainability scores

## 🤝 Contributing to Tests

When contributing to the test suite:

1. **Write tests first** for new features (TDD approach)
2. **Maintain coverage** above minimum thresholds
3. **Test edge cases** and error conditions
4. **Document complex test scenarios**
5. **Keep tests fast and reliable**
6. **Update this README** when adding new test categories

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

---

*This test suite ensures the Browser Automation Test Recorder plugin maintains high quality, performance, and reliability standards across all supported environments and use cases.*