# Security Audit Panel - TanStack DevTools Plugin

A comprehensive security auditing plugin for TanStack DevTools that helps developers identify and fix security vulnerabilities in web applications during development.

## Features

### 🔍 **Comprehensive Security Scanning**
- **XSS Scanner**: Detects potential Cross-Site Scripting vulnerabilities
- **CSRF Validator**: Checks for Cross-Site Request Forgery protection
- **CSP Analyzer**: Analyzes Content Security Policy configuration
- **Dependency Checker**: Identifies known vulnerabilities in JavaScript libraries
- **Secret Detector**: Finds exposed API keys and sensitive information
- **TLS/SSL Analyzer**: Validates HTTPS and transport security

### 📊 **Rich Dashboard**
- Security score calculation
- Vulnerability breakdown by severity and category
- Real-time scan status
- Historical scan data

### 🎯 **Detailed Vulnerability Analysis**
- Comprehensive vulnerability details
- Severity assessment (Critical, High, Medium, Low)
- Impact analysis and remediation guidance
- CWE and OWASP mappings
- Reference links for further reading

### 📈 **Advanced Reporting**
- Export reports in JSON, CSV, or HTML formats
- Scan history tracking
- Security metrics and trends

### ⚙️ **Flexible Configuration**
- Enable/disable individual scanners
- Auto-scan on page load or DOM changes
- Customizable severity thresholds
- Theme support (light/dark/auto)

## Installation

```bash
npm install @tanstack/security-audit-panel-devtools
```

## Usage

### Basic Setup

```typescript
import { SecurityAuditPanel } from '@tanstack/security-audit-panel-devtools';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Add the Security Audit Panel */}
      <SecurityAuditPanel />
    </div>
  );
}
```

### Advanced Usage with Custom Configuration

```typescript
import { 
  SecurityAuditPanel, 
  createSecurityAuditDevToolsClient,
  initializeSecurityScanEngine 
} from '@tanstack/security-audit-panel-devtools';

// Initialize with custom configuration
const config = {
  scanners: {
    'xss-scanner': { enabled: true, autoScan: true },
    'csrf-validator': { enabled: true, autoScan: false },
    'csp-analyzer': { enabled: true, autoScan: true },
    'dependency-checker': { enabled: false, autoScan: false },
    'secret-detector': { enabled: true, autoScan: true },
    'tls-analyzer': { enabled: true, autoScan: false },
  },
  autoScanOnPageLoad: true,
  autoScanOnDomChange: false,
  severityThreshold: 'medium',
  showInConsole: true,
  exportFormat: 'json',
};

const scanEngine = initializeSecurityScanEngine(config);
const client = createSecurityAuditDevToolsClient();

function App() {
  return (
    <div>
      <SecurityAuditPanel />
    </div>
  );
}
```

### Using Individual Scanners

```typescript
import { 
  XSSScanner, 
  CSPAnalyzer, 
  SecretDetector 
} from '@tanstack/security-audit-panel-devtools';

// Use scanners individually
const xssScanner = new XSSScanner();
const cspAnalyzer = new CSPAnalyzer();
const secretDetector = new SecretDetector();

// Run a specific scanner
const vulnerabilities = await xssScanner.scan();
```

### Programmatic API

```typescript
import { useSecurityAudit } from '@tanstack/security-audit-panel-devtools';

function MyComponent() {
  const { state, actions } = useSecurityAudit();
  
  const runScan = async () => {
    await actions.startScan(['xss-scanner', 'csrf-validator']);
  };
  
  const exportResults = () => {
    const data = actions.exportResults('json');
    console.log('Security audit results:', data);
  };
  
  return (
    <div>
      <button onClick={runScan}>Run Security Scan</button>
      <button onClick={exportResults}>Export Results</button>
      <p>Total vulnerabilities: {state.metrics.totalVulnerabilities}</p>
      <p>Security score: {state.metrics.securityScore}/100</p>
    </div>
  );
}
```

## Security Scanners

### XSS Scanner
Detects potential Cross-Site Scripting vulnerabilities:
- Inline event handlers
- Dangerous attributes (src, href, srcdoc)
- Input reflection testing
- Unsafe DOM manipulation patterns

### CSRF Validator
Validates Cross-Site Request Forgery protection:
- Form CSRF token validation
- AJAX request header checks
- SameSite cookie attributes
- Referrer policy analysis

### CSP Analyzer
Analyzes Content Security Policy configuration:
- Missing CSP detection
- Unsafe-inline and unsafe-eval usage
- Wildcard source validation
- Deprecated directive detection
- Mixed content checks

### Dependency Checker
Identifies vulnerable JavaScript libraries:
- Known CVE detection in loaded libraries
- Version-based vulnerability matching
- CDN and local library scanning

### Secret Detector
Finds exposed sensitive information:
- API keys (AWS, Google, GitHub, Stripe, etc.)
- JWT tokens
- Database connection strings
- Private keys and certificates
- Passwords in code

### TLS Analyzer
Validates transport layer security:
- Mixed content detection
- Insecure protocol usage
- Form submission security
- WebSocket connection security

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Running the Example

```bash
npm run example
```

### Testing

```bash
npm test
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoScanOnPageLoad` | boolean | false | Automatically run scans when page loads |
| `autoScanOnDomChange` | boolean | false | Run scans when DOM changes |
| `severityThreshold` | 'low' \| 'medium' \| 'high' \| 'critical' | 'low' | Minimum severity level to display |
| `showInConsole` | boolean | true | Log findings to browser console |
| `exportFormat` | 'json' \| 'csv' \| 'html' | 'json' | Default export format |

## Scanner Configuration

Each scanner can be configured individually:

```typescript
const config = {
  scanners: {
    'xss-scanner': {
      enabled: true,
      autoScan: true,
      options: {
        checkInlineEvents: true,
        checkDangerousAttributes: true,
        checkInputReflection: true,
        checkDynamicContent: true,
        payloadTimeout: 100,
      }
    },
    // ... other scanners
  }
};
```

## Integration with TanStack DevTools

This plugin follows the TanStack DevTools architecture patterns:
- Event-driven communication via `@tanstack/devtools-event-client`
- State management with Zustand
- React integration with `useSyncExternalStore`
- Consistent UI patterns and styling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Security Notice

This tool is intended for development and testing purposes only. Do not use in production environments. The scanners may have false positives and should not be considered a complete security assessment.

For production security auditing, use dedicated security tools and professional security assessments.