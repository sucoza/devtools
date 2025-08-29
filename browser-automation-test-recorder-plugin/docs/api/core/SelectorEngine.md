# SelectorEngine API

The `SelectorEngine` class provides intelligent selector generation with auto-healing capabilities, multiple fallback strategies, and confidence scoring. It's designed to create reliable selectors that remain stable even when the DOM structure changes.

## Class Definition

```typescript
export class SelectorEngine {
  constructor(options?: Partial<SelectorEngineOptions>);
}
```

## Constructor Parameters

### options: `Partial<SelectorEngineOptions>`

Optional configuration object for customizing selector generation behavior.

```typescript
interface SelectorEngineOptions {
  preferredAttributes: string[];        // Attributes to prioritize for selector generation
  enableHealing: boolean;              // Enable auto-healing for broken selectors
  healingStrategies: HealingStrategy[]; // Strategies for healing broken selectors
  confidenceThreshold: number;         // Minimum confidence score (0-1)
  maxDepth: number;                   // Maximum DOM traversal depth
  enableCaching: boolean;             // Enable selector result caching
  cacheSize: number;                  // Maximum cache entries
  allowXPath: boolean;                // Allow XPath selector generation
  allowCSS: boolean;                  // Allow CSS selector generation
  fallbackCount: number;              // Number of fallback selectors to generate
}
```

**Default Options:**
```typescript
const defaultOptions: SelectorEngineOptions = {
  preferredAttributes: ['data-testid', 'data-cy', 'data-test', 'id', 'name'],
  enableHealing: true,
  healingStrategies: ['text', 'attributes', 'position', 'hierarchy'],
  confidenceThreshold: 0.8,
  maxDepth: 10,
  enableCaching: true,
  cacheSize: 500,
  allowXPath: true,
  allowCSS: true,
  fallbackCount: 3
};
```

## Methods

### generateSelector(element: Element, options?: GenerationOptions): Promise<GeneratedSelector>

Generates a comprehensive selector object for the given DOM element.

**Parameters:**
- `element`: The target DOM element
- `options`: Optional generation-specific overrides

**Returns:** Promise<GeneratedSelector> - Complete selector information

```typescript
interface GeneratedSelector {
  primary: string;              // Primary selector (highest confidence)
  fallbacks: string[];          // Alternative selectors
  xpath?: string;               // XPath selector if enabled
  confidence: number;           // Confidence score (0-1)
  healing: boolean;            // Whether healing is enabled
  strategy: SelectorStrategy;   // Strategy used for primary selector
  metadata: SelectorMetadata;   // Additional metadata
}

interface GenerationOptions {
  preferText?: boolean;         // Prioritize text-based selectors
  requireStable?: boolean;      // Only generate stable selectors
  allowPartial?: boolean;       // Allow partial matches
  context?: Element;            // Restrict generation to context element
}
```

**Example:**
```typescript
const element = document.querySelector('[data-testid="submit-button"]');
const selector = await selectorEngine.generateSelector(element);

console.log(selector);
// {
//   primary: '[data-testid="submit-button"]',
//   fallbacks: ['button.btn-primary', '#submit', 'button:contains("Submit")'],
//   xpath: '//button[@data-testid="submit-button"]',
//   confidence: 0.95,
//   healing: true,
//   strategy: 'data-attribute',
//   metadata: { ... }
// }
```

---

### validateSelector(selector: string, expectedElement?: Element): Promise<ValidationResult>

Validates that a selector correctly identifies the expected element.

**Parameters:**
- `selector`: The selector string to validate
- `expectedElement`: Optional element that selector should match

**Returns:** Promise<ValidationResult> - Validation results

```typescript
interface ValidationResult {
  isValid: boolean;             // Whether selector is valid
  matches: Element[];           // Elements matched by selector
  isUnique: boolean;           // Whether selector matches exactly one element
  confidence: number;           // Confidence in selector reliability
  issues: ValidationIssue[];    // Any problems found
}

interface ValidationIssue {
  type: 'ambiguous' | 'unstable' | 'invalid' | 'performance';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}
```

**Example:**
```typescript
const result = await selectorEngine.validateSelector('[data-testid="button"]');

if (!result.isValid) {
  console.error('Selector validation failed:');
  result.issues.forEach(issue => {
    console.log(`${issue.severity}: ${issue.message}`);
  });
}
```

---

### healSelector(selector: string, context?: Element): Promise<HealingResult>

Attempts to heal a broken selector by finding the best alternative.

**Parameters:**
- `selector`: The broken selector to heal
- `context`: Optional context element to limit healing scope

**Returns:** Promise<HealingResult> - Healing results

