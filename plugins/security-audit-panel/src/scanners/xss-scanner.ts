import type { SecurityScanner, SecurityVulnerability } from '../types';
import { generateId, getTimestamp, getElementSelector, escapeHtml } from '../utils';

export class XSSScanner implements SecurityScanner {
  id = 'xss-scanner';
  name = 'XSS Scanner';
  category = 'xss' as const;
  description = 'Scans for potential Cross-Site Scripting (XSS) vulnerabilities in DOM elements';

  private config = {
    checkInlineEvents: true,
    checkDangerousAttributes: true,
    checkInputReflection: true,
    checkDynamicContent: true,
    payloadTimeout: 100,
  };

  configure(config: any): void {
    this.config = { ...this.config, ...config };
  }

  async scan(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check for inline event handlers
      if (this.config.checkInlineEvents) {
        vulnerabilities.push(...this.scanInlineEventHandlers());
      }

      // Check for dangerous attributes
      if (this.config.checkDangerousAttributes) {
        vulnerabilities.push(...this.scanDangerousAttributes());
      }

      // Check for input reflection
      if (this.config.checkInputReflection) {
        vulnerabilities.push(...await this.scanInputReflection());
      }

      // Check for dynamic content insertion
      if (this.config.checkDynamicContent) {
        vulnerabilities.push(...this.scanDynamicContent());
      }

    } catch (error) {
      console.error('XSS Scanner error:', error);
    }

