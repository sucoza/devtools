import * as axe from 'axe-core';
import type {
  AccessibilityAuditResult,
  AccessibilityIssue,
  AccessibilityConfig,
  ScanOptions,
  ScanPerformanceMetrics,
  AccessibilityNode,
} from '../types';
import { mapImpactToSeverity } from '../utils/wcag-utils';

/**
 * Core accessibility scanner using axe-core
 */
export class AccessibilityScanner {
  private config: AccessibilityConfig;
  private isScanning = false;
  private scanAbortController?: AbortController;
  private mutationObserver?: MutationObserver;
  
  constructor(config: AccessibilityConfig = {
    wcagLevel: 'AA',
    includeExperimental: false,
  }) {
    this.config = config;
    this.setupAxe();
  }
  
  /**
   * Configure axe-core with custom rules and settings
   */
  private setupAxe(): void {
    // Configure axe-core
    const axeConfig: Record<string, any> = {
      branding: {
        brand: 'TanStack DevTools',
        application: 'accessibility-scanner',
      },
      reporter: this.config.reporter || 'v2',
    };
    
    // Apply custom rules configuration
    if (this.config.rules) {
      axeConfig.rules = this.config.rules;
    }
    
    // Set WCAG level tags
    const wcagTags = [`wcag2${this.config.wcagLevel.toLowerCase()}`];
    if (this.config.wcagLevel === 'AA') wcagTags.push('wcag2a');
    if (this.config.wcagLevel === 'AAA') wcagTags.push('wcag2a', 'wcag2aa');
    
    if (this.config.tags) {
      axeConfig.tags = [...wcagTags, ...this.config.tags];
    } else {
      axeConfig.tags = wcagTags;
    }
    
    // Include experimental rules if requested
    if (this.config.includeExperimental) {
      axeConfig.tags.push('experimental');
    }
    
    axe.configure(axeConfig);
  }
  