```typescript
interface HealingResult {
  success: boolean;             // Whether healing was successful
  healedSelector: string | null; // New selector if healing succeeded
  strategy: HealingStrategy;    // Strategy used for healing
  confidence: number;           // Confidence in healed selector
  originalMatches: number;      // Elements matched by original selector
  healedMatches: number;        // Elements matched by healed selector
}

type HealingStrategy = 'text' | 'attributes' | 'position' | 'hierarchy' | 'similar';
```

**Example:**
```typescript
// Original selector no longer works
const brokenSelector = '#old-button-id';

const healing = await selectorEngine.healSelector(brokenSelector);

if (healing.success) {
  console.log(`Healed selector: ${healing.healedSelector}`);
  console.log(`Strategy: ${healing.strategy}`);
  console.log(`Confidence: ${healing.confidence}`);
} else {
  console.log('Could not heal selector');
}
```

---

### findElements(selector: string, context?: Element): Promise<ElementMatch[]>

Finds all elements matching a selector with detailed matching information.

**Parameters:**
- `selector`: CSS selector or XPath expression
- `context`: Optional context element to limit search scope

**Returns:** Promise<ElementMatch[]> - Array of matching elements with metadata

```typescript
interface ElementMatch {
  element: Element;             // The matched DOM element
  confidence: number;           // Match confidence score
  strategy: string;             // Matching strategy used
  metadata: {
    path: string;               // DOM path to element
    attributes: Record<string, string>; // Element attributes
    textContent: string;        // Element text content
    boundingRect: DOMRect;      // Element position and size
  };
}
```

**Example:**
```typescript
const matches = await selectorEngine.findElements('button[type="submit"]');

matches.forEach(match => {
  console.log(`Found button: ${match.element.textContent}`);
  console.log(`Confidence: ${match.confidence}`);
  console.log(`Position: ${match.metadata.boundingRect.x}, ${match.metadata.boundingRect.y}`);
});
```

---

### optimizeSelector(selector: string): Promise<string>

Optimizes a selector for better performance and reliability.

**Parameters:**
- `selector`: The selector to optimize

**Returns:** Promise<string> - Optimized selector

**Example:**
```typescript
const original = 'html > body > div:nth-child(1) > div:nth-child(2) > button:nth-child(3)';
const optimized = await selectorEngine.optimizeSelector(original);

console.log(`Original: ${original}`);
console.log(`Optimized: ${optimized}`);
// Might output: '[data-testid="submit-button"]' or 'button.btn-primary'
```

---

### getSelectorStrategies(): SelectorStrategy[]

Returns all available selector generation strategies.

**Returns:** SelectorStrategy[] - Array of available strategies

```typescript
interface SelectorStrategy {
  name: string;                 // Strategy name
  priority: number;             // Priority order (higher = more preferred)
  description: string;          // Human-readable description
  enabled: boolean;             // Whether strategy is currently enabled
}
```

**Example:**
```typescript
const strategies = selectorEngine.getSelectorStrategies();

strategies.forEach(strategy => {
  console.log(`${strategy.name}: ${strategy.description} (priority: ${strategy.priority})`);
});
```

---

### clearCache(): void

Clears the internal selector cache.

**Example:**
```typescript
// Clear cache after DOM changes
selectorEngine.clearCache();
```

---

### getStats(): SelectorEngineStats

Returns statistics about selector engine performance and usage.

**Returns:** SelectorEngineStats - Usage statistics

```typescript
interface SelectorEngineStats {
  totalSelectors: number;       // Total selectors generated
  cacheHits: number;           // Cache hit count
  cacheMisses: number;         // Cache miss count
  healingAttempts: number;     // Healing attempts made
  healingSuccesses: number;    // Successful healing operations
  averageConfidence: number;   // Average confidence score
  strategyCounts: Record<string, number>; // Usage count by strategy
}
```

**Example:**
```typescript
const stats = selectorEngine.getStats();
console.log(`Generated ${stats.totalSelectors} selectors`);
console.log(`Cache hit rate: ${(stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100).toFixed(2)}%`);
console.log(`Healing success rate: ${(stats.healingSuccesses / stats.healingAttempts * 100).toFixed(2)}%`);
```

## Properties

### options: SelectorEngineOptions (readonly)

Current configuration options.

**Example:**
```typescript
console.log('Preferred attributes:', selectorEngine.options.preferredAttributes);
console.log('Healing enabled:', selectorEngine.options.enableHealing);
```

### cacheSize: number (readonly)

Current number of cached selectors.

**Example:**
```typescript
console.log(`Cache contains ${selectorEngine.cacheSize} selectors`);
```

## Advanced Usage

### Custom Selector Strategies

Register custom selector generation strategies:

