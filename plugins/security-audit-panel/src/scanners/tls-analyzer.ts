import type { SecurityScanner, SecurityVulnerability } from '../types';
import { generateId, getTimestamp } from '../utils';

export class TLSAnalyzer implements SecurityScanner {
  id = 'tls-analyzer';
  name = 'TLS/SSL Analyzer';
  category = 'tls' as const;
  description = 'Analyzes TLS/SSL configuration and mixed content issues';

  async scan(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check for mixed content
      vulnerabilities.push(...this.checkMixedContent());
      
      // Check protocol security
      vulnerabilities.push(...this.checkProtocolSecurity());
      
      // Check insecure resources
      vulnerabilities.push(...this.checkInsecureResources());
      
    } catch (error) {
      console.error('TLS Analyzer error:', error);
    }

    return vulnerabilities;
  }

  private checkMixedContent(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    if (window.location.protocol === 'https:') {
      // Check for HTTP resources on HTTPS page
      const httpResources = [
        ...Array.from(document.querySelectorAll('img[src^="http://"]')),
        ...Array.from(document.querySelectorAll('script[src^="http://"]')),
        ...Array.from(document.querySelectorAll('link[href^="http://"]')),
        ...Array.from(document.querySelectorAll('iframe[src^="http://"]')),
      ];

      httpResources.forEach((element) => {
        const src = element.getAttribute('src') || element.getAttribute('href');
        if (src && !src.includes('localhost') && !src.includes('127.0.0.1')) {
          vulnerabilities.push({
            id: generateId(),
            category: 'tls',
            title: 'Mixed Content Detected',
            description: `HTTP resource loaded on HTTPS page: ${element.tagName.toLowerCase()}`,
            severity: 'medium',
            impact: 'Mixed content can be intercepted and modified by attackers',
            recommendation: 'Use HTTPS for all resources',
            remediation: `Change ${src} to use HTTPS`,
            cweId: 'CWE-319',
            owaspCategory: 'A02:2021 – Cryptographic Failures',
            element: element as HTMLElement,
            location: { url: window.location.href },
            evidence: `${element.tagName.toLowerCase()} src/href: ${src}`,
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: 95,
            references: [
              'https://developer.mozilla.org/docs/Web/Security/Mixed_content',
            ],
            tags: ['mixed-content', 'insecure-transport'],
          });
        }
      });
    }

    return vulnerabilities;
  }

  private checkProtocolSecurity(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    if (window.location.protocol === 'http:') {
      vulnerabilities.push({
        id: generateId(),
        category: 'tls',
        title: 'Insecure HTTP Protocol',
        description: 'Page is served over HTTP instead of HTTPS',
        severity: 'high',
        impact: 'Data transmitted over HTTP can be intercepted and modified',
        recommendation: 'Implement HTTPS with proper TLS configuration',
        remediation: 'Configure server to use HTTPS and redirect HTTP traffic',
        cweId: 'CWE-319',
        owaspCategory: 'A02:2021 – Cryptographic Failures',
        location: { url: window.location.href },
        evidence: `Protocol: ${window.location.protocol}`,
        detectedAt: getTimestamp(),
        scannerName: this.name,
        confidence: 100,
        references: [
          'https://owasp.org/www-project-transport-layer-protection-cheat-sheet/',
        ],
        tags: ['insecure-protocol', 'no-encryption'],
      });
    }

    return vulnerabilities;
  }

  private checkInsecureResources(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check forms submitting to HTTP
    const insecureForms = document.querySelectorAll('form[action^="http://"]');
    insecureForms.forEach((form) => {
      const action = form.getAttribute('action');
      if (action && !action.includes('localhost')) {
        vulnerabilities.push({
          id: generateId(),
          category: 'tls',
          title: 'Form Submits to HTTP',
          description: 'Form submits data over insecure HTTP connection',
          severity: 'high',
          impact: 'Form data can be intercepted during transmission',
          recommendation: 'Use HTTPS for form submissions',
          remediation: `Change form action to use HTTPS: ${action}`,
          cweId: 'CWE-319',
          owaspCategory: 'A02:2021 – Cryptographic Failures',
          element: form as HTMLElement,
          location: { url: window.location.href },
          evidence: `Form action: ${action}`,
          detectedAt: getTimestamp(),
          scannerName: this.name,
          confidence: 95,
          references: [
            'https://owasp.org/www-project-transport-layer-protection-cheat-sheet/',
          ],
          tags: ['insecure-form', 'data-transmission'],
        });
      }
    });

    // Check WebSocket connections
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script) => {
      const content = script.textContent || '';
      const wsMatches = content.match(/new\s+WebSocket\s*\(\s*["']ws:\/\/[^"']+["']/g);
      
      if (wsMatches) {
        wsMatches.forEach((match) => {
          vulnerabilities.push({
            id: generateId(),
            category: 'tls',
            title: 'Insecure WebSocket Connection',
            description: 'WebSocket connection uses unencrypted ws:// protocol',
            severity: 'medium',
            impact: 'WebSocket data can be intercepted and modified',
            recommendation: 'Use secure wss:// protocol for WebSocket connections',
            remediation: 'Replace ws:// with wss:// in WebSocket URLs',
            cweId: 'CWE-319',
            owaspCategory: 'A02:2021 – Cryptographic Failures',
            element: script,
            location: { url: window.location.href },
            evidence: match,
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: 90,
            references: [
              'https://developer.mozilla.org/docs/Web/API/WebSocket',
            ],
            tags: ['insecure-websocket', 'realtime-communication'],
          });
        });
      }
    });

    return vulnerabilities;
  }
}