    return vulnerabilities;
  }

  private scanInlineEventHandlers(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const eventAttributes = [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
      'onkeyup', 'onkeypress', 'ondblclick', 'oncontextmenu'
    ];

    eventAttributes.forEach(attr => {
      const elements = document.querySelectorAll(`[${attr}]`);
      elements.forEach((element) => {
        const eventCode = element.getAttribute(attr);
        if (eventCode) {
          vulnerabilities.push({
            id: generateId(),
            category: 'xss',
            title: `Inline Event Handler: ${attr}`,
            description: `Element contains inline event handler that could be exploited for XSS attacks`,
            severity: 'medium',
            impact: 'Potential code execution through event handler manipulation',
            recommendation: 'Use addEventListener() instead of inline event handlers',
            remediation: 'Replace inline event handlers with proper event listeners attached via JavaScript',
            cweId: 'CWE-79',
            owaspCategory: 'A03:2021 – Injection',
            element: element as HTMLElement,
            location: {
              url: window.location.href,
            },
            evidence: `${attr}="${escapeHtml(eventCode)}"`,
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: 80,
            references: [
              'https://owasp.org/www-community/xss-filter-evasion-cheatsheet',
              'https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener',
            ],
            tags: ['inline-events', 'dom-xss'],
          });
        }
      });
    });

    return vulnerabilities;
  }

  private scanDangerousAttributes(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const dangerousAttributes = [
      { attr: 'src', elements: 'script', risk: 'high' },
      { attr: 'href', elements: 'a[href^="javascript:"]', risk: 'high' },
      { attr: 'src', elements: 'iframe', risk: 'medium' },
      { attr: 'srcdoc', elements: 'iframe', risk: 'high' },
      { attr: 'data', elements: 'object', risk: 'medium' },
      { attr: 'action', elements: 'form', risk: 'low' },
    ];

    dangerousAttributes.forEach(({ attr, elements, risk }) => {
      const found = document.querySelectorAll(elements);
      found.forEach((element) => {
        const attrValue = element.getAttribute(attr);
        if (attrValue) {
          const isUserControllable = this.isValuePotentiallyUserControllable(attrValue);
          if (isUserControllable) {
            vulnerabilities.push({
              id: generateId(),
              category: 'xss',
              title: `Dangerous Attribute: ${attr}`,
              description: `${element.tagName.toLowerCase()} element with potentially user-controllable ${attr} attribute`,
              severity: risk as 'low' | 'medium' | 'high',
              impact: `Potential XSS through ${attr} attribute manipulation`,
              recommendation: `Validate and sanitize ${attr} attribute values`,
              remediation: `Implement proper input validation and output encoding for ${attr} attributes`,
              cweId: 'CWE-79',
              owaspCategory: 'A03:2021 – Injection',
              element: element as HTMLElement,
              location: {
                url: window.location.href,
              },
              evidence: `${attr}="${escapeHtml(attrValue)}"`,
              detectedAt: getTimestamp(),
              scannerName: this.name,
              confidence: isUserControllable ? 70 : 40,
              references: [
                'https://owasp.org/www-project-top-ten/2017/A7_2017-Cross-Site_Scripting_(XSS)',
              ],
              tags: ['dangerous-attributes', 'reflected-xss'],
            });
          }
        }
      });
    });

    return vulnerabilities;
  }

  private async scanInputReflection(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const inputs = document.querySelectorAll('input, textarea, select');

    for (const input of inputs) {
      if (input instanceof HTMLInputElement || 
          input instanceof HTMLTextAreaElement || 
          input instanceof HTMLSelectElement) {
        
        const testPayload = `xss_test_${Date.now()}`;
        const originalValue = input.value;

        try {
          // Set test payload
          input.value = testPayload;
          
          // Trigger change event
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));

          // Wait for DOM updates
          await new Promise(resolve => setTimeout(resolve, this.config.payloadTimeout));

          // Check if payload is reflected in DOM
          const bodyText = document.body.textContent || '';
          const bodyHTML = document.body.innerHTML;
          
          if (bodyText.includes(testPayload) || bodyHTML.includes(testPayload)) {
            vulnerabilities.push({
              id: generateId(),
              category: 'xss',
              title: 'Input Reflection Detected',
              description: 'Input value is reflected in the DOM without proper encoding',
              severity: 'high',
              impact: 'User input can be reflected in the page, potentially leading to XSS',
              recommendation: 'Implement proper output encoding and input validation',
              remediation: 'Use HTML encoding for all user input displayed in the DOM',
              cweId: 'CWE-79',
              owaspCategory: 'A03:2021 – Injection',
              element: input as HTMLElement,
              location: {
                url: window.location.href,
              },
              evidence: `Input reflection test with payload: ${escapeHtml(testPayload)}`,
              detectedAt: getTimestamp(),
              scannerName: this.name,
              confidence: 85,
              references: [
                'https://owasp.org/www-community/attacks/xss/',
                'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
              ],
              tags: ['input-reflection', 'reflected-xss'],
            });
          }

        } finally {
          // Restore original value
          input.value = originalValue;
        }
      }
    }

    return vulnerabilities;
  }

  private scanDynamicContent(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for innerHTML usage with variables
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script) => {
      const content = script.textContent || '';
      
      // Look for dangerous innerHTML patterns
      const dangerousPatterns = [
        /\.innerHTML\s*=\s*[^"']+/g,
        /\.outerHTML\s*=\s*[^"']+/g,
        /document\.write\s*\(/g,
        /document\.writeln\s*\(/g,
      ];

      dangerousPatterns.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            vulnerabilities.push({
              id: generateId(),
              category: 'xss',
              title: 'Potentially Unsafe DOM Manipulation',
              description: 'Script contains potentially unsafe DOM manipulation that could lead to XSS',
              severity: 'medium',
              impact: 'Dynamic content insertion without proper sanitization',
              recommendation: 'Use textContent or properly sanitize HTML content',
              remediation: 'Replace innerHTML with safer alternatives or implement HTML sanitization',
              cweId: 'CWE-79',
              owaspCategory: 'A03:2021 – Injection',
              element: script,
              location: {
                url: window.location.href,
              },
              evidence: escapeHtml(match),
              detectedAt: getTimestamp(),
              scannerName: this.name,
              confidence: 60,
              references: [
                'https://owasp.org/www-community/attacks/DOM_Based_XSS',
              ],
              tags: ['dom-manipulation', 'dom-xss'],
            });
          });
        }
      });
    });

    return vulnerabilities;
  }

  private isValuePotentiallyUserControllable(value: string): boolean {
    // Check if value contains URL parameters or common dynamic patterns
    const suspiciousPatterns = [
      /\?.*=/,           // URL parameters
      /\${.*}/,          // Template literals
      /<%.*%>/,          // Template engine patterns
      /{{.*}}/,          // Handlebars/Mustache
      /\[.*\]/,          // Array-like access
      /\bdata-/,         // Data attributes
      /javascript:/i,    // JavaScript URLs
      /vbscript:/i,      // VBScript URLs
      /data:/i,          // Data URLs
    ];

    return suspiciousPatterns.some(pattern => pattern.test(value));
  }
}