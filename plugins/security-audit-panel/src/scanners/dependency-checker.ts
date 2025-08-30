import type { SecurityScanner, SecurityVulnerability } from '../types';
import { generateId, getTimestamp } from '../utils';

export class DependencyChecker implements SecurityScanner {
  id = 'dependency-checker';
  name = 'Dependency Checker';
  category = 'dependency' as const;
  description = 'Checks for known vulnerabilities in loaded JavaScript libraries and dependencies';

  private knownVulnerabilities = [
    {
      library: 'jquery',
      versions: ['<3.5.0'],
      cve: 'CVE-2020-11022',
      severity: 'medium' as const,
      description: 'XSS vulnerability in jQuery HTML parsing',
    },
    {
      library: 'lodash',
      versions: ['<4.17.19'],
      cve: 'CVE-2020-8203',
      severity: 'high' as const,
      description: 'Prototype pollution in lodash',
    },
    {
      library: 'axios',
      versions: ['<0.21.1'],
      cve: 'CVE-2020-28168',
      severity: 'medium' as const,
      description: 'SSRF vulnerability in axios',
    }
  ];

  async scan(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check script tags for library versions
      vulnerabilities.push(...this.checkScriptTags());
      
      // Check window object for loaded libraries
      vulnerabilities.push(...this.checkWindowLibraries());
      
    } catch (error) {
      console.error('Dependency Checker error:', error);
    }

    return vulnerabilities;
  }

  private checkScriptTags(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const scripts = document.querySelectorAll('script[src]');

    scripts.forEach((script) => {
      const src = script.getAttribute('src');
      if (!src) return;

      const libraryInfo = this.extractLibraryInfo(src);
      if (libraryInfo) {
        const vulnerability = this.checkForVulnerability(libraryInfo);
        if (vulnerability) {
          vulnerabilities.push({
            id: generateId(),
            category: 'dependency',
            title: `Vulnerable Dependency: ${libraryInfo.name}`,
            description: `${libraryInfo.name} version ${libraryInfo.version} has known security vulnerabilities`,
            severity: vulnerability.severity,
            impact: vulnerability.description,
            recommendation: `Update ${libraryInfo.name} to a secure version`,
            remediation: `Upgrade to the latest version of ${libraryInfo.name}`,
            cweId: 'CWE-1104',
            owaspCategory: 'A06:2021 – Vulnerable and Outdated Components',
            element: script as HTMLElement,
            location: { url: window.location.href },
            evidence: `Script src: ${src}`,
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: 80,
            references: [
              `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vulnerability.cve}`,
            ],
            tags: ['vulnerable-dependency', 'outdated-library'],
          });
        }
      }
    });

    return vulnerabilities;
  }

  private checkWindowLibraries(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for common libraries in window object
    const librariesToCheck = [
      { name: 'jquery', prop: 'jQuery' },
      { name: 'lodash', prop: '_' },
      { name: 'moment', prop: 'moment' },
    ];

    librariesToCheck.forEach(({ name, prop }) => {
      const lib = (window as Record<string, unknown>)[prop];
      if (lib && lib.fn && lib.fn.jquery) {
        // jQuery version check
        const version = lib.fn.jquery;
        const vulnerability = this.checkForVulnerability({ name, version });
        if (vulnerability) {
          vulnerabilities.push({
            id: generateId(),
            category: 'dependency',
            title: `Vulnerable Library: ${name}`,
            description: `${name} version ${version} loaded with known vulnerabilities`,
            severity: vulnerability.severity,
            impact: vulnerability.description,
            recommendation: `Update ${name} to secure version`,
            remediation: `Upgrade ${name} library`,
            cweId: 'CWE-1104',
            owaspCategory: 'A06:2021 – Vulnerable and Outdated Components',
            location: { url: window.location.href },
            evidence: `Window.${prop} version: ${version}`,
            detectedAt: getTimestamp(),
            scannerName: this.name,
            confidence: 90,
            references: [
              `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vulnerability.cve}`,
            ],
            tags: ['vulnerable-dependency', 'runtime-library'],
          });
        }
      }
    });

    return vulnerabilities;
  }

  private extractLibraryInfo(src: string): { name: string; version: string } | null {
    // Simple regex patterns for common CDN formats
    const patterns = [
      /\/([^/]+)@(\d+\.\d+\.\d+)/,  // unpkg format
      /\/([^/]+)-(\d+\.\d+\.\d+)\.min\.js/,  // traditional format
      /\/([^/]+)\/(\d+\.\d+\.\d+)/,  // cdnjs format
    ];

    for (const pattern of patterns) {
      const match = src.match(pattern);
      if (match) {
        return { name: match[1], version: match[2] };
      }
    }

    return null;
  }

  private checkForVulnerability(libraryInfo: { name: string; version: string }) {
    return this.knownVulnerabilities.find(vuln => 
      vuln.library === libraryInfo.name &&
      this.isVulnerableVersion(libraryInfo.version, vuln.versions)
    );
  }

  private isVulnerableVersion(version: string, vulnerableVersions: string[]): boolean {
    // Simplified version comparison - in production, use proper semver library
    return vulnerableVersions.some(vulnVersion => {
      if (vulnVersion.startsWith('<')) {
        const targetVersion = vulnVersion.substring(1);
        return this.compareVersions(version, targetVersion) < 0;
      }
      return version === vulnVersion;
    });
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart < bPart) return -1;
      if (aPart > bPart) return 1;
    }
    
    return 0;
  }
}