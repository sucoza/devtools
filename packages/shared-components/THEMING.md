# TanStack DevTools Theming System

This document describes the unified theming system for all TanStack DevTools plugins.

## Overview

The shared-components package now provides a comprehensive theming system with:

- **Consistent Design Tokens**: Standardized colors, typography, spacing across all plugins
- **Light/Dark Theme Support**: Automatic support for both themes
- **CSS Utility Classes**: Pre-built classes for common patterns
- **Theme Provider**: React context for theme management

## Quick Start

### 1. Import Shared Components

When you import from `@sucoza/shared-components`, the theme CSS is automatically included:

```tsx
import { ThemeProvider, useTheme } from '@sucoza/shared-components';
```

### 2. Wrap Your Plugin with ThemeProvider

```tsx
import { ThemeProvider } from '@sucoza/shared-components';

export const MyDevToolsPanel = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <MyPluginContent />
    </ThemeProvider>
  );
};
```

### 3. Use Theme-Aware CSS Classes

Apply `data-theme` attribute and use CSS custom properties:

```tsx
import { useTheme } from '@sucoza/shared-components';

const MyComponent = () => {
  const { theme } = useTheme();

  return (
    <div className="dt-plugin-panel" data-theme={theme}>
      <div className="dt-header">
        <h2>My Plugin</h2>
      </div>
      <div className="dt-content">
        {/* Your content here */}
      </div>
    </div>
  );
};
```

## CSS Custom Properties

The theme system provides CSS custom properties that automatically adapt to the selected theme:

### Colors

```css
/* Background Colors */
--dt-bg-primary        /* Main background */
--dt-bg-secondary      /* Elevated surfaces */
--dt-bg-tertiary       /* Interactive elements */
--dt-bg-selected       /* Selected items */
--dt-bg-hover          /* Hover overlay */

/* Border Colors */
--dt-border-primary    /* Main borders */
--dt-border-secondary  /* Secondary borders */
--dt-border-focus      /* Focus indicators */

/* Text Colors */
--dt-text-primary      /* Primary text */
--dt-text-secondary    /* Secondary text */
--dt-text-muted        /* Muted text */
--dt-text-heading      /* Headings */
--dt-text-accent       /* Accent text */

/* Status Colors */
--dt-color-success     /* Success state */
--dt-color-warning     /* Warning state */
--dt-color-error       /* Error state */
--dt-color-info        /* Info state */
```

## CSS Utility Classes

### Layout Classes

```html
<!-- Base plugin container -->
<div class="dt-plugin-panel" data-theme="light">

  <!-- Header -->
  <div class="dt-header">
    <h2>Plugin Title</h2>
  </div>

  <!-- Main content area -->
  <div class="dt-content">
    <!-- Scrollable content -->
  </div>

  <!-- Section card -->
  <div class="dt-section">
    <div class="dt-section-header">
      <h3>Section Title</h3>
    </div>
    <!-- Section content -->
  </div>
</div>
```

### Tabs

```html
<div class="dt-tabs">
  <button class="dt-tab active">Active Tab</button>
  <button class="dt-tab">Inactive Tab</button>
</div>
```

### Buttons

```html
<!-- Default button -->
<button class="dt-btn">Default</button>

<!-- Primary button -->
<button class="dt-btn dt-btn-primary">Primary</button>

<!-- Success button -->
<button class="dt-btn dt-btn-success">Success</button>

<!-- Danger button -->
<button class="dt-btn dt-btn-danger">Danger</button>

<!-- Small button -->
<button class="dt-btn dt-btn-sm">Small</button>

<!-- Icon button -->
<button class="dt-btn dt-btn-icon">
  <Icon />
</button>
```

### Cards & Stats

```html
<!-- Stats grid -->
<div class="dt-stats-grid">
  <div class="dt-stat-card clickable">
    <h3>Total Items</h3>
    <div class="dt-stat-value">123</div>
    <div class="dt-stat-details">
      <span class="dt-status-success">+12%</span>
    </div>
  </div>
</div>

<!-- Regular card -->
<div class="dt-card">
  Card content
</div>

<!-- Selected card -->
<div class="dt-card selected">
  Selected card
</div>
```

