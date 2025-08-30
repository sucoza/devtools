/**
 * Test Data Parameterization - Data Extractor
 * Extracts dynamic test data from recorded events for parameterization
 */

import type { RecordedEvent } from '../../types';

export interface ExtractedParameter {
  id: string;
  name: string;
  type: ParameterType;
  category: ParameterCategory;
  value: any;
  source: ParameterSource;
  pattern?: string; // Regex pattern for validation
  constraints?: ParameterConstraints;
  metadata: ParameterMetadata;
}

export type ParameterType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'email' 
  | 'url' 
  | 'phone' 
  | 'creditCard'
  | 'ssn'
  | 'json'
  | 'array'
  | 'file';

export type ParameterCategory = 
  | 'userInput' 
  | 'formData' 
  | 'navigation' 
  | 'apiData'
  | 'selector'
  | 'assertion'
  | 'timing'
  | 'environment';

export interface ParameterSource {
  eventId: string;
  eventType: string;
  field: string; // Which field in the event contains this value
  xpath?: string; // XPath to the element if applicable
  selector?: string; // CSS selector if applicable
}

export interface ParameterConstraints {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  required: boolean;
  unique?: boolean;
  format?: string;
  enum?: any[];
  dependencies?: string[]; // IDs of other parameters this depends on
}

export interface ParameterMetadata {
  description?: string;
  examples: any[];
  frequency: number; // How often this parameter appears
  variance: number; // How much the values vary (0-1)
  dataType: 'static' | 'dynamic' | 'generated';
  sensitive: boolean; // Whether this contains sensitive data
  faker?: string; // Faker.js method to generate this type
  tags: string[];
  lastSeen: number;
}

export interface ExtractionRule {
  id: string;
  name: string;
  pattern: RegExp;
  type: ParameterType;
  category: ParameterCategory;
  priority: number;
  extractor: (value: string, context: ExtractionContext) => ExtractedParameter | null;
}

export interface ExtractionContext {
  event: RecordedEvent;
  elementType?: string;
  inputType?: string;
  label?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  category?: string;
}

export interface DataSet {
  id: string;
  name: string;
  description?: string;
  parameters: ExtractedParameter[];
  combinations: DataCombination[];
  format: 'csv' | 'json' | 'yaml' | 'excel';
  filePath?: string;
  createdAt: number;
  updatedAt: number;
  metadata: DataSetMetadata;
}

export interface DataSetMetadata {
  source: 'extracted' | 'imported' | 'generated';
  recordingSessionId?: string;
  environment?: string;
  testSuite?: string;
  tags: string[];
  version: string;
}

export interface DataCombination {
  id: string;
  name?: string;
  values: Record<string, any>;
  weight: number; // Probability of selection (0-1)
  valid: boolean;
  tags: string[];
  description?: string;
}

export class DataExtractor {
  private extractionRules: ExtractionRule[] = [];
  private extractedParameters = new Map<string, ExtractedParameter>();
  private dataSets = new Map<string, DataSet>();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Extract parameters from recorded events
   */
  extractFromEvents(events: RecordedEvent[]): ExtractedParameter[] {
    this.extractedParameters.clear();

    events.forEach(event => {
      const parameters = this.extractFromEvent(event);
      parameters.forEach(param => {
        const existing = this.extractedParameters.get(param.name);
        if (existing) {
          // Merge with existing parameter
          this.mergeParameters(existing, param);
        } else {
          this.extractedParameters.set(param.name, param);
        }
      });
    });

    return Array.from(this.extractedParameters.values());
  }

  /**
   * Extract parameters from a single event
   */
  extractFromEvent(event: RecordedEvent): ExtractedParameter[] {
    const parameters: ExtractedParameter[] = [];
    const context: ExtractionContext = {
      event,
      elementType: event.target.tagName,
      inputType: event.target.type,
      label: this.findLabel(event),
      placeholder: event.target.placeholder,
      name: event.target.name,
      id: event.target.id,
    };

    // Extract from different event data types
    switch (event.data.type) {
      case 'keyboard':
        if (event.data.inputValue) {
          parameters.push(...this.extractFromValue(event.data.inputValue, context));
        }
        break;

      case 'form':
        if (event.data.value) {
          parameters.push(...this.extractFromValue(event.data.value, context));
        }
        if (event.data.formData) {
          parameters.push(...this.extractFromFormData(event.data.formData, context));
        }
        if (event.data.selectedOptions) {
          parameters.push(...this.extractFromOptions(event.data.selectedOptions, context));
        }
        break;

      case 'navigation':
        parameters.push(...this.extractFromURL(event.data.url, context));
        break;

      case 'assertion':
        parameters.push(...this.extractFromAssertion(event.data.expected, context));
        break;
    }

    // Extract from target element
    if (event.target.value) {
      parameters.push(...this.extractFromValue(event.target.value, context));
    }

    if (event.target.textContent) {
      parameters.push(...this.extractFromValue(event.target.textContent, context));
    }

    return parameters;
  }