```typescript
class CustomStrategy implements SelectorStrategy {
  name = 'custom-data-attributes';
  priority = 100;
  description = 'Uses custom data-* attributes';
  enabled = true;

  async generate(element: Element): Promise<string | null> {
    // Custom logic to generate selector
    const customAttr = element.getAttribute('data-custom-id');
    return customAttr ? `[data-custom-id="${customAttr}"]` : null;
  }

  async validate(selector: string): Promise<boolean> {
    // Validation logic
    return selector.includes('data-custom-id');
  }
}

// Register the strategy
selectorEngine.registerStrategy(new CustomStrategy());
```

### Context-Aware Generation

Generate selectors within specific contexts:

```typescript
const modal = document.querySelector('.modal');
const button = modal.querySelector('button');

// Generate selector that works within the modal context
const selector = await selectorEngine.generateSelector(button, {
  context: modal,
  requireStable: true
});

// Result might be: '.modal button[type="submit"]' instead of a global selector
```

### Batch Processing

Process multiple elements efficiently:

```typescript
const elements = document.querySelectorAll('[data-interactive]');
const selectors = await Promise.all(
  Array.from(elements).map(element => 
    selectorEngine.generateSelector(element)
  )
);

selectors.forEach((selector, index) => {
  console.log(`Element ${index}: ${selector.primary} (confidence: ${selector.confidence})`);
});
```

### Healing Strategies

Configure different healing strategies:

```typescript
const engine = new SelectorEngine({
  healingStrategies: [
    'text',        // Match by text content
    'attributes',  // Match by similar attributes
    'position',    // Match by DOM position
    'hierarchy',   // Match by parent hierarchy
    'similar'      // Match by similar elements
  ]
});

// Healing will try strategies in order until one succeeds
```

### Performance Optimization

Optimize for large DOMs:

```typescript
const optimizedEngine = new SelectorEngine({
  maxDepth: 5,              // Limit traversal depth
  enableCaching: true,      // Cache results
  cacheSize: 1000,         // Larger cache for better hit rate
  confidenceThreshold: 0.9, // Higher threshold for better quality
  fallbackCount: 2         // Fewer fallbacks for better performance
});
```

## Error Handling

Handle selector generation errors:

```typescript
try {
  const selector = await selectorEngine.generateSelector(element);
} catch (error) {
  if (error instanceof SelectorError) {
    switch (error.code) {
      case 'ELEMENT_NOT_FOUND':
        console.error('Element is not in DOM');
        break;
      case 'NO_STABLE_SELECTOR':
        console.warn('Could not generate stable selector');
        break;
      case 'CONFIDENCE_TOO_LOW':
        console.warn('Generated selector has low confidence');
        break;
      default:
        console.error('Selector generation failed:', error.message);
    }
  }
}
```

## Integration with EventRecorder

The SelectorEngine integrates seamlessly with EventRecorder:

```typescript
const selectorEngine = new SelectorEngine({
  preferredAttributes: ['data-testid', 'data-cy'],
  enableHealing: true
});

const recorder = new EventRecorder(selectorEngine, eventClient);

// Events will automatically include high-quality selectors
await recorder.start();
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Selectors | ✅ | ✅ | ✅ | ✅ |
| XPath Selectors | ✅ | ✅ | ✅ | ✅ |
| Shadow DOM | ✅ | ✅ | ⚠️ | ✅ |
| Healing | ✅ | ✅ | ✅ | ✅ |
| Performance APIs | ✅ | ✅ | ⚠️ | ✅ |

**Legend:**
- ✅ Full support
- ⚠️ Limited support

## Best Practices

### Selector Priority

Configure attributes in order of stability:

```typescript
const engine = new SelectorEngine({
  preferredAttributes: [
    'data-testid',      // Most stable - dedicated test IDs
    'data-cy',          // Cypress test attributes
    'data-test',        // Generic test attributes
    'id',               // Stable if properly managed
    'name',             // Good for form elements
    'class'             // Least stable - styling concerns
  ]
});
```

### Confidence Thresholds

Set appropriate confidence levels:

```typescript
// High-confidence selectors only (production)
const production = new SelectorEngine({
  confidenceThreshold: 0.9
});

// Lower threshold for development/testing
const development = new SelectorEngine({
  confidenceThreshold: 0.7
});
```

### Regular Validation

Periodically validate existing selectors:

```typescript
async function validateExistingSelectors(selectors: string[]) {
  const results = await Promise.all(
    selectors.map(selector => 
      selectorEngine.validateSelector(selector)
    )
  );

  const invalid = results.filter(result => !result.isValid);
  if (invalid.length > 0) {
    console.warn(`Found ${invalid.length} invalid selectors`);
    // Trigger healing process
  }
}
```

---

*For more information on selector strategies and best practices, see the [Selector Guide](../../guides/selector-strategies.md) and [Testing Best Practices](../../guides/best-practices.md).*