  /**
   * Run accessibility audit on specified element or entire page
   */
  async scan(
    element: Element | Document = document,
    _options: Partial<ScanOptions> = {}
  ): Promise<AccessibilityAuditResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }
    
    this.isScanning = true;
    this.scanAbortController = new AbortController();
    
    const startTime = performance.now();
    
    try {
      // Prepare axe options
      const axeOptions: Record<string, any> = {
        elementRef: this.config.elementRef,
        ancestry: this.config.ancestry || false,
        xpath: this.config.xpath || false,
        reporter: this.config.reporter || 'v2',
      };

      if (this.config.tags) {
        axeOptions.runOnly = { type: 'tag', values: this.config.tags };
      }
      
      // Run axe scan
      const results = await axe.run(element, axeOptions);
      
      const endTime = performance.now();
      const _scanDuration = endTime - startTime;
      
      // Transform axe results to our format
      const auditResult: AccessibilityAuditResult = {
        url: window.location.href,
        timestamp: Date.now(),
        violations: (results as any).violations?.map(this.transformAxeResult) || [],
        incomplete: (results as any).incomplete?.map(this.transformAxeResult) || [],
        passes: (results as any).passes?.map(this.transformAxeResult) || [],
        inapplicable: (results as any).inapplicable?.map(this.transformAxeResult) || [],
        testEngine: {
          name: (results as any).testEngine?.name || 'axe-core',
          version: (results as any).testEngine?.version || '4.0.0',
        },
        testRunner: {
          name: (results as any).testRunner?.name || 'accessibility-scanner',
        },
        testEnvironment: {
          userAgent: (results as any).testEnvironment?.userAgent || navigator.userAgent,
          windowWidth: (results as any).testEnvironment?.windowWidth || window.innerWidth,
          windowHeight: (results as any).testEnvironment?.windowHeight || window.innerHeight,
          orientationAngle: (results as any).testEnvironment?.orientationAngle,
          orientationType: (results as any).testEnvironment?.orientationType,
        },
      };
      
      return auditResult;
    } catch (error) {
      throw new Error(`Accessibility scan failed: ${error}`);
    } finally {
      this.isScanning = false;
      this.scanAbortController = undefined;
    }
  }
  
  /**
   * Transform axe result to our accessibility issue format
   */
  private transformAxeResult = (axeResult: unknown): AccessibilityIssue => {
    const result = axeResult as Record<string, any>;
    return {
      id: `${result.id}-${Date.now()}`,
      rule: result.id as string,
      impact: mapImpactToSeverity(result.impact || 'moderate'),
      description: result.description as string,
      help: result.help as string,
      helpUrl: result.helpUrl as string,
      tags: result.tags as string[],
      nodes: (result.nodes as any[]).map(this.transformAxeNode),
      type: this.determineViolationType(result),
      timestamp: Date.now(),
    };
  };
  
  /**
   * Transform axe node to our accessibility node format
   */
  private transformAxeNode = (axeNode: unknown): AccessibilityNode => {
    const nodeData = axeNode as Record<string, any>;
    const node: AccessibilityNode = {
      html: nodeData.html as string,
      target: nodeData.target as string[],
    };
    
    if (nodeData.failureSummary) {
      node.failureSummary = nodeData.failureSummary as string;
    }
    
    if (this.config.xpath && nodeData.xpath) {
      node.xpath = nodeData.xpath as string;
    }
    
    if (this.config.ancestry && nodeData.ancestry) {
      node.ancestry = nodeData.ancestry as string[];
    }
    
    // Get element bounding rect if possible
    try {
      const element = document.querySelector((nodeData.target as string[])[0]);
      if (element) {
        node.boundingRect = element.getBoundingClientRect();
      }
    } catch {
      // Ignore selector errors
    }
    
    return node;
  };
  
  /**
   * Determine violation type from axe result context
   */
  private determineViolationType(_axeResult: unknown): 'violation' | 'incomplete' | 'inapplicable' | 'passes' {
    // This would be determined by the context in which transformAxeResult is called
    // For now, default to violation
    return 'violation';
  }
  
  /**
   * Start continuous scanning with DOM mutation observer
   */
  startContinuousScanning(
    callback: (result: AccessibilityAuditResult) => void,
    options: ScanOptions
  ): void {
    this.stopContinuousScanning();
    
    const performScan = async () => {
      if (this.isScanning) return;
      
      try {
        const result = await this.scan(
          options.elementSelector ? document.querySelector(options.elementSelector) || document : document,
          options
        );
        callback(result);
      } catch (error) {
        console.error('Continuous scan error:', error);
      }
    };
    
    // Initial scan
    performScan();
    
    // Set up mutation observer for continuous scanning
    if (options.continuous) {
      this.mutationObserver = new MutationObserver(() => {
        // Debounce the scan
        setTimeout(performScan, options.debounceMs || 1000);
      });
      
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-*', 'role', 'tabindex', 'alt', 'title'],
      });
    }
  }
  
  /**
   * Stop continuous scanning
   */
  stopContinuousScanning(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }
    
    if (this.scanAbortController) {
      this.scanAbortController.abort();
    }
  }
  
  /**
   * Update scanner configuration
   */
  updateConfig(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };
    this.setupAxe();
  }
  
  /**
   * Get performance metrics for the last scan
   */
  getPerformanceMetrics(): ScanPerformanceMetrics {
    return {
      scanDuration: 0, // Would be set from actual scan timing
      rulesRun: Object.keys(this.config.rules || {}).length,
      elementsScanned: document.querySelectorAll('*').length,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Check if scanner is currently running
   */
  isRunning(): boolean {
    return this.isScanning;
  }
  
  /**
   * Get current configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }
  
  /**
   * Get axe-core version
   */
  getAxeVersion(): string {
    return axe.version;
  }
  
  /**
   * Get available axe rules
   */
  getAvailableRules(): Array<{ ruleId: string; description: string; tags: string[] }> {
    return axe.getRules().map(rule => ({
      ruleId: rule.ruleId,
      description: rule.description,
      tags: rule.tags,
    }));
  }
  
  /**
   * Reset axe configuration to defaults
   */
  resetConfig(): void {
    this.config = {
      wcagLevel: 'AA',
      includeExperimental: false,
    };
    axe.reset();
    this.setupAxe();
  }
}