  /**
   * Create data set from extracted parameters
   */
  createDataSet(
    name: string,
    parameters: ExtractedParameter[],
    options: {
      generateCombinations?: boolean;
      maxCombinations?: number;
      format?: 'csv' | 'json' | 'yaml' | 'excel';
      metadata?: Partial<DataSetMetadata>;
    } = {}
  ): DataSet {
    const dataSet: DataSet = {
      id: `dataset_${Date.now()}`,
      name,
      parameters,
      combinations: [],
      format: options.format || 'json',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        source: 'extracted',
        tags: [],
        version: '1.0.0',
        ...options.metadata,
      },
    };

    if (options.generateCombinations) {
      dataSet.combinations = this.generateDataCombinations(
        parameters,
        options.maxCombinations || 10
      );
    }

    this.dataSets.set(dataSet.id, dataSet);
    return dataSet;
  }

  /**
   * Generate data combinations from parameters
   */
  generateDataCombinations(
    parameters: ExtractedParameter[],
    maxCombinations: number
  ): DataCombination[] {
    const combinations: DataCombination[] = [];
    
    // Generate all possible combinations (up to limit)
    const parameterValues = parameters.map(param => ({
      name: param.name,
      values: this.generateSampleValues(param),
    }));

    const totalCombinations = parameterValues.reduce(
      (total, param) => total * param.values.length,
      1
    );

    const _generateCombo = (index: number[], depth: number): Record<string, any> | null => {
      if (depth >= parameterValues.length) return null;
      
      const combo: Record<string, any> = {};
      parameterValues.forEach((param, i) => {
        combo[param.name] = param.values[index[i] % param.values.length];
      });
      return combo;
    };

    // Generate combinations using various strategies
    const strategies = [
      'sequential', // Use values in sequence
      'random',     // Random combinations
      'boundary',   // Edge cases
      'pairwise',   // Pairwise testing
    ];

    for (let i = 0; i < Math.min(maxCombinations, totalCombinations); i++) {
      const strategy = strategies[i % strategies.length];
      const values = this.generateCombinationByStrategy(parameterValues, strategy, i);
      
      combinations.push({
        id: `combo_${i}`,
        name: `Combination ${i + 1} (${strategy})`,
        values,
        weight: 1 / maxCombinations,
        valid: this.validateCombination(values, parameters),
        tags: [strategy],
      });
    }

    return combinations;
  }

  /**
   * Export data set to various formats
   */
  async exportDataSet(dataSetId: string, format?: 'csv' | 'json' | 'yaml' | 'excel'): Promise<string> {
    const dataSet = this.dataSets.get(dataSetId);
    if (!dataSet) {
      throw new Error(`Data set not found: ${dataSetId}`);
    }

    const exportFormat = format || dataSet.format;

    switch (exportFormat) {
      case 'json':
        return JSON.stringify(dataSet, null, 2);
        
      case 'csv':
        return this.exportToCSV(dataSet);
        
      case 'yaml':
        return this.exportToYAML(dataSet);
        
      case 'excel':
        return this.exportToExcel(dataSet);
        
      default:
        throw new Error(`Unsupported export format: ${exportFormat}`);
    }
  }

  /**
   * Import data set from file
   */
  async importDataSet(content: string, format: 'csv' | 'json' | 'yaml' | 'excel'): Promise<DataSet> {
    switch (format) {
      case 'json':
        return JSON.parse(content);
        
      case 'csv':
        return this.importFromCSV(content);
        
      case 'yaml':
        return this.importFromYAML(content);
        
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
  }

  /**
   * Initialize default extraction rules
   */
  private initializeDefaultRules(): void {
    this.extractionRules = [
      {
        id: 'email',
        name: 'Email Address',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        type: 'email',
        category: 'userInput',
        priority: 10,
        extractor: (value, context) => this.createParameter('email', value, 'email', 'userInput', context),
      },
      {
        id: 'phone',
        name: 'Phone Number',
        pattern: /^[+]?[1-9][\d]{0,15}$/,
        type: 'phone',
        category: 'userInput',
        priority: 9,
        extractor: (value, context) => this.createParameter('phone', value, 'phone', 'userInput', context),
      },
      {
        id: 'url',
        name: 'URL',
        pattern: /^https?:\/\/[^\s]+$/,
        type: 'url',
        category: 'navigation',
        priority: 8,
        extractor: (value, context) => this.createParameter('url', value, 'url', 'navigation', context),
      },
      {
        id: 'date',
        name: 'Date',
        pattern: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/,
        type: 'date',
        category: 'userInput',
        priority: 7,
        extractor: (value, context) => this.createParameter('date', value, 'date', 'userInput', context),
      },
      {
        id: 'number',
        name: 'Number',
        pattern: /^\d+(\.\d+)?$/,
        type: 'number',
        category: 'userInput',
        priority: 6,
        extractor: (value, context) => this.createParameter('number', value, 'number', 'userInput', context),
      },
      {
        id: 'creditCard',
        name: 'Credit Card',
        pattern: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
        type: 'creditCard',
        category: 'userInput',
        priority: 10,
        extractor: (value, context) => this.createParameter('creditCard', value, 'creditCard', 'userInput', context, true),
      },
    ];
  }

  /**
   * Extract parameters from a value using extraction rules
   */
  private extractFromValue(value: string, context: ExtractionContext): ExtractedParameter[] {
    const parameters: ExtractedParameter[] = [];

    // Apply extraction rules in priority order
    const sortedRules = [...this.extractionRules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (rule.pattern.test(value)) {
        const parameter = rule.extractor(value, context);
        if (parameter) {
          parameters.push(parameter);
          break; // Use first matching rule only
        }
      }
    }

    // If no rule matched, create a generic string parameter
    if (parameters.length === 0) {
      const paramName = this.inferParameterName(context);
      parameters.push(this.createParameter(paramName, value, 'string', 'userInput', context));
    }

    return parameters;
  }

  /**
   * Extract parameters from form data
   */
  private extractFromFormData(formData: Record<string, any>, context: ExtractionContext): ExtractedParameter[] {
    const parameters: ExtractedParameter[] = [];

    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const fieldContext = { ...context, name: key };
        parameters.push(...this.extractFromValue(value, fieldContext));
      }
    });

    return parameters;
  }

  /**
   * Extract parameters from selected options
   */
  private extractFromOptions(options: string[], context: ExtractionContext): ExtractedParameter[] {
    const parameters: ExtractedParameter[] = [];

    options.forEach(option => {
      parameters.push(...this.extractFromValue(option, context));
    });

    return parameters;
  }

  /**
   * Extract parameters from URL
   */
  private extractFromURL(url: string, context: ExtractionContext): ExtractedParameter[] {
    const parameters: ExtractedParameter[] = [];

    try {
      const urlObj = new URL(url);
      
      // Extract query parameters
      urlObj.searchParams.forEach((value, key) => {
        const paramContext = { ...context, name: key };
        parameters.push(...this.extractFromValue(value, paramContext));
      });

      // Extract path parameters (simple detection)
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      pathParts.forEach((part, index) => {
        if (/^\d+$/.test(part)) {
          // Looks like an ID
          parameters.push(this.createParameter(`pathId${index}`, part, 'number', 'navigation', context));
        } else if (part.length > 10 && !/^[a-z-]+$/.test(part)) {
          // Looks like a dynamic value
          parameters.push(this.createParameter(`pathParam${index}`, part, 'string', 'navigation', context));
        }
      });
    } catch {
      // Invalid URL, treat as string
      parameters.push(this.createParameter('url', url, 'string', 'navigation', context));
    }

    return parameters;
  }

  /**
   * Extract parameters from assertion data
   */
  private extractFromAssertion(expected: any, context: ExtractionContext): ExtractedParameter[] {
    const parameters: ExtractedParameter[] = [];

    if (typeof expected === 'string') {
      parameters.push(...this.extractFromValue(expected, { ...context, category: 'assertion' }));
    } else if (typeof expected === 'number') {
      parameters.push(this.createParameter('expectedValue', expected, 'number', 'assertion', context));
    }

    return parameters;
  }

  /**
   * Create parameter object
   */
  private createParameter(
    name: string,
    value: any,
    type: ParameterType,
    category: ParameterCategory,
    context: ExtractionContext,
    sensitive = false
  ): ExtractedParameter {
    return {
      id: `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.sanitizeParameterName(name),
      type,
      category,
      value,
      source: {
        eventId: context.event.id,
        eventType: context.event.type,
        field: context.name || 'value',
        selector: context.event.target.selector,
      },
      pattern: this.generatePattern(value, type),
      constraints: {
        required: true,
        minLength: typeof value === 'string' ? Math.max(1, value.length - 10) : undefined,
        maxLength: typeof value === 'string' ? value.length + 10 : undefined,
      },
      metadata: {
        examples: [value],
        frequency: 1,
        variance: 0,
        dataType: this.inferDataType(value, type),
        sensitive,
        faker: this.getFakerMethod(type),
        tags: [category],
        lastSeen: Date.now(),
      },
    };
  }

  /**
   * Merge two parameters with the same name
   */
  private mergeParameters(existing: ExtractedParameter, newParam: ExtractedParameter): void {
    // Update frequency
    existing.metadata.frequency += 1;

    // Add new example if different
    if (!existing.metadata.examples.includes(newParam.value)) {
      existing.metadata.examples.push(newParam.value);
      
      // Update variance
      existing.metadata.variance = this.calculateVariance(existing.metadata.examples);
    }

    // Update constraints based on new values
    if (existing.type === 'string' && typeof newParam.value === 'string') {
      if (existing.constraints?.minLength) {
        existing.constraints.minLength = Math.min(
          existing.constraints.minLength,
          newParam.value.length
        );
      }
      if (existing.constraints?.maxLength) {
        existing.constraints.maxLength = Math.max(
          existing.constraints.maxLength,
          newParam.value.length
        );
      }
    }

    existing.metadata.lastSeen = Date.now();
  }

  /**
   * Generate sample values for a parameter
   */
  private generateSampleValues(param: ExtractedParameter): any[] {
    const sampleCount = Math.min(5, param.metadata.examples.length + 2);
    const samples = [...param.metadata.examples];

    // Generate additional samples using Faker if available
    if (param.metadata.faker && samples.length < sampleCount) {
      for (let i = samples.length; i < sampleCount; i++) {
        samples.push(this.generateFakeValue(param.metadata.faker, param.type));
      }
    }

    // Generate boundary values for numbers
    if (param.type === 'number' && param.constraints) {
      if (param.constraints.minValue !== undefined) {
        samples.push(param.constraints.minValue);
      }
      if (param.constraints.maxValue !== undefined) {
        samples.push(param.constraints.maxValue);
      }
    }

    return samples.slice(0, sampleCount);
  }

  /**
   * Generate combination by strategy
   */
  private generateCombinationByStrategy(
    parameterValues: Array<{ name: string; values: any[] }>,
    strategy: string,
    index: number
  ): Record<string, any> {
    const combo: Record<string, any> = {};

    switch (strategy) {
      case 'sequential':
        parameterValues.forEach((param, _i) => {
          combo[param.name] = param.values[index % param.values.length];
        });
        break;

      case 'random':
        parameterValues.forEach(param => {
          combo[param.name] = param.values[Math.floor(Math.random() * param.values.length)];
        });
        break;

      case 'boundary':
        parameterValues.forEach(param => {
          // Use first or last value for boundary testing
          combo[param.name] = index % 2 === 0 ? param.values[0] : param.values[param.values.length - 1];
        });
        break;

      case 'pairwise':
        // Simple pairwise implementation
        parameterValues.forEach((param, i) => {
          const valueIndex = (index + i) % param.values.length;
          combo[param.name] = param.values[valueIndex];
        });
        break;
    }

    return combo;
  }

  /**
   * Validate combination against parameter constraints
   */
  private validateCombination(values: Record<string, any>, parameters: ExtractedParameter[]): boolean {
    for (const param of parameters) {
      const value = values[param.name];
      
      if (param.constraints?.required && (value === undefined || value === null || value === '')) {
        return false;
      }

      if (param.constraints?.minLength && typeof value === 'string' && value.length < param.constraints.minLength) {
        return false;
      }

      if (param.constraints?.maxLength && typeof value === 'string' && value.length > param.constraints.maxLength) {
        return false;
      }

      if (param.constraints?.minValue && typeof value === 'number' && value < param.constraints.minValue) {
        return false;
      }

      if (param.constraints?.maxValue && typeof value === 'number' && value > param.constraints.maxValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Utility methods
   */
  private findLabel(_event: RecordedEvent): string | undefined {
    // This would search for associated label elements
    return undefined;
  }

  private inferParameterName(context: ExtractionContext): string {
    if (context.name) return context.name;
    if (context.id) return context.id;
    if (context.label) return context.label;
    if (context.placeholder) return context.placeholder;
    return `param_${context.elementType}_${Date.now()}`;
  }

  private sanitizeParameterName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').toLowerCase();
  }

  private generatePattern(value: any, type: ParameterType): string | undefined {
    switch (type) {
      case 'email':
        return '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
      case 'phone':
        return '^[\\+]?[1-9][\\d]{0,15}$';
      case 'url':
        return '^https?://[^\\s]+$';
      case 'number':
        return '^\\d+(\\.\\d+)?$';
      case 'date':
        return '^\\d{4}-\\d{2}-\\d{2}$';
      default:
        return undefined;
    }
  }

  private inferDataType(value: any, type: ParameterType): 'static' | 'dynamic' | 'generated' {
    if (type === 'email' || type === 'phone' || type === 'creditCard') {
      return 'dynamic';
    }
    return 'static';
  }

  private getFakerMethod(type: ParameterType): string | undefined {
    const fakerMethods: Record<ParameterType, string> = {
      string: 'lorem.word',
      number: 'datatype.number',
      boolean: 'datatype.boolean',
      date: 'date.recent',
      email: 'internet.email',
      url: 'internet.url',
      phone: 'phone.number',
      creditCard: 'finance.creditCardNumber',
      ssn: 'datatype.uuid', // Placeholder
      json: 'datatype.json',
      array: 'datatype.array',
      file: 'system.fileName',
    };

    return fakerMethods[type];
  }

  private generateFakeValue(fakerMethod: string, type: ParameterType): any {
    // This would integrate with Faker.js
    // For now, return simple mock values
    switch (type) {
      case 'email':
        return `user${Math.floor(Math.random() * 1000)}@example.com`;
      case 'phone':
        return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      case 'url':
        return `https://example${Math.floor(Math.random() * 100)}.com`;
      case 'number':
        return Math.floor(Math.random() * 1000);
      case 'date':
        return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      default:
        return `generated_${Math.random().toString(36).substr(2, 8)}`;
    }
  }

  private calculateVariance(examples: any[]): number {
    if (examples.length < 2) return 0;

    // Simple variance calculation based on uniqueness
    const unique = new Set(examples);
    return unique.size / examples.length;
  }

  private exportToCSV(dataSet: DataSet): string {
    if (dataSet.combinations.length === 0) return '';

    const paramNames = dataSet.parameters.map(p => p.name);
    const header = paramNames.join(',');
    
    const rows = dataSet.combinations.map(combo => 
      paramNames.map(name => {
        const value = combo.values[name];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : String(value);
      }).join(',')
    );

    return [header, ...rows].join('\n');
  }

  private exportToYAML(dataSet: DataSet): string {
    // Simple YAML export - would use proper YAML library in production
    return `# Data Set: ${dataSet.name}\nname: ${dataSet.name}\nparameters:\n${dataSet.parameters.map(p => `  - name: ${p.name}\n    type: ${p.type}\n    value: ${p.value}`).join('\n')}\ncombinations:\n${dataSet.combinations.map(c => `  - ${JSON.stringify(c.values)}`).join('\n')}`;
  }

  private exportToExcel(_dataSet: DataSet): string {
    // Would integrate with Excel export library
    throw new Error('Excel export not implemented');
  }

  private importFromCSV(content: string): DataSet {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('Invalid CSV format');

    const headers = lines[0].split(',').map(h => h.trim());
    const parameters: ExtractedParameter[] = headers.map(name => ({
      id: `imported_${name}`,
      name,
      type: 'string',
      category: 'userInput',
      value: '',
      source: { eventId: 'imported', eventType: 'import', field: name },
      constraints: { required: false },
      metadata: {
        examples: [],
        frequency: 1,
        variance: 0,
        dataType: 'static',
        sensitive: false,
        tags: ['imported'],
        lastSeen: Date.now(),
      },
    }));

    const combinations: DataCombination[] = lines.slice(1).map((line, index) => {
      const values: Record<string, any> = {};
      const cells = line.split(',');
      
      headers.forEach((header, i) => {
        values[header] = cells[i]?.trim() || '';
      });

      return {
        id: `imported_combo_${index}`,
        values,
        weight: 1,
        valid: true,
        tags: ['imported'],
      };
    });

    return {
      id: `imported_${Date.now()}`,
      name: 'Imported Data Set',
      parameters,
      combinations,
      format: 'csv',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        source: 'imported',
        tags: ['imported'],
        version: '1.0.0',
      },
    };
  }

  private importFromYAML(_content: string): DataSet {
    // Would implement YAML parsing
    throw new Error('YAML import not implemented');
  }
}