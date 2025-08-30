import type { SecurityScanner, SecurityVulnerability } from '../types';
import { generateId, getTimestamp } from '../utils';

export class CSRFValidator implements SecurityScanner {
  id = 'csrf-validator';
  name = 'CSRF Validator';
  category = 'csrf' as const;
  description = 'Validates Cross-Site Request Forgery (CSRF) protection mechanisms';

  private config = {
    checkFormTokens: true,
    checkAjaxHeaders: true,
    checkSameSiteAttributes: true,
    checkReferrerPolicy: true,
  };

  configure(config: Record<string, unknown>): void {
    this.config = { ...this.config, ...config };
  }

  async scan(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      if (this.config.checkFormTokens) {
        vulnerabilities.push(...this.checkFormTokens());
      }

      if (this.config.checkAjaxHeaders) {
        vulnerabilities.push(...this.checkAjaxHeaders());
      }

      if (this.config.checkSameSiteAttributes) {
        vulnerabilities.push(...this.checkSameSiteAttributes());
      }

      if (this.config.checkReferrerPolicy) {
        vulnerabilities.push(...this.checkReferrerPolicy());
      }

    } catch (error) {
      console.error('CSRF Validator error:', error);
    }

    return vulnerabilities;
  }

  private checkFormTokens(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const forms = document.querySelectorAll('form');

    forms.forEach((form) => {
      const method = form.method?.toLowerCase() || 'get';
      
      // Only check forms that can modify data
      if (!['post', 'put', 'patch', 'delete'].includes(method)) {
        return;
      }

      const hasCSRFToken = this.hasCSRFToken(form);
      
      if (!hasCSRFToken) {
        vulnerabilities.push({
          id: generateId(),
          category: 'csrf',
          title: 'Missing CSRF Token',
          description: `Form with ${method.toUpperCase()} method lacks CSRF protection token`,
          severity: 'high',
          impact: 'Form submissions can be forged by malicious websites',
          recommendation: 'Add CSRF token to form',
          remediation: 'Include a hidden input with CSRF token or use meta tag with token',
          cweId: 'CWE-352',
          owaspCategory: 'A01:2021 – Broken Access Control',
          element: form,
          location: {
            url: window.location.href,
          },
          evidence: `Form action="${form.action}" method="${method}" without CSRF token`,
          detectedAt: getTimestamp(),
          scannerName: this.name,
          confidence: 85,
          references: [
            'https://owasp.org/www-community/attacks/csrf',
            'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',
          ],
          tags: ['missing-csrf-token', 'form-security'],
        });
      }
    });

    return vulnerabilities;
  }

  private hasCSRFToken(form: HTMLFormElement): boolean {
    // Check for common CSRF token field names
    const commonTokenNames = [
      'csrf_token', '_token', 'authenticity_token', 'csrfmiddlewaretoken',
      '_csrf', 'csrf', 'token', '_wpnonce', 'nonce'
    ];

    // Check hidden inputs
    const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
    for (const input of hiddenInputs) {
      const name = input.getAttribute('name')?.toLowerCase() || '';
      if (commonTokenNames.some(tokenName => name.includes(tokenName))) {
        return true;
      }
    }

    // Check meta tags for token
    const metaCSRF = document.querySelector('meta[name="csrf-token"], meta[name="_csrf"], meta[name="_token"]');
    if (metaCSRF && metaCSRF.getAttribute('content')) {
      return true;
    }

    return false;
  }

  private checkAjaxHeaders(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check if common CSRF headers are available
    const _metaCSRF = document.querySelector('meta[name="csrf-token"], meta[name="_csrf"]');
    const scripts = document.querySelectorAll('script');
    
    let hasXMLHttpRequestSetup = false;
    let hasFetchSetup = false;

    scripts.forEach((script) => {
      const content = script.textContent || '';
      
      // Check for XMLHttpRequest CSRF setup
      if (content.includes('XMLHttpRequest') && 
          (content.includes('X-CSRF-TOKEN') || content.includes('X-CSRFToken'))) {
        hasXMLHttpRequestSetup = true;
      }

      // Check for fetch CSRF setup
      if (content.includes('fetch(') && 
          (content.includes('X-CSRF-TOKEN') || content.includes('X-CSRFToken'))) {
        hasFetchSetup = true;
      }
    });

    if (!hasXMLHttpRequestSetup && !hasFetchSetup) {
      vulnerabilities.push({
        id: generateId(),
        category: 'csrf',
        title: 'Missing AJAX CSRF Protection',
        description: 'AJAX requests may lack CSRF protection headers',
        severity: 'medium',
        impact: 'AJAX requests vulnerable to CSRF attacks',
        recommendation: 'Add CSRF tokens to AJAX request headers',
        remediation: 'Configure AJAX requests to include X-CSRF-TOKEN header',
        cweId: 'CWE-352',
        owaspCategory: 'A01:2021 – Broken Access Control',
        location: {
          url: window.location.href,
        },
        evidence: 'No CSRF token setup detected in AJAX configurations',
        detectedAt: getTimestamp(),
        scannerName: this.name,
        confidence: 60,
        references: [
          'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#ajax-applications',
        ],
        tags: ['ajax-csrf', 'missing-headers'],
      });
    }

    return vulnerabilities;
  }

  private checkSameSiteAttributes(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Note: Cannot directly access cookie SameSite attributes from JavaScript
    // This is a limitation - would need server-side data or browser extension API
    
    // Check if document.cookie exists (indicates cookies are present)
    if (document.cookie) {
      // We can only make recommendations based on presence of cookies
      vulnerabilities.push({
        id: generateId(),
        category: 'csrf',
        title: 'Cookie SameSite Attribute Check Required',
        description: 'Cookies detected - verify SameSite attributes are properly configured',
        severity: 'low',
        impact: 'Cookies without SameSite attribute may be vulnerable to CSRF attacks',
        recommendation: 'Verify all cookies have appropriate SameSite attribute (Strict, Lax, or None with Secure)',
        remediation: 'Configure cookies with SameSite=Lax or SameSite=Strict for CSRF protection',
        cweId: 'CWE-352',
        owaspCategory: 'A01:2021 – Broken Access Control',
        location: {
          url: window.location.href,
        },
        evidence: 'Cookies present - SameSite attributes cannot be verified client-side',
        detectedAt: getTimestamp(),
        scannerName: this.name,
        confidence: 30,
        references: [
          'https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie/SameSite',
          'https://owasp.org/www-community/SameSite',
        ],
        tags: ['samesite-cookies', 'manual-verification'],
      });
    }

    return vulnerabilities;
  }

  private checkReferrerPolicy(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for Referrer-Policy meta tag or header
    const referrerPolicyMeta = document.querySelector('meta[name="referrer"]');
    const referrerPolicyValue = referrerPolicyMeta?.getAttribute('content');

    // Weak referrer policies that may aid CSRF attacks
    const weakPolicies = ['unsafe-url', 'no-referrer-when-downgrade'];
    
    if (!referrerPolicyValue) {
      vulnerabilities.push({
        id: generateId(),
        category: 'csrf',
        title: 'Missing Referrer Policy',
        description: 'No Referrer Policy configured, which may aid CSRF attacks',
        severity: 'low',
        impact: 'Referrer information may be leaked, potentially aiding CSRF attacks',
        recommendation: 'Implement Referrer Policy with strict-origin or strict-origin-when-cross-origin',
        remediation: 'Add <meta name="referrer" content="strict-origin-when-cross-origin">',
        cweId: 'CWE-352',
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        location: {
          url: window.location.href,
        },
        evidence: 'No referrer policy meta tag found',
        detectedAt: getTimestamp(),
        scannerName: this.name,
        confidence: 50,
        references: [
          'https://developer.mozilla.org/docs/Web/HTTP/Headers/Referrer-Policy',
        ],
        tags: ['missing-referrer-policy', 'information-disclosure'],
      });
    } else if (weakPolicies.includes(referrerPolicyValue)) {
      vulnerabilities.push({
        id: generateId(),
        category: 'csrf',
        title: 'Weak Referrer Policy',
        description: `Referrer Policy '${referrerPolicyValue}' may leak sensitive information`,
        severity: 'low',
        impact: 'Weak referrer policy may expose sensitive URL information to third parties',
        recommendation: 'Use stricter referrer policy like strict-origin-when-cross-origin',
        remediation: 'Update referrer policy to a more restrictive value',
        cweId: 'CWE-200',
        owaspCategory: 'A01:2021 – Broken Access Control',
        location: {
          url: window.location.href,
        },
        evidence: `Referrer policy: ${referrerPolicyValue}`,
        detectedAt: getTimestamp(),
        scannerName: this.name,
        confidence: 70,
        references: [
          'https://developer.mozilla.org/docs/Web/HTTP/Headers/Referrer-Policy',
        ],
        tags: ['weak-referrer-policy', 'information-disclosure'],
      });
    }

    return vulnerabilities;
  }
}