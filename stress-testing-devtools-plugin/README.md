# TanStack DevTools Stress Testing Plugin

A comprehensive TanStack DevTools plugin that allows you to perform load testing on your APIs directly from the browser developer tools. Easily import requests from browser Network tabs, cURL commands, and other formats.

## Features

### 🚀 **Major improvements over the original bookmarklet:**

- **Professional UI**: Clean, organized React-based interface integrated with TanStack DevTools
- **Import from Network Tab**: Copy requests directly from browser dev tools (cURL, fetch, PowerShell)
- **Advanced Validation Engine**: Comprehensive response validation with custom rules
- **Visual Configuration Editor**: No more manual JSON editing - visual forms with validation
- **Test Single Requests**: Test and examine responses before running stress tests
- **Auto-Generate Validation Rules**: AI-powered rule generation from response samples
- **Better State Management**: Centralized store with proper persistence
- **Enhanced Metrics**: More detailed performance metrics and error analysis
- **Test History**: Keep track of all your test runs with detailed comparisons
- **Type Safety**: Full TypeScript support with proper type definitions

### 📊 **Core Features:**

#### 🔧 **Request Management**
- **Import from Browser DevTools**: Copy as cURL, fetch, PowerShell, or raw HTTP
- **Visual Request Editor**: Form-based configuration with validation
- **Duplicate & Edit**: Clone existing requests for quick variations
- **Header & Body Management**: JSON editing with syntax validation

#### 🧪 **Testing & Validation**
- **Test Single Requests**: Execute and examine individual requests before stress testing
- **Advanced Validation Rules**: Multiple validation types (status, headers, body, performance)
- **Auto-Generate Rules**: Smart rule generation from response samples
- **Custom Validation**: JavaScript-based custom validation logic

#### ⚡ **Stress Testing**
- **Fixed Count Testing**: Run specific number of requests with concurrency control
- **Timed Rate Testing**: Run tests for duration at controlled rate
- **Real-time Metrics**: Live updates of response times, success rates, and throughput
- **Error Analysis**: Detailed error categorization and reporting

#### 🔐 **Authentication & Tokens**
- **Automatic Token Handling**: JWT and XSRF token extraction from browser
- **Token Substitution**: Dynamic replacement of `{{tenantId}}` and `{{regionId}}`
- **Custom Headers**: Support for any authentication method

## Installation

```bash
npm install @sucoza/tanstack-devtools-stress-testing
```

## Quick Start Guide

### 1. 📥 **Import a Request**
The easiest way to get started is to import a request from your browser's Network tab:

1. Open your browser's Developer Tools
2. Go to the **Network** tab  
3. Perform the API request you want to test
4. Right-click the request → **Copy** → **Copy as cURL** (or Copy as fetch)
5. In the plugin, click **📥 Import** and paste your copied request
6. The plugin will automatically parse the request details

**Supported formats:**
- ✅ cURL commands (Chrome/Firefox DevTools)
- ✅ JavaScript fetch() (Chrome DevTools) 
- ✅ PowerShell Invoke-RestMethod
- ✅ Raw HTTP requests

### 2. 🧪 **Test Your Request**
Before running a stress test, verify your request works:

1. Click **🧪 Test Request** 
2. Examine the response, headers, and timing
3. Click **✨ Generate Rules** to create validation rules automatically
4. Customize the generated rules or add your own

### 3. ⚡ **Run Stress Tests**
Choose your testing approach:

**Fixed Count Test:**
- Set number of requests (e.g., 100)
- Set concurrency (e.g., 10 simultaneous requests)
- Click **Run Fixed Test**

**Timed Rate Test:** 
- Set duration (e.g., 2 minutes)
- Set rate (e.g., 5 requests/second)
- Click **Run Timed Test**

### 4. 📊 **Analyze Results**
Monitor real-time metrics:
- Response times (avg, P50, P90, P95, P99)
- Success/failure rates
- Requests per second (RPS)
- Error breakdown by type

## Usage

### Basic Setup

```typescript
import { createStressTestPlugin } from '@sucoza/tanstack-devtools-stress-testing'

// Create the plugin with default configuration
const stressTestPlugin = createStressTestPlugin()

// Add to your TanStack DevTools configuration
import { TanStackDevtools } from '@tanstack/devtools'

const devtools = new TanStackDevtools({
  plugins: [stressTestPlugin]
})
```

### Advanced Configuration

```typescript
import { createStressTestPlugin } from '@sucoza/tanstack-devtools-stress-testing'

const stressTestPlugin = createStressTestPlugin({
  initialConfigs: [
    {
      name: 'User Info',
      method: 'GET',
      path: '/api/users/me',
      inputParams: {},
      test: 'response.id !== undefined'
    },
    {
      name: 'Search Users',
      method: 'POST',
      path: '/api/users/search',
      inputParams: {
        tenantId: '{{tenantId}}',
        query: 'test'
      },
      test: 'response.users && response.users.length >= 0'
    }
  ]
})
```

## Configuration Format

Each request configuration follows this structure:

