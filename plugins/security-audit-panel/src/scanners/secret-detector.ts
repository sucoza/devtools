import type { SecurityScanner, SecurityVulnerability } from '../types';
import { generateId, getTimestamp, escapeHtml } from '../utils';

export class SecretDetector implements SecurityScanner {
  id = 'secret-detector';
  name = 'Secret Detector';
  category = 'secret' as const;
  description = 'Detects exposed secrets, API keys, and sensitive information in client-side code';

  private config = {
    checkScriptTags: true,
    checkComments: true,
    checkLocalStorage: true,
    checkSessionStorage: true,
    checkDataAttributes: true,
    checkJSONData: true,
  };

  private secretPatterns = [
    {
      id: 'aws-access-key',
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      category: 'api-key' as const,
      confidence: 95,
    },
    {
      id: 'aws-secret-key',
      name: 'AWS Secret Key',
      pattern: /[A-Za-z0-9/+=]{40}/g,
      category: 'api-key' as const,
      confidence: 60,
    },
    {
      id: 'google-api-key',
      name: 'Google API Key',
      pattern: /AIza[0-9A-Za-z_-]{35}/g,
      category: 'api-key' as const,
      confidence: 95,
    },
    {
      id: 'github-token',
      name: 'GitHub Token',
      pattern: /gh[pousr]_[A-Za-z0-9_]{36}/g,
      category: 'token' as const,
      confidence: 95,
    },
    {
      id: 'stripe-key',
      name: 'Stripe API Key',
      pattern: /(sk|pk)_(test|live)_[A-Za-z0-9]{24}/g,
      category: 'api-key' as const,
      confidence: 95,
    },
    {
      id: 'jwt-token',
      name: 'JWT Token',
      pattern: /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
      category: 'token' as const,
      confidence: 85,
    },
    {
      id: 'api-key-generic',
      name: 'Generic API Key',
      pattern: /(api[_-]?key|apikey|access[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_-]{16,}["']?/gi,
      category: 'api-key' as const,
      confidence: 70,
    },
    {
      id: 'password-field',
      name: 'Password in Code',
      pattern: /(password|pwd|pass)\s*[:=]\s*["'][^"']{4,}["']/gi,
      category: 'password' as const,
      confidence: 60,
    },
    {
      id: 'database-url',
      name: 'Database Connection String',
      pattern: /(mongodb|mysql|postgres|redis):\/\/[^\s"']{10,}/g,
      category: 'database' as const,
      confidence: 90,
    },
    {
      id: 'private-key',
      name: 'Private Key',
      pattern: /-----BEGIN (RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
      category: 'certificate' as const,
      confidence: 100,
    },
  ];

  configure(config: Record<string, unknown>): void {
    this.config = { ...this.config, ...config };
  }

  async scan(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      if (this.config.checkScriptTags) {
        vulnerabilities.push(...this.scanScriptTags());
      }

      if (this.config.checkComments) {
        vulnerabilities.push(...this.scanComments());
      }

      if (this.config.checkLocalStorage) {
        vulnerabilities.push(...this.scanLocalStorage());
      }

      if (this.config.checkSessionStorage) {
        vulnerabilities.push(...this.scanSessionStorage());
      }

      if (this.config.checkDataAttributes) {
        vulnerabilities.push(...this.scanDataAttributes());
      }

      if (this.config.checkJSONData) {
        vulnerabilities.push(...this.scanJSONData());
      }

    } catch (error) {
      console.error('Secret Detector error:', error);
    }

    return vulnerabilities;
  }

  private scanScriptTags(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const scripts = document.querySelectorAll('script');

    scripts.forEach((script) => {
      const content = script.textContent || '';
      if (!content) return;

      const findings = this.findSecretsInText(content);
      findings.forEach(finding => {
        vulnerabilities.push({
          id: generateId(),
          category: 'secret',
          title: `Exposed ${finding.name}`,
          description: `${finding.name} found in script tag content`,
          severity: this.getSeverityForSecret(finding.category),
          impact: `Exposed ${finding.category} can be used by attackers to access protected resources`,
          recommendation: 'Remove secrets from client-side code',
          remediation: 'Move secrets to server-side configuration or environment variables',
          cweId: 'CWE-200',
          owaspCategory: 'A01:2021 – Broken Access Control',
          element: script as HTMLElement,
          location: {
            url: window.location.href,
          },
          evidence: escapeHtml(finding.match.substring(0, 100) + '...'),
          detectedAt: getTimestamp(),
          scannerName: this.name,
          confidence: finding.confidence,
          references: [
            'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure',
            'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',
          ],
          tags: ['exposed-secrets', 'client-side-secrets'],
        });
      });
    });

    return vulnerabilities;
  }

  private scanComments(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Get all comments from HTML
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_COMMENT,
      null
    );

    let comment;
    while ((comment = walker.nextNode())) {
      const content = comment.textContent || '';
      const findings = this.findSecretsInText(content);

      findings.forEach(finding => {
        vulnerabilities.push({
          id: generateId(),
          category: 'secret',
          title: `Secret in HTML Comment`,
          description: `${finding.name} found in HTML comment`,
          severity: this.getSeverityForSecret(finding.category),
          impact: 'Secrets in HTML comments are visible to anyone viewing page source',
          recommendation: 'Remove secrets from HTML comments',
          remediation: 'Clean up HTML comments containing sensitive information',
          cweId: 'CWE-200',
          owaspCategory: 'A01:2021 – Broken Access Control',
          location: {
            url: window.location.href,
          },
          evidence: escapeHtml(content.substring(0, 100) + '...'),
          detectedAt: getTimestamp(),
          scannerName: this.name,
          confidence: finding.confidence,
          references: [
            'https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url',
          ],
          tags: ['html-comments', 'information-disclosure'],
        });
      });
    }

    return vulnerabilities;
  }

  private scanLocalStorage(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const value = localStorage.getItem(key);
        if (!value) continue;

        const findings = this.findSecretsInText(value);
        findings.forEach(finding => {
          vulnerabilities.push({
            id: generateId(),
            category: 'secret',
            title: `Secret in localStorage`,
            description: `${finding.name} stored in localStorage key '${key}'`,
            severity: this.getSeverityForSecret(finding.category),
            impact: 'Secrets in localStorage are accessible to any script and persist across sessions',
            recommendation: 'Use secure storage methods for sensitive data',
            remediation: 'Remove secrets from localStorage or use encrypted storage',
            cweId: 'CWE-312',
            owaspCategory: 'A02:2021 – Cryptographic Failures',
            location: {
              url: window.location.href,
            },
            evidence: `localStorage['${key}'] contains ${finding.name}`,
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: finding.confidence,
            references: [
              'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client_Side_Testing/12-Testing_Browser_Storage',
            ],
            tags: ['localstorage', 'client-storage'],
          });
        });
      }
    } catch {
      // localStorage might not be available
    }

    return vulnerabilities;
  }

