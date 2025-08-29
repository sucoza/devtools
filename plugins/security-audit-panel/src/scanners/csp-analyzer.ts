import type { SecurityScanner, SecurityVulnerability } from '../types';
import { generateId, getTimestamp } from '../utils';

export class CSPAnalyzer implements SecurityScanner {
  id = 'csp-analyzer';
  name = 'CSP Analyzer';
  category = 'csp' as const;
  description = 'Analyzes Content Security Policy configuration and identifies weaknesses';

  private config = {
    checkMissingCSP: true,
    checkUnsafeInline: true,
    checkUnsafeEval: true,
    checkWildcardSources: true,
    checkDeprecatedDirectives: true,
    checkHTTPSources: true,
  };

  configure(config: any): void {
    this.config = { ...this.config, ...config };
  }

  async scan(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      const cspHeaders = this.getCSPHeaders();
      
      if (this.config.checkMissingCSP && cspHeaders.length === 0) {
        vulnerabilities.push(this.createMissingCSPVulnerability());
      }

      for (const cspHeader of cspHeaders) {
        const policy = this.parseCSP(cspHeader);
        
        if (this.config.checkUnsafeInline) {
          vulnerabilities.push(...this.checkUnsafeInline(policy, cspHeader));
        }
        
        if (this.config.checkUnsafeEval) {
          vulnerabilities.push(...this.checkUnsafeEval(policy, cspHeader));
        }
        
        if (this.config.checkWildcardSources) {
          vulnerabilities.push(...this.checkWildcardSources(policy, cspHeader));
        }
        
        if (this.config.checkDeprecatedDirectives) {
          vulnerabilities.push(...this.checkDeprecatedDirectives(policy, cspHeader));
        }
        
        if (this.config.checkHTTPSources) {
          vulnerabilities.push(...this.checkHTTPSources(policy, cspHeader));
        }
      }

      // Check for CSP violations in browser console
      vulnerabilities.push(...this.checkCSPViolations());

    } catch (error) {
      console.error('CSP Analyzer error:', error);
    }

