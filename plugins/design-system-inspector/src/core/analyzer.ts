import type {
  AnalysisOptions,
  AnalysisResult,
  DesignToken,
  ComponentUsage,
  ConsistencyIssue,
  ColorPalette,
  ColorUsageStats,
  TypographyScale,
  SpacingAnalysis,
  DesignSystemStats,
  ColorToken,
  TypographyToken,
  SpacingToken,
  ReactComponentInfo,
} from '../types';
import { 
  extractDesignTokens,
  analyzeColorUsage,
  analyzeTypographyScale,
  analyzeSpacingConsistency,
  detectConsistencyIssues,
  getComponentInfo,
  calculateConsistencyScore,
  generateId,
  getTimestamp,
} from '../utils';

/**
 * Main design system analyzer that orchestrates all analysis types
 */
class DesignSystemAnalyzer {
  private analysisCache = new Map<string, any>();
  private componentRegistry = new Map<string, ComponentUsage>();

  /**
   * Perform comprehensive design system analysis
   */
  async analyze(options: AnalysisOptions): Promise<AnalysisResult> {
    const startTime = performance.now();

    // Run all analysis types in parallel for performance
    const [
      tokens,
      componentUsage,
      colorPalette,
      colorUsage,
      typographyScale,
      spacingAnalysis,
    ] = await Promise.all([
      this.analyzeTokens(options),
      this.analyzeComponents(options),
      this.analyzeColorPalette(options),
      this.analyzeColorUsage(options),
      this.analyzeTypography(options),
      this.analyzeSpacing(options),
    ]);

    // Detect consistency issues based on all analyses
    const consistencyIssues = await this.detectConsistencyIssues(options, {
      tokens,
      componentUsage,
      colorPalette,
      typographyScale,
      spacingAnalysis,
    });

    // Calculate overall statistics
    const stats = this.calculateStats({
      tokens,
      componentUsage,
      consistencyIssues,
      colorUsage,
      typographyScale,
      spacingAnalysis,
    });

    const analysisTime = performance.now() - startTime;

    return {
      tokens,
      componentUsage,
      consistencyIssues,
      colorPalette,
      colorUsage,
      typographyScale,
      spacingAnalysis,
      stats,
      analysisTime,
    };
  }

  /**
   * Analyze a single element (for real-time analysis)
   */
  async analyzeElement(element: Element): Promise<void> {
    // Quick analysis for real-time updates
    const computedStyle = window.getComputedStyle(element);
    
    // Check for design tokens
    const tokens = extractDesignTokens(element, computedStyle);
    tokens.forEach(token => {
      this.cacheToken(token);
    });

    // Check for React components
    const componentInfo = getComponentInfo(element);
    if (componentInfo) {
      this.updateComponentUsage(componentInfo, element);
    }

    // Quick consistency check
    const issues = detectConsistencyIssues(element, computedStyle, {
      shallow: true,
      tokens: Array.from(this.getTokenCache().values()),
    });
    
    issues.forEach(issue => {
      this.reportIssue(issue);
    });
  }

  /**
   * Analyze design tokens
   */
  private async analyzeTokens(options: AnalysisOptions): Promise<DesignToken[]> {
    const tokens: DesignToken[] = [];
    const elements = this.getAnalysisElements(options);

    for (const element of elements) {
      const computedStyle = window.getComputedStyle(element);
      const elementTokens = extractDesignTokens(element, computedStyle);
      
      elementTokens.forEach(token => {
        const existingToken = tokens.find(t => t.name === token.name && t.type === token.type);
        if (existingToken) {
          existingToken.usageCount++;
        } else {
          tokens.push(token);
        }
      });
    }

    return tokens;
  }

  /**
   * Analyze React component usage
   */
  private async analyzeComponents(options: AnalysisOptions): Promise<ComponentUsage[]> {
    const components: ComponentUsage[] = [];
    const elements = this.getAnalysisElements(options);

    for (const element of elements) {
      const componentInfo = getComponentInfo(element);
      if (componentInfo) {
        const usage = this.createComponentUsage(componentInfo, element);
        const existingComponent = components.find(c => c.name === usage.name);
        
        if (existingComponent) {
          existingComponent.usageCount++;
          existingComponent.lastSeen = getTimestamp();
          this.mergeProps(existingComponent, usage);
        } else {
          components.push(usage);
        }
      }
    }

    return components;
  }

  /**
   * Analyze color palette
   */
  private async analyzeColorPalette(options: AnalysisOptions): Promise<ColorPalette> {
    const elements = this.getAnalysisElements(options);
    const colorTokens: ColorToken[] = [];

    for (const element of elements) {
      const computedStyle = window.getComputedStyle(element);
      const colors = analyzeColorUsage(element, computedStyle);
      colorTokens.push(...colors);
    }

    // Categorize colors
    return {
      primary: colorTokens.filter(c => c.category === 'primary'),
      secondary: colorTokens.filter(c => c.category === 'secondary'),
      neutral: colorTokens.filter(c => c.category === 'neutral'),
      semantic: colorTokens.filter(c => c.category === 'semantic'),
      custom: colorTokens.filter(c => c.category === 'custom'),
    };
  }