```typescript
interface StressTestConfig {
  name: string                              // Display name for the request
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string                              // API endpoint path
  inputParams: Record<string, any>          // Request body/parameters
  test: string                              // JavaScript expression to validate response
  headers?: Record<string, string>          // Optional additional headers
}
```

### Test Validation

The `test` field should contain a JavaScript expression that evaluates to `true` for a successful response:

```javascript
// Examples:
"response.length > 0"
"response.data !== undefined"
"response.users && response.users.length >= 0"
"response.success === true"
```

### Token Substitution

Use these tokens in your `inputParams` and they will be automatically replaced:

- `{{tenantId}}` - Current user's tenant ID
- `{{regionId}}` - Current user's region ID

Example:
```json
{
  "inputParams": {
    "tenantId": "{{tenantId}}",
    "regionId": "{{regionId}}"
  }
}
```

## Advanced Validation Engine

The plugin includes a powerful validation engine that goes far beyond simple response checks:

### Validation Rule Types

#### 📊 **Status Code Validation**
```javascript
// Check for successful status codes
{
  "type": "status",
  "operator": "equals",
  "expectedValue": 200
}

// Ensure not error codes
{
  "type": "status", 
  "operator": "lessThan",
  "expectedValue": 400
}
```

#### 📋 **Header Validation**
```javascript
// Check content type
{
  "type": "header",
  "target": "content-type",
  "operator": "contains", 
  "expectedValue": "application/json"
}

// Ensure security headers exist
{
  "type": "header",
  "target": "x-frame-options",
  "operator": "exists"
}
```

#### 📄 **Response Body Validation**  
```javascript
// JSONPath validation
{
  "type": "body",
  "operator": "jsonPath",
  "target": "data.users[0].id",
  "expectedValue": 12345
}

// Content validation
{
  "type": "body", 
  "operator": "contains",
  "expectedValue": "success"
}
```

#### ⏱️ **Performance Validation**
```javascript
// Response time limits
{
  "type": "responseTime",
  "operator": "lessThan", 
  "expectedValue": 500
}

// Response size checks
{
  "type": "size",
  "operator": "greaterThan",
  "expectedValue": 100
}
```

#### ⚙️ **Custom Validation**
Write custom JavaScript validation logic:
```javascript
{
  "type": "custom",
  "operator": "custom",
  "customCode": `
    // Full access to response, status, headers, responseTime, responseSize
    if (response.data && Array.isArray(response.data.users)) {
      return response.data.users.length > 0;
    }
    return false;
  `
}
```

### Auto-Generated Rules

The **✨ Generate Rules** feature automatically creates validation rules based on your test response:

- ✅ Status code validation
- ✅ Content-Type header check  
- ✅ Response structure validation
- ✅ Performance benchmarks
- ✅ Array length checks
- ✅ Success flag validation

These generated rules can be customized, enabled/disabled, or used as templates for more complex validation.

## Metrics

The plugin provides comprehensive metrics for each test run:

- **Total Requests**: Number of requests executed
- **Success Rate**: Percentage of successful requests
- **Response Times**: Average, P50, P90, P95, P99, Min, Max
- **Throughput**: Current requests per second (RPS)
- **Error Analysis**: Breakdown of errors by type
- **Duration**: Total test execution time

## Authentication

The plugin automatically handles authentication by:

1. **JWT Tokens**: Reads from `localStorage.getItem('jwtToken')`
2. **XSRF Tokens**: Extracts from cookies (`XSRF-TOKEN-WEBAPI`)
3. **User Context**: Fetches user info to populate `{{tenantId}}` and `{{regionId}}` tokens

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Development mode with watch
npm run dev

# Type checking
npm run type-check
```

## Example

See the `example/` directory for a complete working example of the plugin in action.

## Comparison with Original Bookmarklet

| Feature | Original Bookmarklet | New DevTools Plugin |
|---------|---------------------|-------------------|
| **UI/UX** | Basic HTML popup | Professional React interface |
| **Request Import** | Manual JSON editing | Import from Network tab, cURL, fetch, etc. |
| **Validation** | Simple JavaScript expressions | Advanced validation engine with multiple rule types |
| **Configuration** | Hard-coded JSON in popup | Visual editor + JSON editor with validation |
| **Test Single Requests** | No single request testing | Test & examine responses before stress testing |
| **Rule Generation** | Manual rule writing | Auto-generate validation rules from responses |
| **State Management** | Global variables | Centralized store with persistence |
| **Test History** | None | Full history with detailed metrics |
| **Error Analysis** | Basic error counting | Detailed error categorization and reporting |
| **Metrics** | Basic P50/P90/P95 stats | Comprehensive performance metrics with real-time updates |
| **Integration** | Standalone bookmarklet | Integrated TanStack DevTools plugin |
| **Type Safety** | Plain JavaScript | Full TypeScript support |
| **Authentication** | Manual token handling | Automatic JWT/XSRF extraction |
| **Export/Import** | Copy-paste JSON | Clipboard integration + visual import/export |

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.