# @sucoza/shared-components

Shared UI components for TanStack DevTools plugins, providing consistent design, functionality, and user experience across the entire DevTools ecosystem.

## Features

- 🎨 **Consistent Design** - Unified design system across all DevTools plugins
- 🧩 **Reusable Components** - Pre-built components for common DevTools functionality
- ♿ **Accessible** - WCAG compliant components with full keyboard navigation
- 🌙 **Dark Mode Support** - Built-in dark/light theme support
- 📱 **Responsive** - Mobile-friendly components and layouts
- 🔧 **Customizable** - Flexible theming and styling options
- 📝 **TypeScript First** - Full type safety and IntelliSense support

## Installation

```bash
npm install @sucoza/shared-components
# or
yarn add @sucoza/shared-components
# or
pnpm add @sucoza/shared-components
```

## Usage

### Basic Components

```tsx
import React from 'react';
import {
  Button,
  Card,
  Input,
  Badge,
  Tooltip,
  Modal
} from '@sucoza/shared-components';

function MyComponent() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card title="DevTools Panel">
      <div className="space-y-4">
        <Input
          label="Search"
          placeholder="Type to search..."
          icon="search"
        />
        
        <div className="flex gap-2">
          <Button variant="primary" size="sm">
            Primary Action
          </Button>
          <Button variant="secondary" size="sm">
            Secondary Action
          </Button>
        </div>
        
        <Badge variant="success" count={42}>
          Issues Found
        </Badge>
        
        <Tooltip content="This is a helpful tooltip">
          <Button onClick={() => setIsOpen(true)}>
            Open Modal
          </Button>
        </Tooltip>
        
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirmation"
        >
          <p>Are you sure you want to perform this action?</p>
        </Modal>
      </div>
    </Card>
  );
}
```

### DevTools Specific Components

```tsx
import React from 'react';
import {
  DevToolsPanel,
  IssueList,
  MetricCard,
  FilterBar,
  Timeline,
  DataGrid
} from '@sucoza/shared-components';

function AdvancedDevToolsPanel() {
  return (
    <DevToolsPanel
      title="My DevTools Plugin"
      actions={[
        { label: 'Refresh', icon: 'refresh', onClick: () => {} },
        { label: 'Export', icon: 'download', onClick: () => {} }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Total Issues"
          value={23}
          trend={-5}
          icon="alert-triangle"
          variant="danger"
        />
        <MetricCard
          title="Performance Score"
          value={87}
          trend={12}
          icon="zap"
          variant="success"
        />
        <MetricCard
          title="Scan Duration"
          value="1.2s"
          icon="clock"
          variant="info"
        />
      </div>
      
      <FilterBar
        filters={[
          { key: 'severity', label: 'Severity', type: 'select', options: ['all', 'critical', 'major', 'minor'] },
          { key: 'type', label: 'Type', type: 'multiselect', options: ['accessibility', 'performance', 'seo'] }
        ]}
        onFilterChange={(filters) => console.log(filters)}
      />
      
      <IssueList
        issues={issues}
        onIssueClick={(issue) => console.log(issue)}
        onIssueResolve={(issue) => console.log('Resolved:', issue)}
      />
    </DevToolsPanel>
  );
}
```

### Layout Components

```tsx
import React from 'react';
import {
  SplitPane,
  Tabs,
  Accordion,
  Sidebar
} from '@sucoza/shared-components';

function ComplexLayout() {
  return (
    <SplitPane
      split="vertical"
      defaultSize={300}
      minSize={200}
      maxSize={500}
    >
      <Sidebar
        items={[
          { id: 'overview', label: 'Overview', icon: 'home' },
          { id: 'issues', label: 'Issues', icon: 'alert-circle', badge: 12 },
          { id: 'settings', label: 'Settings', icon: 'settings' }
        ]}
        activeItem="overview"
        onItemClick={(item) => console.log(item)}
      />
      
      <div className="flex-1">
        <Tabs
          defaultTab="results"
          tabs={[
            {
              id: 'results',
              label: 'Results',
              content: <ResultsPanel />
            },
            {
              id: 'history',
              label: 'History',
              content: <HistoryPanel />
            },
            {
              id: 'analytics',
              label: 'Analytics',
              content: <AnalyticsPanel />
            }
          ]}
        />
      </div>
    </SplitPane>
  );
}
```

## Component Library

### Form Components

- **Input** - Text input with validation and icons
- **Select** - Dropdown selection component
- **Checkbox** - Checkbox with label and description
- **Radio** - Radio button groups
- **Switch** - Toggle switch component
- **Textarea** - Multi-line text input
- **FormField** - Wrapper for form controls with validation

### Action Components

- **Button** - Primary action component with variants
- **IconButton** - Icon-only button
- **ButtonGroup** - Grouped buttons
- **DropdownMenu** - Dropdown action menu
- **ContextMenu** - Right-click context menu

### Display Components