    return vulnerabilities;
  }

  private getCSPHeaders(): string[] {
    const headers: string[] = [];
    
    // Check meta tags
    const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    metaTags.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content) headers.push(content);
    });

    // Note: Cannot access HTTP headers from client-side JavaScript
    // This would need to be enhanced with server-side data or browser extension API
    
    return headers;
  }

  private parseCSP(cspHeader: string): Record<string, string[]> {
    const policy: Record<string, string[]> = {};
    
    const directives = cspHeader.split(';').map(d => d.trim()).filter(Boolean);
    
    directives.forEach(directive => {
      const parts = directive.split(/\s+/);
      const directiveName = parts[0];
      const sources = parts.slice(1);
      
      if (directiveName) {
        policy[directiveName] = sources;
      }
    });
    
    return policy;
  }

  private createMissingCSPVulnerability(): SecurityVulnerability {
    return {
      id: generateId(),
      category: 'csp',
      title: 'Missing Content Security Policy',
      description: 'No Content Security Policy detected. CSP helps prevent XSS and data injection attacks.',
      severity: 'high',
      impact: 'Increased risk of XSS, clickjacking, and data injection attacks',
      recommendation: 'Implement a Content Security Policy header or meta tag',
      remediation: 'Add CSP header: "Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\';"',
      cweId: 'CWE-693',
      owaspCategory: 'A05:2021 – Security Misconfiguration',
      location: {
        url: window.location.href,
      },
      evidence: 'No CSP meta tags found in document head',
      detectedAt: getTimestamp(),
      scannerName: this.name,
      confidence: 95,
      references: [
        'https://developer.mozilla.org/docs/Web/HTTP/CSP',
        'https://owasp.org/www-project-secure-headers/#content-security-policy',
      ],
      tags: ['missing-csp', 'security-headers'],
    };
  }

  private checkUnsafeInline(policy: Record<string, string[]>, cspHeader: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const unsafeInlineDirectives = [
      'script-src', 'style-src', 'default-src'
    ];

    unsafeInlineDirectives.forEach(directive => {
      const sources = policy[directive] || policy['default-src'] || [];
      
      if (sources.includes("'unsafe-inline'")) {
        vulnerabilities.push({
          id: generateId(),
          category: 'csp',
          title: `Unsafe Inline in ${directive}`,
          description: `CSP directive ${directive} allows 'unsafe-inline', which defeats XSS protection`,
          severity: 'high',
          impact: 'Allows execution of inline scripts and styles, reducing XSS protection',
          recommendation: 'Remove \'unsafe-inline\' and use nonces or hashes for inline content',
          remediation: 'Use CSP nonces or hashes for legitimate inline scripts/styles',
          cweId: 'CWE-693',
          owaspCategory: 'A05:2021 – Security Misconfiguration',
          location: {
            url: window.location.href,
          },
          evidence: `${directive} ${sources.join(' ')}`,
          detectedAt: getTimestamp(),
          scannerName: this.name,
          confidence: 90,
          references: [
            'https://content-security-policy.com/unsafe-inline/',
            'https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy/script-src',
          ],
          tags: ['unsafe-inline', 'csp-weakness'],
        });
      }
    });

    return vulnerabilities;
  }

  private checkUnsafeEval(policy: Record<string, string[]>, cspHeader: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const evalDirectives = ['script-src', 'default-src'];

    evalDirectives.forEach(directive => {
      const sources = policy[directive] || policy['default-src'] || [];
      
      if (sources.includes("'unsafe-eval'")) {
        vulnerabilities.push({
          id: generateId(),
          category: 'csp',
          title: `Unsafe Eval in ${directive}`,
          description: `CSP directive ${directive} allows 'unsafe-eval', which enables dangerous eval() functions`,
          severity: 'medium',
          impact: 'Allows eval(), Function(), setTimeout(string), setInterval(string) which can lead to code injection',
          recommendation: 'Remove \'unsafe-eval\' and refactor code to avoid eval-like functions',
          remediation: 'Replace eval() and similar functions with safer alternatives',
          cweId: 'CWE-95',
          owaspCategory: 'A03:2021 – Injection',
          location: {
            url: window.location.href,
          },
          evidence: `${directive} ${sources.join(' ')}`,
          detectedAt: getTimestamp(),
          scannerName: this.name,
          confidence: 90,
          references: [
            'https://content-security-policy.com/unsafe-eval/',
          ],
          tags: ['unsafe-eval', 'csp-weakness'],
        });
      }
    });

    return vulnerabilities;
  }

  private checkWildcardSources(policy: Record<string, string[]>, cspHeader: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    Object.entries(policy).forEach(([directive, sources]) => {
      sources.forEach(source => {
        if (source === '*' || source.startsWith('*.')) {
          const severity = source === '*' ? 'high' : 'medium';
          
          vulnerabilities.push({
            id: generateId(),
            category: 'csp',
            title: `Wildcard Source in ${directive}`,
            description: `CSP directive ${directive} uses wildcard source '${source}' which is overly permissive`,
            severity,
            impact: 'Allows resources from any domain, reducing security effectiveness',
            recommendation: 'Use specific domain names instead of wildcards',
            remediation: 'Replace wildcard sources with explicit trusted domains',
            cweId: 'CWE-693',
            owaspCategory: 'A05:2021 – Security Misconfiguration',
            location: {
              url: window.location.href,
            },
            evidence: `${directive} ${sources.join(' ')}`,
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: 85,
            references: [
              'https://content-security-policy.com/wildcard/',
            ],
            tags: ['wildcard-sources', 'csp-weakness'],
          });
        }
      });
    });

    return vulnerabilities;
  }

  private checkDeprecatedDirectives(policy: Record<string, string[]>, cspHeader: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const deprecatedDirectives = [
      'referrer', 'reflected-xss', 'block-all-mixed-content'
    ];

    deprecatedDirectives.forEach(directive => {
      if (policy[directive]) {
        vulnerabilities.push({
          id: generateId(),
          category: 'csp',
          title: `Deprecated CSP Directive: ${directive}`,
          description: `CSP directive '${directive}' is deprecated and may not be supported`,
          severity: 'low',
          impact: 'Deprecated directive may not provide expected security benefits',
          recommendation: 'Remove deprecated directive and use modern alternatives',
          remediation: 'Update CSP to use current directive specifications',
          cweId: 'CWE-693',
          owaspCategory: 'A05:2021 – Security Misconfiguration',
          location: {
            url: window.location.href,
          },
          evidence: `${directive} ${policy[directive].join(' ')}`,
          detectedAt: getTimestamp(),
          scannerName: this.name,
          confidence: 100,
          references: [
            'https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy',
          ],
          tags: ['deprecated-directive', 'csp-maintenance'],
        });
      }
    });

    return vulnerabilities;
  }

  private checkHTTPSources(policy: Record<string, string[]>, cspHeader: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    Object.entries(policy).forEach(([directive, sources]) => {
      sources.forEach(source => {
        if (source.startsWith('http://') && !source.includes('localhost')) {
          vulnerabilities.push({
            id: generateId(),
            category: 'csp',
            title: `HTTP Source in ${directive}`,
            description: `CSP directive ${directive} allows HTTP source '${source}' which is insecure`,
            severity: 'medium',
            impact: 'HTTP sources can be intercepted and modified by attackers',
            recommendation: 'Use HTTPS sources only',
            remediation: 'Change HTTP sources to HTTPS equivalents',
            cweId: 'CWE-319',
            owaspCategory: 'A02:2021 – Cryptographic Failures',
            location: {
              url: window.location.href,
            },
            evidence: `${directive} ${source}`,
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: 90,
            references: [
              'https://owasp.org/www-project-secure-headers/',
            ],
            tags: ['insecure-source', 'http-source'],
          });
        }
      });
    });

    return vulnerabilities;
  }

  private checkCSPViolations(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // This is a simplified check - in practice, you'd want to monitor
    // SecurityPolicyViolationEvent or check browser console
    const hasConsoleErrors = () => {
      // This would need to be implemented with console monitoring
      // or browser extension APIs to detect CSP violations
      return false;
    };

    if (hasConsoleErrors()) {
      vulnerabilities.push({
        id: generateId(),
        category: 'csp',
        title: 'CSP Violations Detected',
        description: 'Content Security Policy violations have been detected in the browser console',
        severity: 'medium',
        impact: 'CSP is blocking potentially malicious resources or legitimate resources are misconfigured',
        recommendation: 'Check browser console for CSP violation details and adjust policy or fix violations',
        remediation: 'Review and fix CSP violations reported in browser console',
        cweId: 'CWE-693',
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        location: {
          url: window.location.href,
        },
        evidence: 'CSP violations detected in browser console',
        detectedAt: getTimestamp(),
        scannerName: this.name,
        confidence: 80,
        references: [
          'https://developer.mozilla.org/docs/Web/API/SecurityPolicyViolationEvent',
        ],
        tags: ['csp-violations', 'runtime-errors'],
      });
    }

    return vulnerabilities;
  }
}