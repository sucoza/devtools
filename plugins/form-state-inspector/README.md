# Form State Inspector - TanStack DevTools Plugin

A comprehensive form debugging and state management visualization tool for TanStack DevTools. Monitor, debug, and optimize your forms with real-time insights, validation tracking, and performance metrics.

## Features

### Core Capabilities
- 🔍 **Real-time Field Tracking** - Monitor all form field values as they change
- ✅ **Validation State Visualization** - See validation errors, warnings, and success states
- 📊 **Performance Metrics** - Track validation time, render counts, and form interactions
- 🕐 **Field History Timeline** - Complete history with undo/redo capabilities
- 🎭 **Form Replay** - Record and replay form interactions
- 🧪 **Mock Data Testing** - Auto-fill forms with realistic test data
- ♿ **Accessibility Audit** - Identify and fix accessibility issues
- 📤 **Submission Tracking** - Monitor form submissions and their outcomes

### Form Library Support
- React Hook Form
- Formik
- Native HTML Forms
- Custom form implementations

### Validation Schema Support
- Yup
- Zod
- Joi
- Custom validators

## Installation

```bash
npm install form-state-inspector-tanstack-devtools-plugin
```

## Quick Start

### 1. Basic Setup

```tsx
import { formStateInspectorPlugin } from 'form-state-inspector-tanstack-devtools-plugin';
import { TanStackDevtools } from '@tanstack/react-devtools';

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools 
        initialIsOpen={false}
        plugins={[formStateInspectorPlugin]}
      />
    </>
  );
}
```

Or if you want to use it alongside other plugins:

```tsx
import { formStateInspectorPlugin } from 'form-state-inspector-tanstack-devtools-plugin';
import { otherPlugin } from 'other-tanstack-plugin';
import { TanStackDevtools } from '@tanstack/react-devtools';

<TanStackDevtools 
  plugins={[
    formStateInspectorPlugin,
    otherPlugin,
    // ... other plugins
  ]}
/>
```

### 2. Manual Form Tracking

```tsx
import { registerForm, updateField, validateField } from 'form-state-inspector-tanstack-devtools-plugin';

// Register a form
useEffect(() => {
  registerForm('my-form');
  
  return () => {
    unregisterForm('my-form');
  };
}, []);

// Update field state
const handleChange = (fieldName: string, value: any) => {
  updateField('my-form', fieldName, {
    value,
    isDirty: true,
    isTouched: true
  });
  
  // Validate field
  validateField('my-form', fieldName, (val) => {
    if (!val) return { state: 'invalid', message: 'Required field' };
    return { state: 'valid' };
  });
};
```

### 3. React Hook Form Integration

```tsx
import { useForm } from 'react-hook-form';
import { useFormStateInspector } from 'form-state-inspector-tanstack-devtools-plugin';

function MyForm() {
  const methods = useForm();
  
  // Connect to DevTools
  useFormStateInspector('my-rhf-form', methods);
  
  return (
    <form onSubmit={methods.handleSubmit(onSubmit)}>
      {/* Your form fields */}
    </form>
  );
}
```

### 4. Formik Integration

```tsx
import { Formik } from 'formik';
import { formikDevToolsPlugin } from 'form-state-inspector-tanstack-devtools-plugin';

function MyFormikForm() {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validate={validate}
      onSubmit={handleSubmit}
      {...formikDevToolsPlugin('my-formik-form')}
    >
      {/* Your form */}
    </Formik>
  );
}
```

### 5. Native HTML Form Tracking

```tsx
import { trackHTMLForm } from 'form-state-inspector-tanstack-devtools-plugin';

useEffect(() => {
  const form = document.getElementById('my-html-form');
  if (form) {
    const tracker = trackHTMLForm(form as HTMLFormElement);
    
    return () => {
      tracker.unregister();
    };
  }
}, []);
```

## Advanced Features

### Form Replay

```tsx
import { formReplayEngine } from 'form-state-inspector-tanstack-devtools-plugin';

// Replay form interactions
await formReplayEngine.replayForm('my-form', {
  speed: 2, // 2x speed
  onStep: (entry, progress) => {
    console.log(`Replay progress: ${progress}%`);
  },
  onComplete: () => {
    console.log('Replay completed');
  }
});

// Export form history
const historyJson = formReplayEngine.exportFormHistory('my-form');

// Import and replay
await formReplayEngine.importAndReplay(historyJson);
```

### Mock Data Generation

```tsx
// Fill form with mock data
await formReplayEngine.fillWithMockData('my-form', {
  validate: true // Run validation after filling
});

// Generate mock data without filling
const mockData = formReplayEngine.generateMockData('my-form');
```

### Validation Schema Integration

```tsx
import * as Yup from 'yup';
import { setValidationSchema, parseYupSchema } from 'form-state-inspector-tanstack-devtools-plugin';

const schema = Yup.object({
  email: Yup.string().email().required(),
  age: Yup.number().min(18).max(100)
});

// Set schema for automatic validation
setValidationSchema('my-form', parseYupSchema(schema));
```

### Custom Form Library Adapter

```tsx
import { createFormAdapter } from 'form-state-inspector-tanstack-devtools-plugin';

const adapter = createFormAdapter({
  formId: 'custom-form',
  getFieldValue: (fieldName) => myForm.values[fieldName],
  getFieldError: (fieldName) => myForm.errors[fieldName],
  getFieldTouched: (fieldName) => myForm.touched[fieldName],
  getFieldDirty: (fieldName) => myForm.dirty[fieldName],
  isFormValid: () => myForm.isValid,
  isFormDirty: () => myForm.isDirty,
  getFormValues: () => myForm.values,
  onFieldChange: (fieldName, value) => {
    myForm.setValue(fieldName, value);
  }
});

// Update DevTools when form changes
adapter.updateState();
```

## DevTools Panel Features

### Tabs

1. **Fields** - View all form fields with their current state
2. **Validation** - See validation errors and schema information
3. **History** - Timeline of all field changes with replay capability
4. **Performance** - Metrics for validation time and render counts
5. **Accessibility** - Audit results with suggestions for improvements
6. **Submissions** - Track all form submissions with their data

### Filters and Controls

- Search fields by name or value
- Show only dirty fields
- Show only invalid fields
- Auto-refresh toggle
- Replay speed control

## Performance Considerations

- The plugin uses efficient event-based updates
- Field observers are automatically cleaned up
- History is limited to prevent memory issues
- Performance metrics help identify bottlenecks

## Accessibility Features

The Form State Inspector automatically audits forms for:
- Missing labels
- Missing ARIA attributes
- Improper error message associations
- Required field indicators
- Keyboard navigation issues

## API Reference

### Core Functions

- `registerForm(formId, element?)` - Register a form for tracking
- `updateField(formId, fieldName, updates)` - Update field state
- `validateField(formId, fieldName, validator?)` - Validate a field
- `setValidationSchema(formId, schema)` - Set validation schema
- `resetForm(formId)` - Reset form to initial state
- `getFormState(formId)` - Get current form state
- `unregisterForm(formId)` - Stop tracking a form

### Event Types

The plugin emits and listens to these events:
- `form-state-update` - Form state changed
- `field-change` - Field value changed
- `field-validation` - Field validation completed
- `form-submit` - Form submitted
- `accessibility-audit` - Accessibility check completed
- `performance-update` - Performance metrics updated

## Development

```bash
# Install dependencies
npm install

# Run example app
npm run dev

# Build plugin
npm run build

# Run tests
npm test
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Support

For issues and feature requests, please visit our [GitHub repository](https://github.com/tanstack/devtools-plugins).