- **Card** - Container component with header/footer
- **Badge** - Small status indicators
- **Tag** - Removable tags
- **Avatar** - User/item avatar display
- **Progress** - Progress bars and indicators
- **Spinner** - Loading spinner
- **Empty** - Empty state placeholder

### Feedback Components

- **Toast** - Temporary notification messages
- **Alert** - Persistent alert messages
- **Modal** - Dialog/modal components
- **Tooltip** - Hover tooltips
- **Popover** - Click-triggered popovers
- **Confirm** - Confirmation dialogs

### Navigation Components

- **Tabs** - Tab navigation
- **Breadcrumb** - Breadcrumb navigation
- **Pagination** - Page navigation
- **Steps** - Step-by-step navigation

### Layout Components

- **SplitPane** - Resizable split panes
- **Sidebar** - Collapsible sidebar
- **Header** - Page/section headers
- **Footer** - Page/section footers
- **Grid** - CSS Grid wrapper
- **Stack** - Flexbox stack layout

### Data Components

- **DataGrid** - Feature-rich data table
- **List** - Simple list component
- **Tree** - Hierarchical tree view
- **Timeline** - Event timeline
- **Chart** - Basic chart components

### DevTools Specific

- **DevToolsPanel** - Main plugin panel wrapper
- **IssueList** - Standardized issue display
- **MetricCard** - Metric/KPI display cards
- **FilterBar** - Advanced filtering interface
- **CodeBlock** - Syntax-highlighted code display
- **JsonViewer** - JSON data viewer
- **LogViewer** - Log file viewer

## Theming

### Using the Theme Provider

```tsx
import React from 'react';
import { ThemeProvider, createTheme } from '@sucoza/shared-components';

const customTheme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  fonts: {
    sans: ['Inter', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  }
});

function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <MyComponents />
    </ThemeProvider>
  );
}
```

### Dark Mode Support

```tsx
import React from 'react';
import { useDarkMode } from '@sucoza/shared-components';

function DarkModeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      icon={isDark ? 'sun' : 'moon'}
    >
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </Button>
  );
}
```

### Custom Styling

```tsx
import React from 'react';
import { Button, styled } from '@sucoza/shared-components';

// Using styled components
const CustomButton = styled(Button)`
  background: linear-gradient(45deg, #fe6b8b 30%, #ff8e53 90%);
  border: 0;
  color: white;
  height: 48px;
  padding: 0 30px;
  box-shadow: 0 3px 5px 2px rgba(255, 105, 135, .3);
`;

// Using CSS classes
function MyComponent() {
  return (
    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      Gradient Button
    </Button>
  );
}
```

## Icons

The shared components include a comprehensive icon library based on Lucide React.

```tsx
import React from 'react';
import { Icon, Button } from '@sucoza/shared-components';

function IconExamples() {
  return (
    <div>
      <Icon name="search" size={24} />
      <Icon name="alert-triangle" color="red" />
      
      <Button icon="download" variant="primary">
        Download
      </Button>
      
      <Button icon="settings" variant="ghost" size="icon" />
    </div>
  );
}
```

Available icon sets:
- **General**: home, settings, search, filter, etc.
- **Actions**: save, delete, edit, copy, etc.
- **Status**: check, x, alert-triangle, info, etc.
- **Navigation**: arrow-left, arrow-right, chevron-down, etc.
- **DevTools**: bug, code, database, server, etc.

## Accessibility

All components are built with accessibility in mind:

- Full keyboard navigation support
- ARIA labels and descriptions
- Screen reader compatibility
- High contrast mode support
- Focus management
- Semantic HTML structure

```tsx
import React from 'react';
import { Button, Modal } from '@sucoza/shared-components';

function AccessibleModal() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        aria-describedby="modal-description"
      >
        Open Accessible Modal
      </Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Accessible Modal"
        aria-describedby="modal-content"
        closeOnEscapeKey
        closeOnOverlayClick
        returnFocusOnClose
        trapFocus
      >
        <div id="modal-content">
          <p>This modal is fully accessible with proper focus management.</p>
        </div>
      </Modal>
    </>
  );
}
```

## Examples

Check out the `examples/` directory for:
- Component showcase
- Theming examples
- Layout patterns
- DevTools integration examples

To run the examples:

```bash
cd examples
npm install
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-component`)
3. Commit your changes (`git commit -m 'Add new component'`)
4. Push to the branch (`git push origin feature/new-component`)
5. Open a Pull Request

### Component Guidelines

When creating new components:

1. Follow the existing design patterns
2. Include proper TypeScript definitions
3. Add comprehensive accessibility support
4. Write tests for component behavior
5. Document props and usage examples
6. Support both light and dark themes

## License

MIT © tyevco

---

Part of the @sucoza TanStack DevTools ecosystem.

## Related Packages

- [@sucoza/devtools-common](../devtools-common) - Common utilities and types
- [@sucoza/plugin-core](../plugin-core) - Core plugin infrastructure
- [@sucoza/devtools-importer](../devtools-importer) - Simplified plugin importing