### Forms

```html
<div class="dt-form-group">
  <label>Field Label</label>
  <input type="text" class="dt-input" />
</div>

<div class="dt-form-group">
  <label>Select Field</label>
  <select class="dt-select">
    <option>Option 1</option>
  </select>
</div>
```

### Badges

```html
<span class="dt-badge dt-badge-success">Success</span>
<span class="dt-badge dt-badge-warning">Warning</span>
<span class="dt-badge dt-badge-error">Error</span>
<span class="dt-badge dt-badge-info">Info</span>
```

### Utility Classes

```html
<!-- Flexbox -->
<div class="dt-flex dt-items-center dt-justify-between dt-gap-4">
  Flex container
</div>

<!-- Spacing -->
<div class="dt-mb-4 dt-p-6">
  With margin and padding
</div>

<!-- Text -->
<p class="dt-text-md dt-font-semibold dt-text-secondary">
  Styled text
</p>

<!-- Status colors -->
<span class="dt-status-success">Success text</span>
<span class="dt-status-error">Error text</span>
```

## TypeScript/React Integration

### Using Theme in Code

```tsx
import { useTheme, getColors, getComponentStyles } from '@sucoza/shared-components';

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const colors = getColors(theme);
  const styles = getComponentStyles(theme);

  return (
    <div style={styles.container.base}>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <div style={{ color: colors.text.primary }}>
        Themed text
      </div>
    </div>
  );
};
```

### Without ThemeProvider

If you don't wrap your component with ThemeProvider, you can still use the theme system:

```tsx
import { useThemeOptional, getColors } from '@sucoza/shared-components';

const MyComponent = () => {
  // Falls back to 'dark' if no provider exists
  const theme = useThemeOptional('dark');
  const colors = getColors(theme);

  // Or just use CSS classes and manually set data-theme
  return (
    <div className="dt-plugin-panel" data-theme="dark">
      <div className="dt-header">
        <h2>My Plugin</h2>
      </div>
    </div>
  );
};
```

## Migration Guide

### Replacing Custom CSS

If your plugin has custom CSS, follow these steps:

1. **Replace root element classes**:
   ```tsx
   // Before
   <div className="my-plugin-panel">

   // After
   <div className="dt-plugin-panel" data-theme={theme}>
   ```

2. **Replace custom button classes**:
   ```html
   <!-- Before -->
   <button class="btn btn-primary">Click me</button>

   <!-- After -->
   <button class="dt-btn dt-btn-primary">Click me</button>
   ```

3. **Replace custom color variables**:
   ```css
   /* Before */
   background: #3b82f6;
   color: #1f2937;

   /* After */
   background: var(--dt-border-focus);
   color: var(--dt-text-primary);
   ```

4. **Remove custom CSS file** after verification

### Example: Full Plugin Conversion

**Before** (custom CSS):
```css
.my-plugin {
  background: #fff;
  color: #333;
}

.my-button {
  background: #3b82f6;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
}
```

```tsx
import './styles.css';

export const MyPlugin = () => (
  <div className="my-plugin">
    <button className="my-button">Click</button>
  </div>
);
```

**After** (using theme system):
```tsx
import { ThemeProvider, useTheme } from '@sucoza/shared-components';

export const MyPlugin = () => (
  <ThemeProvider defaultTheme="light">
    <MyPluginContent />
  </ThemeProvider>
);

const MyPluginContent = () => {
  const { theme } = useTheme();

  return (
    <div className="dt-plugin-panel" data-theme={theme}>
      <button className="dt-btn dt-btn-primary">Click</button>
    </div>
  );
};
```

## Benefits

- ✅ **Consistent styling** across all plugins
- ✅ **Automatic theme support** (light/dark)
- ✅ **Reduced code** - no custom CSS needed
- ✅ **Better maintainability** - centralized theming
- ✅ **TypeScript support** - type-safe colors and styles
- ✅ **Responsive** - mobile-friendly utilities
- ✅ **Accessible** - WCAG-compliant colors