  /**
   * Analyze color usage statistics
   */
  private async analyzeColorUsage(options: AnalysisOptions): Promise<ColorUsageStats> {
    const elements = this.getAnalysisElements(options);
    const colorMap = new Map<string, { count: number; elements: HTMLElement[]; isToken: boolean; tokenName?: string }>();

    for (const element of elements) {
      const htmlElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      
      // Check color properties
      const colorProperties = ['color', 'background-color', 'border-color', 'fill', 'stroke'];
      
      for (const property of colorProperties) {
        const color = computedStyle.getPropertyValue(property);
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          const normalizedColor = this.normalizeColor(color);
          const existing = colorMap.get(normalizedColor) || { count: 0, elements: [], isToken: false };
          
          existing.count++;
          existing.elements.push(htmlElement);
          
          // Check if it's a design token
          const customProp = computedStyle.getPropertyValue(`--${property}`);
          if (customProp) {
            existing.isToken = true;
            existing.tokenName = `--${property}`;
          }
          
          colorMap.set(normalizedColor, existing);
        }
      }
    }

    const colorUsages = Array.from(colorMap.entries()).map(([color, data]) => ({
      color,
      ...data,
    }));

    const totalColors = colorUsages.length;
    const tokenizedColors = colorUsages.filter(c => c.isToken).length;
    const customColors = totalColors - tokenizedColors;
    
    // Calculate accessibility issues (simplified)
    const accessibilityIssues = colorUsages.filter(c => {
      // Check contrast ratios, etc. (simplified for demo)
      return c.color.includes('rgb(255, 255, 255)') || c.color.includes('rgb(0, 0, 0)');
    }).length;

    return {
      totalColors,
      tokenizedColors,
      customColors,
      accessibilityIssues,
      mostUsedColors: colorUsages
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }

  /**
   * Analyze typography scale
   */
  private async analyzeTypography(options: AnalysisOptions): Promise<TypographyScale> {
    const elements = this.getAnalysisElements(options);
    const typographyTokens: TypographyToken[] = [];

    for (const element of elements) {
      const computedStyle = window.getComputedStyle(element);
      const typography = analyzeTypographyScale(element, computedStyle);
      typographyTokens.push(...typography);
    }

    const violations = detectConsistencyIssues(null, null, {
      type: 'typography',
      tokens: typographyTokens,
      elements,
    });

    return {
      scales: typographyTokens,
      violations: violations.filter(v => v.type === 'typography-violation') as any[],
      coverage: this.calculateTypographyCoverage(typographyTokens, elements),
    };
  }

  /**
   * Analyze spacing consistency
   */
  private async analyzeSpacing(options: AnalysisOptions): Promise<SpacingAnalysis> {
    const elements = this.getAnalysisElements(options);
    const spacingTokens: SpacingToken[] = [];

    for (const element of elements) {
      const computedStyle = window.getComputedStyle(element);
      const spacing = analyzeSpacingConsistency(element, computedStyle);
      spacingTokens.push(...spacing);
    }

    const violations = detectConsistencyIssues(null, null, {
      type: 'spacing',
      tokens: spacingTokens,
      elements,
    });

    return {
      scale: spacingTokens,
      violations: violations.filter(v => v.type === 'spacing-violation') as any[],
      consistency: this.calculateSpacingConsistency(spacingTokens, elements),
    };
  }

  /**
   * Detect consistency issues across all analyses
   */
  private async detectConsistencyIssues(
    options: AnalysisOptions,
    analysisData: {
      tokens: DesignToken[];
      componentUsage: ComponentUsage[];
      colorPalette: ColorPalette;
      typographyScale: TypographyScale;
      spacingAnalysis: SpacingAnalysis;
    }
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    const elements = this.getAnalysisElements(options);

    for (const element of elements) {
      const computedStyle = window.getComputedStyle(element);
      const elementIssues = detectConsistencyIssues(element, computedStyle, {
        tokens: analysisData.tokens,
        colorPalette: analysisData.colorPalette,
        typographyScale: analysisData.typographyScale,
        spacingAnalysis: analysisData.spacingAnalysis,
      });
      
      issues.push(...elementIssues);
    }

    return issues;
  }

  /**
   * Calculate overall design system statistics
   */
  private calculateStats(data: {
    tokens: DesignToken[];
    componentUsage: ComponentUsage[];
    consistencyIssues: ConsistencyIssue[];
    colorUsage: ColorUsageStats;
    typographyScale: TypographyScale;
    spacingAnalysis: SpacingAnalysis;
  }): DesignSystemStats {
    const totalTokens = data.tokens.length;
    const usedTokens = data.tokens.filter(t => t.usageCount > 0).length;
    const tokensUtilization = totalTokens > 0 ? (usedTokens / totalTokens) * 100 : 0;

    const consistencyScore = calculateConsistencyScore({
      issues: data.consistencyIssues,
      totalElements: document.querySelectorAll('*').length,
      colorUsage: data.colorUsage,
      typographyScale: data.typographyScale,
      spacingAnalysis: data.spacingAnalysis,
    });

    // Simplified accessibility score calculation
    const accessibilityScore = Math.max(0, 100 - (data.colorUsage.accessibilityIssues * 5));

    return {
      totalComponents: data.componentUsage.length,
      totalTokens,
      totalIssues: data.consistencyIssues.length,
      tokensUtilization,
      consistencyScore,
      accessibilityScore,
      lastAnalysis: getTimestamp(),
      analysisTime: 0, // Will be set by the caller
    };
  }

