/**
 * Template Engine for Test Recording Patterns
 * Manages creation, application, and reuse of test templates
 */

import type {
  TestTemplate,
  TemplateParameter,
  EventPattern,
  RecordedEvent,
  SharedTestRecording,
  CollaborationUser,
  TemplateUsageStats
} from '../../../types';

/**
 * Template creation options
 */
export interface TemplateCreationOptions {
  name: string;
  description?: string;
  parameters: TemplateParameterDefinition[];
  extractParameters?: boolean; // Auto-extract parameters from recording
  optimizePattern?: boolean; // Optimize event patterns
}

/**
 * Template parameter definition for creation
 */
export interface TemplateParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'selector';
  description: string;
  required: boolean;
  defaultValue?: any;
  extraction?: {
    fromEvent: number; // Event index
    fromProperty: string; // Property path like 'target.selector'
    pattern?: string; // Regex for extraction
  };
}

/**
 * Template application options
 */
export interface TemplateApplicationOptions {
  parameters: Record<string, any>;
  baseUrl?: string;
  viewport?: { width: number; height: number };
  userAgent?: string;
  generateMetadata?: boolean;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingParameters: string[];
}

/**
 * Template analysis result
 */
export interface TemplateAnalysisResult {
  complexity: 'simple' | 'medium' | 'complex';
  parameterCount: number;
  eventCount: number;
  uniqueEventTypes: string[];
  estimatedDuration: number;
  browserCompatibility: string[];
  dependencies: string[];
}

/**
 * Template Engine for managing reusable test patterns
 */
export class TemplateEngine {
  private readonly storage: TemplateStorage;
  private readonly validator: TemplateValidator;
  private readonly analyzer: TemplateAnalyzer;

  constructor(config: TemplateEngineConfig) {
    this.storage = new TemplateStorage(config.storage);
    this.validator = new TemplateValidator();
    this.analyzer = new TemplateAnalyzer();
  }