  private scanSessionStorage(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key) continue;

        const value = sessionStorage.getItem(key);
        if (!value) continue;

        const findings = this.findSecretsInText(value);
        findings.forEach(finding => {
          vulnerabilities.push({
            id: generateId(),
            category: 'secret',
            title: `Secret in sessionStorage`,
            description: `${finding.name} stored in sessionStorage key '${key}'`,
            severity: this.getSeverityForSecret(finding.category),
            impact: 'Secrets in sessionStorage are accessible to any script during the session',
            recommendation: 'Use secure storage methods for sensitive data',
            remediation: 'Remove secrets from sessionStorage or use encrypted storage',
            cweId: 'CWE-312',
            owaspCategory: 'A02:2021 – Cryptographic Failures',
            location: {
              url: window.location.href,
            },
            evidence: `sessionStorage['${key}'] contains ${finding.name}`,
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: finding.confidence,
            references: [
              'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client_Side_Testing/12-Testing_Browser_Storage',
            ],
            tags: ['sessionstorage', 'client-storage'],
          });
        });
      }
    } catch {
      // sessionStorage might not be available
    }

    return vulnerabilities;
  }

  private scanDataAttributes(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const elementsWithData = document.querySelectorAll('*[data-*]');

    elementsWithData.forEach((element) => {
      for (const attr of element.attributes) {
        if (attr.name.startsWith('data-')) {
          const findings = this.findSecretsInText(attr.value);
          findings.forEach(finding => {
            vulnerabilities.push({
              id: generateId(),
              category: 'secret',
              title: `Secret in Data Attribute`,
              description: `${finding.name} found in data attribute '${attr.name}'`,
              severity: this.getSeverityForSecret(finding.category),
              impact: 'Secrets in data attributes are visible in DOM and accessible to scripts',
              recommendation: 'Remove secrets from data attributes',
              remediation: 'Use server-side data passing or secure client-server communication',
              cweId: 'CWE-200',
              owaspCategory: 'A01:2021 – Broken Access Control',
              element: element as HTMLElement,
              location: {
                url: window.location.href,
              },
              evidence: `${attr.name}="${escapeHtml(attr.value.substring(0, 50))}..."`,
              detectedAt: getTimestamp(),
              scannerName: this.name,
              confidence: finding.confidence,
              references: [
                'https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url',
              ],
              tags: ['data-attributes', 'dom-exposure'],
            });
          });
        }
      }
    });

    return vulnerabilities;
  }

  private scanJSONData(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const jsonScripts = document.querySelectorAll('script[type="application/json"]');

    jsonScripts.forEach((script) => {
      const content = script.textContent || '';
      if (!content) return;

      try {
        JSON.parse(content); // Validate JSON
        const findings = this.findSecretsInText(content);
        
        findings.forEach(finding => {
          vulnerabilities.push({
            id: generateId(),
            category: 'secret',
            title: `Secret in JSON Data`,
            description: `${finding.name} found in JSON script tag`,
            severity: this.getSeverityForSecret(finding.category),
            impact: 'Secrets in JSON data are visible in page source and accessible to scripts',
            recommendation: 'Remove secrets from client-side JSON data',
            remediation: 'Use server-side data processing or secure API endpoints',
            cweId: 'CWE-200',
            owaspCategory: 'A01:2021 – Broken Access Control',
            element: script as HTMLElement,
            location: {
              url: window.location.href,
            },
            evidence: escapeHtml(finding.match.substring(0, 100) + '...'),
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: finding.confidence,
            references: [
              'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure',
            ],
            tags: ['json-data', 'client-side-secrets'],
          });
        });
      } catch {
        // Invalid JSON, skip
      }
    });

    return vulnerabilities;
  }

  private findSecretsInText(text: string): Array<{
    id: string;
    name: string;
    category: 'api-key' | 'password' | 'token' | 'certificate' | 'database';
    match: string;
    confidence: number;
  }> {
    const findings: Array<{
      id: string;
      name: string;
      category: 'api-key' | 'password' | 'token' | 'certificate' | 'database';
      match: string;
      confidence: number;
    }> = [];

    this.secretPatterns.forEach(pattern => {
      const matches = text.match(pattern.pattern);
      if (matches) {
        matches.forEach(match => {
          findings.push({
            id: pattern.id,
            name: pattern.name,
            category: pattern.category,
            match: match,
            confidence: pattern.confidence,
          });
        });
      }
    });

    return findings;
  }

  private getSeverityForSecret(category: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (category) {
      case 'api-key':
      case 'certificate':
      case 'database':
        return 'high';
      case 'token':
        return 'medium';
      case 'password':
        return 'medium';
      default:
        return 'low';
    }
  }
}