  /**
   * Get elements to analyze based on options
   */
  private getAnalysisElements(options: AnalysisOptions): Element[] {
    const selector = options.includeThirdParty ? '*' : '[data-component], [class*="component"], [class*="Component"]';
    let elements = Array.from(document.querySelectorAll(selector));

    if (options.customSelectors?.length) {
      const customElements = options.customSelectors.flatMap(sel => 
        Array.from(document.querySelectorAll(sel))
      );
      elements = [...new Set([...elements, ...customElements])];
    }

    // Filter based on depth
    switch (options.depth) {
      case 'shallow':
        elements = elements.slice(0, 50);
        break;
      case 'deep':
        // Include all elements
        break;
      case 'medium':
      default:
        elements = elements.slice(0, 200);
        break;
    }

    return elements;
  }

  /**
   * Create component usage data from React component info
   */
  private createComponentUsage(info: ReactComponentInfo, _element: Element): ComponentUsage {
    return {
      id: generateId(),
      name: info.name,
      displayName: info.displayName,
      filePath: info.source?.fileName || 'unknown',
      usageCount: 1,
      props: Object.entries(info.props).map(([name, value]) => ({
        name,
        type: typeof value,
        usageCount: 1,
        values: [{
          value: String(value),
          count: 1,
          percentage: 100,
        }],
        isRequired: false, // Would need prop-types analysis
      })),
      variants: [{
        props: info.props,
        count: 1,
        percentage: 100,
      }],
      firstSeen: getTimestamp(),
      lastSeen: getTimestamp(),
    };
  }

  /**
   * Merge component props usage data
   */
  private mergeProps(_existing: ComponentUsage, _usage: ComponentUsage): void {
    // Implementation for merging prop usage data
    // This would merge the prop usage statistics
  }

  /**
   * Normalize color for comparison
   */
  private normalizeColor(color: string): string {
    // Convert rgb, rgba, hsl, etc. to consistent format
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Fallback to the original color if canvas context is not available
      return color;
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const imageData = ctx.getImageData(0, 0, 1, 1);
    const [r, g, b, a] = imageData.data;
    return a < 255 ? `rgba(${r}, ${g}, ${b}, ${a/255})` : `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Calculate typography coverage
   */
  private calculateTypographyCoverage(tokens: TypographyToken[], elements: Element[]): number {
    if (tokens.length === 0 || elements.length === 0) return 0;
    
    const elementsWithTypography = elements.filter(el => {
      const computedStyle = window.getComputedStyle(el);
      const fontSize = computedStyle.fontSize;
      return tokens.some(token => token.fontSize === fontSize);
    });

    return (elementsWithTypography.length / elements.length) * 100;
  }

  /**
   * Calculate spacing consistency
   */
  private calculateSpacingConsistency(tokens: SpacingToken[], elements: Element[]): number {
    if (tokens.length === 0 || elements.length === 0) return 0;
    
    const elementsWithConsistentSpacing = elements.filter(el => {
      const computedStyle = window.getComputedStyle(el);
      const margin = computedStyle.margin;
      const padding = computedStyle.padding;
      
      return tokens.some(token => 
        margin.includes(token.value) || padding.includes(token.value)
      );
    });

    return (elementsWithConsistentSpacing.length / elements.length) * 100;
  }

  /**
   * Cache management
   */
  private getTokenCache(): Map<string, DesignToken> {
    if (!this.analysisCache.has('tokens')) {
      this.analysisCache.set('tokens', new Map());
    }
    return this.analysisCache.get('tokens');
  }

  private cacheToken(token: DesignToken): void {
    const cache = this.getTokenCache();
    cache.set(token.id, token);
  }

  private updateComponentUsage(info: ReactComponentInfo, element: Element): void {
    const key = info.name;
    const existing = this.componentRegistry.get(key);
    
    if (existing) {
      existing.usageCount++;
      existing.lastSeen = getTimestamp();
    } else {
      this.componentRegistry.set(key, this.createComponentUsage(info, element));
    }
  }

  private reportIssue(issue: ConsistencyIssue): void {
    // This would integrate with the store to report issues
    console.warn('Design System Issue:', issue);
  }
}

// Singleton instance
let analyzerInstance: DesignSystemAnalyzer | null = null;

export function getDesignSystemAnalyzer(): DesignSystemAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new DesignSystemAnalyzer();
  }
  return analyzerInstance;
}

export { DesignSystemAnalyzer };