  /**
   * Create template from recording
   */
  async createFromRecording(
    recording: SharedTestRecording,
    options: TemplateCreationOptions,
    author: CollaborationUser
  ): Promise<TestTemplate> {
    // Extract patterns from recording events
    const patterns = this.extractEventPatterns(
      recording.events,
      options.extractParameters || false
    );

    // Optimize patterns if requested
    const optimizedPatterns = options.optimizePattern 
      ? this.optimizePatterns(patterns)
      : patterns;

    // Create template
    const template: TestTemplate = {
      id: this.generateTemplateId(),
      name: options.name,
      description: options.description,
      pattern: optimizedPatterns,
      parameters: options.parameters,
      usage: {
        uses: 0,
        lastUsed: Date.now(),
        successRate: 100,
        rating: 0,
        reviews: 0
      },
      author,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Validate template
    const validation = this.validator.validate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    await this.storage.saveTemplate(template);
    return template;
  }

  /**
   * Apply template to generate test recording
   */
  async applyTemplate(
    templateId: string,
    options: TemplateApplicationOptions
  ): Promise<SharedTestRecording> {
    const template = await this.storage.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate parameters
    const validation = this.validateParameters(template, options.parameters);
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    // Generate events from patterns
    const events = this.generateEventsFromPatterns(
      template.pattern,
      options.parameters
    );

    // Create recording metadata
    const metadata = options.generateMetadata 
      ? this.generateRecordingMetadata(template, options)
      : this.createMinimalMetadata();

    // Create shared test recording
    const recording: SharedTestRecording = {
      id: this.generateRecordingId(),
      originalId: this.generateRecordingId(),
      shareId: this.generateShareId(),
      name: `Generated from ${template.name}`,
      description: `Test generated from template: ${template.name}`,
      events,
      metadata,
      sharing: {
        visibility: 'private',
        allowFork: true,
        allowEdit: true,
        allowComment: true,
        allowDownload: true,
        requireLogin: false,
        permissions: {}
      },
      collaborators: [],
      comments: [],
      reviews: [],
      versions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'template-engine'
    };

    // Update template usage
    await this.recordTemplateUsage(templateId);

    return recording;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<TestTemplate | null> {
    return this.storage.getTemplate(templateId);
  }

  /**
   * List available templates
   */
  async listTemplates(filters?: {
    author?: string;
    complexity?: ('simple' | 'medium' | 'complex')[];
    tags?: string[];
    search?: string;
  }): Promise<TestTemplate[]> {
    return this.storage.listTemplates(filters);
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<TestTemplate>,
    user: CollaborationUser
  ): Promise<TestTemplate> {
    const template = await this.storage.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check permissions
    if (template.author.id !== user.id && !user.permissions.canEdit) {
      throw new Error('Insufficient permissions to update template');
    }

    const updatedTemplate: TestTemplate = {
      ...template,
      ...updates,
      updatedAt: Date.now()
    };

    // Validate updated template
    const validation = this.validator.validate(updatedTemplate);
    if (!validation.valid) {
      throw new Error(`Invalid template update: ${validation.errors.join(', ')}`);
    }

    await this.storage.saveTemplate(updatedTemplate);
    return updatedTemplate;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, user: CollaborationUser): Promise<void> {
    const template = await this.storage.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check permissions
    if (template.author.id !== user.id && !user.permissions.canDelete) {
      throw new Error('Insufficient permissions to delete template');
    }

    await this.storage.deleteTemplate(templateId);
  }

  /**
   * Analyze template complexity and requirements
   */
  async analyzeTemplate(templateId: string): Promise<TemplateAnalysisResult> {
    const template = await this.storage.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.analyzer.analyze(template);
  }

  /**
   * Find similar templates
   */
  async findSimilarTemplates(
    templateId: string,
    threshold: number = 0.7
  ): Promise<Array<{ template: TestTemplate; similarity: number }>> {
    const template = await this.storage.getTemplate(templateId);
    if (!template) {
      return [];
    }

    const allTemplates = await this.storage.listTemplates();
    const similarities: Array<{ template: TestTemplate; similarity: number }> = [];

    for (const other of allTemplates) {
      if (other.id === template.id) continue;

      const similarity = this.calculateSimilarity(template, other);
      if (similarity >= threshold) {
        similarities.push({ template: other, similarity });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Extract reusable patterns from multiple recordings
   */
  async extractCommonPatterns(
    recordings: SharedTestRecording[],
    minOccurrences: number = 2
  ): Promise<EventPattern[]> {
    if (recordings.length === 0) {
      return [];
    }

    // Extract all patterns
    const allPatterns = recordings.flatMap(recording =>
      this.extractEventPatterns(recording.events, false)
    );

    // Group similar patterns
    const patternGroups = this.groupSimilarPatterns(allPatterns);

    // Find patterns that occur frequently
    const commonPatterns: EventPattern[] = [];
    for (const [pattern, occurrences] of patternGroups) {
      if (occurrences.length >= minOccurrences) {
        commonPatterns.push(pattern);
      }
    }

    return commonPatterns;
  }

  /**
   * Generate template from common patterns
   */
  async createFromCommonPatterns(
    patterns: EventPattern[],
    name: string,
    description: string,
    author: CollaborationUser
  ): Promise<TestTemplate> {
    // Automatically identify parameters
    const parameters = this.identifyParameters(patterns);

    const template: TestTemplate = {
      id: this.generateTemplateId(),
      name,
      description,
      pattern: patterns,
      parameters,
      usage: {
        uses: 0,
        lastUsed: Date.now(),
        successRate: 100,
        rating: 0,
        reviews: 0
      },
      author,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.storage.saveTemplate(template);
    return template;
  }

  /**
   * Private helper methods
   */
  private extractEventPatterns(
    events: RecordedEvent[],
    extractParameters: boolean
  ): EventPattern[] {
    return events.map((event, index) => {
      const pattern: EventPattern = {
        type: event.type,
        target: {
          selector: event.target.selector,
          attributes: {}, // Could extract from target
          textContent: event.target.textContent,
          parameterized: []
        },
        data: event.data,
        optional: false,
        parameterized: []
      };

      // Extract parameters if requested
      if (extractParameters) {
        pattern.parameterized = this.identifyParametersInEvent(event);
      }

      return pattern;
    });
  }

  private optimizePatterns(patterns: EventPattern[]): EventPattern[] {
    // Remove redundant patterns, merge similar ones, etc.
    const optimized: EventPattern[] = [];
    
    for (const pattern of patterns) {
      // Skip redundant patterns
      const isDuplicate = optimized.some(existing => 
        this.arePatternsEqual(existing, pattern)
      );
      
      if (!isDuplicate) {
        optimized.push(pattern);
      }
    }

    return optimized;
  }

  private generateEventsFromPatterns(
    patterns: EventPattern[],
    parameters: Record<string, any>
  ): RecordedEvent[] {
    return patterns.map((pattern, index) => {
      // Apply parameters to pattern
      const selector = this.applyParametersToString(
        pattern.target?.selector || '',
        parameters
      );

      const textContent = pattern.target?.textContent 
        ? this.applyParametersToString(pattern.target.textContent, parameters)
        : undefined;

      // Create recorded event
      const event: RecordedEvent = {
        id: `event_${index}_${Date.now()}`,
        type: pattern.type,
        timestamp: Date.now() + (index * 1000), // Space events 1 second apart
        sequence: index,
        target: {
          selector,
          textContent,
          tagName: 'div', // Default, could be extracted from pattern
          boundingRect: new DOMRect(0, 0, 100, 30),
          path: [],
          alternativeSelectors: []
        },
        data: this.applyParametersToData(pattern.data, parameters),
        context: {
          url: parameters.baseUrl || window.location.href,
          title: document.title,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            isLandscape: window.innerWidth > window.innerHeight,
            isMobile: false
          },
          userAgent: navigator.userAgent
        },
        metadata: {
          sessionId: `template_session_${Date.now()}`,
          recordingMode: 'template',
          reliability: {
            selectorScore: 0.8,
            alternativesCount: 0,
            elementStable: true,
            positionStable: true,
            attributesStable: true,
            timingVariability: 0.1,
            networkDependency: false,
            confidence: 0.8
          },
          annotations: [],
          custom: {}
        }
      };

      return event;
    });
  }

  private validateParameters(
    template: TestTemplate,
    providedParameters: Record<string, any>
  ): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingParameters: string[] = [];

    // Check required parameters
    for (const param of template.parameters) {
      if (param.required && !(param.name in providedParameters)) {
        missingParameters.push(param.name);
        errors.push(`Required parameter missing: ${param.name}`);
      }
    }

    // Validate parameter types
    for (const [name, value] of Object.entries(providedParameters)) {
      const paramDef = template.parameters.find(p => p.name === name);
      if (!paramDef) {
        warnings.push(`Unknown parameter: ${name}`);
        continue;
      }

      if (!this.validateParameterType(value, paramDef.type)) {
        errors.push(`Invalid type for parameter ${name}. Expected ${paramDef.type}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingParameters
    };
  }

  private validateParameterType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'selector':
        return typeof value === 'string' && value.length > 0;
      default:
        return false;
    }
  }

  private generateRecordingMetadata(
    template: TestTemplate,
    options: TemplateApplicationOptions
  ): any {
    return {
      sessionId: `template_${template.id}_${Date.now()}`,
      url: options.baseUrl || window.location.href,
      title: `Generated from ${template.name}`,
      viewport: options.viewport || {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        isLandscape: window.innerWidth > window.innerHeight,
        isMobile: false
      },
      userAgent: options.userAgent || navigator.userAgent,
      duration: template.pattern.length * 1000, // Estimate 1 second per event
      eventCount: template.pattern.length,
      tags: ['template-generated'],
      category: 'generated',
      framework: 'browser-automation-test-recorder',
      language: 'javascript',
      complexity: template.pattern.length > 20 ? 'complex' : 
                 template.pattern.length > 10 ? 'medium' : 'simple',
      browserSupport: ['chrome', 'firefox', 'safari', 'edge'],
      dependencies: []
    };
  }

  private createMinimalMetadata(): any {
    return {
      sessionId: `template_${Date.now()}`,
      url: window.location.href,
      title: 'Template Generated Test',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        isLandscape: window.innerWidth > window.innerHeight,
        isMobile: false
      },
      userAgent: navigator.userAgent,
      duration: 0,
      eventCount: 0,
      tags: [],
      category: 'uncategorized',
      framework: 'browser-automation-test-recorder',
      language: 'javascript',
      complexity: 'simple',
      browserSupport: [],
      dependencies: []
    };
  }

  private recordTemplateUsage(templateId: string): Promise<void> {
    // Update usage statistics
    return this.storage.updateTemplateUsage(templateId, 'use');
  }

  private applyParametersToString(text: string, parameters: Record<string, any>): string {
    let result = text;
    
    // Replace parameter placeholders like {{paramName}}
    for (const [name, value] of Object.entries(parameters)) {
      const pattern = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
      result = result.replace(pattern, String(value));
    }
    
    return result;
  }

  private applyParametersToData(data: any, parameters: Record<string, any>): any {
    if (typeof data === 'string') {
      return this.applyParametersToString(data, parameters);
    } else if (Array.isArray(data)) {
      return data.map(item => this.applyParametersToData(item, parameters));
    } else if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.applyParametersToData(value, parameters);
      }
      return result;
    } else {
      return data;
    }
  }

  private identifyParametersInEvent(event: RecordedEvent): string[] {
    const parameters: string[] = [];
    
    // Look for common parameter patterns
    const selector = event.target.selector;
    const textContent = event.target.textContent;
    
    // Check for dynamic values that could be parameterized
    if (selector.includes('[value=') || selector.includes('[id=')) {
      parameters.push('selector');
    }
    
    if (textContent && /\d+/.test(textContent)) {
      parameters.push('text');
    }
    
    return parameters;
  }

  private identifyParameters(patterns: EventPattern[]): TemplateParameter[] {
    const parameters: TemplateParameter[] = [];
    const seen = new Set<string>();
    
    patterns.forEach(pattern => {
      // Look for parameterizable values
      if (pattern.target?.selector && !seen.has('selector')) {
        parameters.push({
          name: 'selector',
          type: 'selector',
          description: 'Element selector',
          required: true,
          defaultValue: pattern.target.selector
        });
        seen.add('selector');
      }
      
      if (pattern.target?.textContent && !seen.has('text')) {
        parameters.push({
          name: 'text',
          type: 'string',
          description: 'Text content',
          required: false,
          defaultValue: pattern.target.textContent
        });
        seen.add('text');
      }
    });
    
    return parameters;
  }

  private groupSimilarPatterns(patterns: EventPattern[]): Map<EventPattern, EventPattern[]> {
    const groups = new Map<EventPattern, EventPattern[]>();
    
    for (const pattern of patterns) {
      let found = false;
      
      for (const [key, group] of groups) {
        if (this.arePatternsEqual(key, pattern)) {
          group.push(pattern);
          found = true;
          break;
        }
      }
      
      if (!found) {
        groups.set(pattern, [pattern]);
      }
    }
    
    return groups;
  }

  private arePatternsEqual(a: EventPattern, b: EventPattern): boolean {
    return a.type === b.type &&
           a.target?.selector === b.target?.selector;
  }

  private calculateSimilarity(a: TestTemplate, b: TestTemplate): number {
    // Simple similarity based on pattern matching
    let matches = 0;
    const totalPatterns = Math.max(a.pattern.length, b.pattern.length);
    
    for (let i = 0; i < Math.min(a.pattern.length, b.pattern.length); i++) {
      if (this.arePatternsEqual(a.pattern[i], b.pattern[i])) {
        matches++;
      }
    }
    
    return matches / totalPatterns;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecordingId(): string {
    return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateShareId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}

/**
 * Configuration for template engine
 */
export interface TemplateEngineConfig {
  storage: {
    type: 'indexeddb' | 'localstorage' | 'memory';
    name?: string;
  };
}

/**
 * Template storage implementation
 */
class TemplateStorage {
  private readonly config: TemplateEngineConfig['storage'];

  constructor(config: TemplateEngineConfig['storage']) {
    this.config = config;
  }

  async saveTemplate(template: TestTemplate): Promise<void> {
    if (this.config.type === 'localstorage') {
      localStorage.setItem(`template_${template.id}`, JSON.stringify(template));
    }
  }

  async getTemplate(templateId: string): Promise<TestTemplate | null> {
    if (this.config.type === 'localstorage') {
      const data = localStorage.getItem(`template_${templateId}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async listTemplates(filters?: {
    author?: string;
    complexity?: ('simple' | 'medium' | 'complex')[];
    tags?: string[];
    search?: string;
  }): Promise<TestTemplate[]> {
    const templates: TestTemplate[] = [];
    
    if (this.config.type === 'localstorage') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('template_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const template = JSON.parse(data);
            
            // Apply filters
            if (filters?.author && template.author.id !== filters.author) continue;
            if (filters?.search) {
              const searchLower = filters.search.toLowerCase();
              if (!template.name.toLowerCase().includes(searchLower) &&
                  !template.description?.toLowerCase().includes(searchLower)) {
                continue;
              }
            }
            
            templates.push(template);
          }
        }
      }
    }
    
    return templates.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async deleteTemplate(templateId: string): Promise<void> {
    if (this.config.type === 'localstorage') {
      localStorage.removeItem(`template_${templateId}`);
    }
  }

  async updateTemplateUsage(
    templateId: string,
    action: 'use' | 'rate'
  ): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (template) {
      if (action === 'use') {
        template.usage.uses++;
        template.usage.lastUsed = Date.now();
      }
      await this.saveTemplate(template);
    }
  }
}

/**
 * Template validator
 */
class TemplateValidator {
  validate(template: TestTemplate): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!template.id) errors.push('Template ID is required');
    if (!template.name) errors.push('Template name is required');
    if (!template.pattern || template.pattern.length === 0) {
      errors.push('Template must have at least one pattern');
    }
    if (!template.author) errors.push('Template author is required');

    // Validate parameters
    template.parameters.forEach((param, index) => {
      if (!param.name) errors.push(`Parameter ${index} missing name`);
      if (!param.type) errors.push(`Parameter ${index} missing type`);
      if (!param.description) warnings.push(`Parameter ${index} missing description`);
    });

    // Validate patterns
    template.pattern.forEach((pattern, index) => {
      if (!pattern.type) errors.push(`Pattern ${index} missing type`);
      if (!pattern.target?.selector && pattern.type !== 'wait') {
        warnings.push(`Pattern ${index} missing selector`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingParameters: []
    };
  }
}

/**
 * Template analyzer
 */
class TemplateAnalyzer {
  analyze(template: TestTemplate): TemplateAnalysisResult {
    const eventCount = template.pattern.length;
    const parameterCount = template.parameters.length;
    const uniqueEventTypes = [...new Set(template.pattern.map(p => p.type))];
    
    // Determine complexity
    let complexity: 'simple' | 'medium' | 'complex';
    if (eventCount < 5 && parameterCount < 3) {
      complexity = 'simple';
    } else if (eventCount < 15 && parameterCount < 8) {
      complexity = 'medium';
    } else {
      complexity = 'complex';
    }

    return {
      complexity,
      parameterCount,
      eventCount,
      uniqueEventTypes,
      estimatedDuration: eventCount * 1000, // 1 second per event
      browserCompatibility: ['chrome', 'firefox', 'safari', 'edge'],
      dependencies: []
    };
  }
}