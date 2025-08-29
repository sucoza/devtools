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
    const axeConfig: any = {
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
    options: Partial<ScanOptions> = {}
  ): Promise<AccessibilityAuditResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }
    
    this.isScanning = true;
    this.scanAbortController = new AbortController();
    
    const startTime = performance.now();
    
    try {
      // Prepare axe options
      const axeOptions = {
        elementRef: this.config.elementRef,
        ancestry: this.config.ancestry || false,
        xpath: this.config.xpath || false,
        reporter: this.config.reporter || 'v2',
        runOnly: this.config.tags ? { type: 'tag', values: this.config.tags } : undefined,
      };
      
      // Run axe scan
      const results = await axe.run(element, axeOptions);
      
      const endTime = performance.now();
      const scanDuration = endTime - startTime;
      
      // Transform axe results to our format
      const auditResult: AccessibilityAuditResult = {
        url: window.location.href,
        timestamp: Date.now(),
        violations: results.violations.map(this.transformAxeResult),
        incomplete: results.incomplete.map(this.transformAxeResult),
        passes: results.passes.map(this.transformAxeResult),
        inapplicable: results.inapplicable.map(this.transformAxeResult),
        testEngine: {
          name: results.testEngine.name,
          version: results.testEngine.version,
        },
        testRunner: {
          name: results.testRunner.name,
        },
        testEnvironment: {
          userAgent: results.testEnvironment.userAgent,
          windowWidth: results.testEnvironment.windowWidth,
          windowHeight: results.testEnvironment.windowHeight,
          orientationAngle: results.testEnvironment.orientationAngle,
          orientationType: results.testEnvironment.orientationType,
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
  private transformAxeResult = (axeResult: any): AccessibilityIssue => {
    return {
      id: `${axeResult.id}-${Date.now()}`,
      rule: axeResult.id,
      impact: mapImpactToSeverity(axeResult.impact || 'moderate'),
      description: axeResult.description,
      help: axeResult.help,
      helpUrl: axeResult.helpUrl,
      tags: axeResult.tags,
      nodes: axeResult.nodes.map(this.transformAxeNode),
      type: this.determineViolationType(axeResult),
      timestamp: Date.now(),
    };
  };
  
  /**
   * Transform axe node to our accessibility node format
   */
  private transformAxeNode = (axeNode: any): AccessibilityNode => {
    const node: AccessibilityNode = {
      html: axeNode.html,
      target: axeNode.target,
    };
    
    if (axeNode.failureSummary) {
      node.failureSummary = axeNode.failureSummary;
    }
    
    if (this.config.xpath && axeNode.xpath) {
      node.xpath = axeNode.xpath;
    }
    
    if (this.config.ancestry && axeNode.ancestry) {
      node.ancestry = axeNode.ancestry;
    }
    
    // Get element bounding rect if possible
    try {
      const element = document.querySelector(axeNode.target[0]);
      if (element) {
        node.boundingRect = element.getBoundingClientRect();
      }
    } catch (error) {
      // Ignore selector errors
    }
    
    return node;
  };
  
  /**
   * Determine violation type from axe result context
   */
  private determineViolationType(axeResult: any): 'violation' | 'incomplete' | 'inapplicable' | 'passes' {
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