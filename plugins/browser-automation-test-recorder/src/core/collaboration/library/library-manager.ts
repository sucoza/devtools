/**
 * Team Test Library Manager
 * Manages centralized team test repository with categorization, search, and governance
 */

import type {
  TestLibrary,
  LibraryTest,
  TestCategory,
  TestTemplate,
  LibraryTestStatus,
  CollaborationUser,
  CollaborationTeam as _CollaborationTeam,
  SharedTestRecording,
  TestUsageStats,
  TestQualityMetrics,
  LibrarySettings,
  LibraryStats,
  RecordedEvent
} from '../../../types';

/**
 * Search and filter options for library
 */
export interface LibrarySearchOptions {
  query?: string;
  categories?: string[];
  tags?: string[];
  authors?: string[];
  status?: LibraryTestStatus[];
  complexity?: ('simple' | 'medium' | 'complex')[];
  frameworks?: string[];
  dateRange?: [number, number];
  sortBy?: 'name' | 'created' | 'updated' | 'popularity' | 'quality' | 'usage';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Library search result
 */
export interface LibrarySearchResult {
  tests: LibraryTest[];
  total: number;
  facets: {
    categories: Array<{ id: string; name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    authors: Array<{ id: string; name: string; count: number }>;
    frameworks: Array<{ name: string; count: number }>;
  };
}

/**
 * Test publication options
 */
export interface PublicationOptions {
  status: LibraryTestStatus;
  category: string;
  tags: string[];
  description?: string;
  visibility: 'public' | 'team' | 'private';
  requireApproval?: boolean;
  maintainers?: string[]; // User IDs
}

/**
 * Quality assessment result
 */
export interface QualityAssessment {
  metrics: TestQualityMetrics;
  recommendations: QualityRecommendation[];
  passed: boolean;
  score: number;
}

/**
 * Quality recommendation
 */
export interface QualityRecommendation {
  type: 'error' | 'warning' | 'suggestion';
  category: 'reliability' | 'maintainability' | 'performance' | 'documentation';
  message: string;
  fix?: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Team Test Library Manager
 */
export class LibraryManager {
  private readonly storage: LibraryStorage;
  private readonly qualityAnalyzer: QualityAnalyzer;
  private readonly searchEngine: LibrarySearchEngine;

  constructor(config: LibraryConfig) {
    this.storage = new LibraryStorage(config.storage);
    this.qualityAnalyzer = new QualityAnalyzer(config.quality);
    this.searchEngine = new LibrarySearchEngine(config.search);
  }

  /**
   * Get or create team library
   */
  async getLibrary(teamId: string): Promise<TestLibrary> {
    let library = await this.storage.getLibrary(teamId);
    
    if (!library) {
      library = await this.createLibrary(teamId);
    }
    
    return library;
  }

  /**
   * Create new team library
   */
  async createLibrary(teamId: string, settings?: Partial<LibrarySettings>): Promise<TestLibrary> {
    const now = Date.now();
    
    const defaultCategories: TestCategory[] = [
      {
        id: 'authentication',
        name: 'Authentication',
        description: 'Login, logout, and authentication flows',
        color: '#3B82F6',
        icon: 'lock',
        testCount: 0
      },
      {
        id: 'navigation',
        name: 'Navigation',
        description: 'Page navigation and routing tests',
        color: '#10B981',
        icon: 'navigation',
        testCount: 0
      },
      {
        id: 'forms',
        name: 'Forms',
        description: 'Form filling and submission tests',
        color: '#F59E0B',
        icon: 'edit',
        testCount: 0
      },
      {
        id: 'e2e',
        name: 'End-to-End',
        description: 'Complete user journey tests',
        color: '#8B5CF6',
        icon: 'workflow',
        testCount: 0
      },
      {
        id: 'regression',
        name: 'Regression',
        description: 'Bug prevention and regression tests',
        color: '#EF4444',
        icon: 'bug',
        testCount: 0
      }
    ];

    const defaultSettings: LibrarySettings = {
      approvalRequired: false,
      allowPublicContribution: true,
      autoQualityCheck: true,
      retentionPolicy: {
        enabled: false,
        archiveAfterDays: 365,
        deleteAfterDays: 730,
        preservePopular: true,
        popularityThreshold: 10
      },
      categories: defaultCategories,
      integrations: {
        ci: [],
        testRunners: [],
        repositories: []
      },
      ...settings
    };

    const library: TestLibrary = {
      id: `library_${teamId}_${Date.now()}`,
      teamId,
      name: `Team ${teamId} Test Library`,
      description: 'Centralized repository for team test recordings',
      categories: defaultCategories,
      tests: [],
      templates: [],
      settings: defaultSettings,
      stats: {
        totalTests: 0,
        activeTests: 0,
        draftTests: 0,
        reviewTests: 0,
        archivedTests: 0,
        totalCategories: defaultCategories.length,
        totalTemplates: 0,
        totalDownloads: 0,
        averageRating: 0,
        topContributors: [],
        popularTags: [],
        monthlyGrowth: 0
      },
      createdAt: now,
      updatedAt: now
    };

    await this.storage.saveLibrary(library);
    return library;
  }

  /**
   * Publish test to library
   */
  async publishTest(
    libraryId: string,
    sharedTest: SharedTestRecording,
    options: PublicationOptions,
    author: CollaborationUser
  ): Promise<LibraryTest> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library) {
      throw new Error(`Library not found: ${libraryId}`);
    }

    // Check if approval is required
    if (library.settings.approvalRequired && options.status === 'published') {
      options.status = 'review';
    }

    // Assess quality if enabled
    let qualityMetrics: TestQualityMetrics;
    if (library.settings.autoQualityCheck) {
      const assessment = await this.qualityAnalyzer.assess(sharedTest);
      qualityMetrics = assessment.metrics;
      
      if (!assessment.passed && options.status === 'published') {
        throw new Error(`Test does not meet quality standards: ${assessment.recommendations.map(r => r.message).join(', ')}`);
      }
    } else {
      qualityMetrics = this.generateDefaultMetrics();
    }

    // Create library test entry
    const libraryTest: LibraryTest = {
      id: `lib_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: sharedTest.name,
      description: options.description || sharedTest.description,
      recording: sharedTest,
      category: options.category,
      tags: options.tags,
      author,
      maintainers: options.maintainers?.map(id => ({ id } as CollaborationUser)) || [author],
      usage: {
        views: 0,
        downloads: 0,
        forks: 0,
        stars: 0,
        runs: 0,
        successRate: 100,
        lastUsed: Date.now(),
        popularityScore: 0
      },
      quality: qualityMetrics,
      status: options.status,
      visibility: options.visibility,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Add to library
    library.tests.push(libraryTest);
    
    // Update category count
    const category = library.categories.find(c => c.id === options.category);
    if (category) {
      category.testCount++;
    }

    // Update stats
    await this.updateLibraryStats(library);
    
    // Save library
    await this.storage.saveLibrary(library);

    return libraryTest;
  }

  /**
   * Update test in library
   */
  async updateTest(
    libraryId: string,
    testId: string,
    updates: Partial<LibraryTest>,
    user: CollaborationUser
  ): Promise<LibraryTest> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library) {
      throw new Error(`Library not found: ${libraryId}`);
    }

    const testIndex = library.tests.findIndex(t => t.id === testId);
    if (testIndex === -1) {
      throw new Error(`Test not found: ${testId}`);
    }

    const test = library.tests[testIndex];
    
    // Check permissions
    if (!this.canEditTest(test, user)) {
      throw new Error('Insufficient permissions to edit test');
    }

    // Apply updates
    const updatedTest: LibraryTest = {
      ...test,
      ...updates,
      updatedAt: Date.now()
    };

    // Re-assess quality if recording changed
    if (updates.recording && library.settings.autoQualityCheck) {
      const assessment = await this.qualityAnalyzer.assess(updates.recording);
      updatedTest.quality = assessment.metrics;
    }

    library.tests[testIndex] = updatedTest;
    await this.storage.saveLibrary(library);

    return updatedTest;
  }

  /**
   * Search and filter tests in library
   */
  async searchTests(
    libraryId: string,
    options: LibrarySearchOptions = {}
  ): Promise<LibrarySearchResult> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library) {
      throw new Error(`Library not found: ${libraryId}`);
    }

    return this.searchEngine.search(library.tests, options);
  }

  /**
   * Get test by ID
   */
  async getTest(libraryId: string, testId: string): Promise<LibraryTest | null> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library) {
      return null;
    }

    return library.tests.find(t => t.id === testId) || null;
  }

  /**
   * Delete test from library
   */
  async deleteTest(
    libraryId: string,
    testId: string,
    user: CollaborationUser
  ): Promise<void> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library) {
      throw new Error(`Library not found: ${libraryId}`);
    }

    const testIndex = library.tests.findIndex(t => t.id === testId);
    if (testIndex === -1) {
      throw new Error(`Test not found: ${testId}`);
    }

    const test = library.tests[testIndex];
    
    // Check permissions
    if (!this.canDeleteTest(test, user)) {
      throw new Error('Insufficient permissions to delete test');
    }

    // Update category count
    const category = library.categories.find(c => c.id === test.category);
    if (category) {
      category.testCount = Math.max(0, category.testCount - 1);
    }

    // Remove test
    library.tests.splice(testIndex, 1);
    
    // Update stats
    await this.updateLibraryStats(library);
    
    await this.storage.saveLibrary(library);
  }

  /**
   * Record test usage
   */
  async recordUsage(
    libraryId: string,
    testId: string,
    action: 'view' | 'download' | 'fork' | 'star' | 'run',
    _user?: CollaborationUser
  ): Promise<void> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library) {
      return;
    }

    const test = library.tests.find(t => t.id === testId);
    if (!test) {
      return;
    }

    // Update usage stats
    switch (action) {
      case 'view':
        test.usage.views++;
        break;
      case 'download':
        test.usage.downloads++;
        break;
      case 'fork':
        test.usage.forks++;
        break;
      case 'star':
        test.usage.stars++;
        break;
      case 'run':
        test.usage.runs++;
        break;
    }

    test.usage.lastUsed = Date.now();
    test.usage.popularityScore = this.calculatePopularityScore(test.usage);

    await this.storage.saveLibrary(library);
  }

  /**
   * Get library statistics
   */
  async getStats(libraryId: string): Promise<LibraryStats> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library) {
      throw new Error(`Library not found: ${libraryId}`);
    }

    return library.stats;
  }

  /**
   * Create test category
   */
  async createCategory(
    libraryId: string,
    category: Omit<TestCategory, 'id' | 'testCount'>,
    _user: CollaborationUser
  ): Promise<TestCategory> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library) {
      throw new Error(`Library not found: ${libraryId}`);
    }

    const newCategory: TestCategory = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      testCount: 0
    };

    library.categories.push(newCategory);
    library.stats.totalCategories++;
    
    await this.storage.saveLibrary(library);
    return newCategory;
  }

  /**
   * Create test template from recording
   */
  async createTemplate(
    libraryId: string,
    recording: SharedTestRecording,
    templateData: {
      name: string;
      description?: string;
      parameters: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'selector';
        description: string;
        required: boolean;
        defaultValue?: any;
      }>;
    },
    author: CollaborationUser
  ): Promise<TestTemplate> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library) {
      throw new Error(`Library not found: ${libraryId}`);
    }

    // Extract patterns from recording
    const patterns = this.extractEventPatterns(recording.events);

    const template: TestTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: templateData.name,
      description: templateData.description,
      pattern: patterns,
      parameters: templateData.parameters,
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

    library.templates.push(template);
    library.stats.totalTemplates++;
    
    await this.storage.saveLibrary(library);
    return template;
  }

  /**
   * Apply retention policies
   */
  async applyRetentionPolicies(libraryId: string): Promise<{
    archived: number;
    deleted: number;
    preserved: number;
  }> {
    const library = await this.storage.getLibrary(libraryId);
    if (!library || !library.settings.retentionPolicy.enabled) {
      return { archived: 0, deleted: 0, preserved: 0 };
    }

    const policy = library.settings.retentionPolicy;
    const now = Date.now();
    const archiveThreshold = now - (policy.archiveAfterDays * 24 * 60 * 60 * 1000);
    const deleteThreshold = now - (policy.deleteAfterDays * 24 * 60 * 60 * 1000);

    let archived = 0;
    let deleted = 0;
    let preserved = 0;

    for (let i = library.tests.length - 1; i >= 0; i--) {
      const test = library.tests[i];
      const isPopular = test.usage.popularityScore >= policy.popularityThreshold;

      if (test.updatedAt < deleteThreshold) {
        if (policy.preservePopular && isPopular) {
          preserved++;
        } else {
          library.tests.splice(i, 1);
          deleted++;
        }
      } else if (test.updatedAt < archiveThreshold && test.status !== 'archived') {
        if (policy.preservePopular && isPopular) {
          preserved++;
        } else {
          test.status = 'archived';
          archived++;
        }
      }
    }

    if (archived > 0 || deleted > 0) {
      await this.updateLibraryStats(library);
      await this.storage.saveLibrary(library);
    }

    return { archived, deleted, preserved };
  }

  /**
   * Helper methods
   */
  private canEditTest(test: LibraryTest, user: CollaborationUser): boolean {
    return test.author.id === user.id ||
           test.maintainers.some(m => m.id === user.id) ||
           user.permissions.canEdit;
  }

  private canDeleteTest(test: LibraryTest, user: CollaborationUser): boolean {
    return test.author.id === user.id ||
           user.permissions.canDelete;
  }

  private calculatePopularityScore(usage: TestUsageStats): number {
    const weights = {
      views: 1,
      downloads: 5,
      forks: 10,
      stars: 15,
      runs: 3
    };

    return (
      usage.views * weights.views +
      usage.downloads * weights.downloads +
      usage.forks * weights.forks +
      usage.stars * weights.stars +
      usage.runs * weights.runs
    );
  }

  private async updateLibraryStats(library: TestLibrary): Promise<void> {
    const stats: LibraryStats = {
      totalTests: library.tests.length,
      activeTests: library.tests.filter(t => t.status === 'published').length,
      draftTests: library.tests.filter(t => t.status === 'draft').length,
      reviewTests: library.tests.filter(t => t.status === 'review').length,
      archivedTests: library.tests.filter(t => t.status === 'archived').length,
      totalCategories: library.categories.length,
      totalTemplates: library.templates.length,
      totalDownloads: library.tests.reduce((sum, t) => sum + t.usage.downloads, 0),
      averageRating: 0, // TODO: Calculate from reviews
      topContributors: this.getTopContributors(library.tests),
      popularTags: this.getPopularTags(library.tests),
      monthlyGrowth: this.calculateMonthlyGrowth(library.tests)
    };

    library.stats = stats;
    library.updatedAt = Date.now();
  }

  private getTopContributors(tests: LibraryTest[]): string[] {
    const contributorCounts = new Map<string, number>();
    
    tests.forEach(test => {
      const count = contributorCounts.get(test.author.id) || 0;
      contributorCounts.set(test.author.id, count + 1);
    });

    return Array.from(contributorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId]) => userId);
  }

  private getPopularTags(tests: LibraryTest[]): string[] {
    const tagCounts = new Map<string, number>();
    
    tests.forEach(test => {
      test.tags.forEach(tag => {
        const count = tagCounts.get(tag) || 0;
        tagCounts.set(tag, count + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);
  }

  private calculateMonthlyGrowth(tests: LibraryTest[]): number {
    const now = Date.now();
    const lastMonth = now - (30 * 24 * 60 * 60 * 1000);
    
    const recentTests = tests.filter(t => t.createdAt > lastMonth);
    return recentTests.length;
  }

  private generateDefaultMetrics(): TestQualityMetrics {
    return {
      reliabilityScore: 75,
      maintainabilityScore: 70,
      complexityScore: 60,
      documentationScore: 50,
      testCoverage: 80,
      browserCompatibility: 85,
      performanceScore: 70,
      overallScore: 70
    };
  }

  private extractEventPatterns(events: RecordedEvent[]): any[] {
    // Simplified pattern extraction
    return events.map(event => ({
      type: event.type,
      target: {
        selector: event.target.selector,
        parameterized: []
      },
      data: event.data,
      optional: false,
      parameterized: []
    }));
  }
}

/**
 * Configuration interfaces
 */
export interface LibraryConfig {
  storage: {
    type: 'indexeddb' | 'localstorage' | 'cloud';
    endpoint?: string;
    apiKey?: string;
  };
  quality: {
    enabled: boolean;
    thresholds: Partial<TestQualityMetrics>;
  };
  search: {
    indexing: boolean;
    fuzzySearch: boolean;
  };
}

/**
 * Library storage implementation
 */
class LibraryStorage {
  private readonly config: LibraryConfig['storage'];

  constructor(config: LibraryConfig['storage']) {
    this.config = config;
  }

  async getLibrary(libraryId: string): Promise<TestLibrary | null> {
    if (this.config.type === 'localstorage') {
      const data = localStorage.getItem(`library_${libraryId}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async saveLibrary(library: TestLibrary): Promise<void> {
    if (this.config.type === 'localstorage') {
      localStorage.setItem(`library_${library.id}`, JSON.stringify(library));
    }
  }
}

/**
 * Quality analyzer for test assessments
 */
class QualityAnalyzer {
  private readonly config: LibraryConfig['quality'];

  constructor(config: LibraryConfig['quality']) {
    this.config = config;
  }

  async assess(test: SharedTestRecording): Promise<QualityAssessment> {
    const metrics = this.calculateMetrics(test);
    const recommendations = this.generateRecommendations(test, metrics);
    const score = this.calculateOverallScore(metrics);
    const passed = score >= 70; // Default threshold

    return {
      metrics,
      recommendations,
      passed,
      score
    };
  }

  private calculateMetrics(test: SharedTestRecording): TestQualityMetrics {
    // Simplified quality calculation
    return {
      reliabilityScore: this.assessReliability(test),
      maintainabilityScore: this.assessMaintainability(test),
      complexityScore: this.assessComplexity(test),
      documentationScore: this.assessDocumentation(test),
      testCoverage: this.assessCoverage(test),
      browserCompatibility: this.assessBrowserCompatibility(test),
      performanceScore: this.assessPerformance(test),
      overallScore: 0 // Calculated later
    };
  }

  private generateRecommendations(
    test: SharedTestRecording,
    metrics: TestQualityMetrics
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    if (metrics.reliabilityScore < 70) {
      recommendations.push({
        type: 'warning',
        category: 'reliability',
        message: 'Test has low reliability score',
        fix: 'Improve selector strategies and add better wait conditions',
        impact: 'high'
      });
    }

    if (metrics.documentationScore < 50) {
      recommendations.push({
        type: 'suggestion',
        category: 'documentation',
        message: 'Test lacks proper documentation',
        fix: 'Add description and comments to explain test purpose',
        impact: 'medium'
      });
    }

    return recommendations;
  }

  private calculateOverallScore(metrics: TestQualityMetrics): number {
    const weights = {
      reliability: 0.3,
      maintainability: 0.2,
      complexity: 0.15,
      documentation: 0.1,
      coverage: 0.15,
      browserCompatibility: 0.05,
      performance: 0.05
    };

    return Math.round(
      metrics.reliabilityScore * weights.reliability +
      metrics.maintainabilityScore * weights.maintainability +
      (100 - metrics.complexityScore) * weights.complexity + // Lower complexity is better
      metrics.documentationScore * weights.documentation +
      metrics.testCoverage * weights.coverage +
      metrics.browserCompatibility * weights.browserCompatibility +
      metrics.performanceScore * weights.performance
    );
  }

  // Simplified assessment methods
  private assessReliability(test: SharedTestRecording): number {
    const events = test.events;
    let reliabilitySum = 0;
    
    events.forEach(event => {
      if (event.metadata?.reliability?.confidence) {
        reliabilitySum += event.metadata.reliability.confidence * 100;
      } else {
        reliabilitySum += 75; // Default score
      }
    });
    
    return events.length > 0 ? reliabilitySum / events.length : 0;
  }

  private assessMaintainability(_test: SharedTestRecording): number {
    // Factor in selector quality, event grouping, etc.
    return 75; // Placeholder
  }

  private assessComplexity(test: SharedTestRecording): number {
    const eventCount = test.events.length;
    const uniqueTypes = new Set(test.events.map(e => e.type)).size;
    
    if (eventCount < 10 && uniqueTypes < 4) return 20; // Low complexity
    if (eventCount < 30 && uniqueTypes < 8) return 50; // Medium complexity
    return 80; // High complexity
  }

  private assessDocumentation(test: SharedTestRecording): number {
    let score = 0;
    
    if (test.description && test.description.length > 20) score += 40;
    if (test.metadata.tags.length > 0) score += 20;
    if (test.comments.length > 0) score += 30;
    if (test.events.some(e => e.metadata.annotations.length > 0)) score += 10;
    
    return Math.min(score, 100);
  }

  private assessCoverage(_test: SharedTestRecording): number {
    // Assess how well the test covers different scenarios
    return 80; // Placeholder
  }

  private assessBrowserCompatibility(test: SharedTestRecording): number {
    return test.metadata.browserSupport.length * 20;
  }

  private assessPerformance(_test: SharedTestRecording): number {
    return 75; // Placeholder
  }
}

/**
 * Search engine for library tests
 */
class LibrarySearchEngine {
  private readonly config: LibraryConfig['search'];

  constructor(config: LibraryConfig['search']) {
    this.config = config;
  }

  search(tests: LibraryTest[], options: LibrarySearchOptions): LibrarySearchResult {
    let filteredTests = [...tests];

    // Apply filters
    if (options.query) {
      const query = options.query.toLowerCase();
      filteredTests = filteredTests.filter(test =>
        test.name.toLowerCase().includes(query) ||
        test.description?.toLowerCase().includes(query) ||
        test.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (options.categories?.length) {
      filteredTests = filteredTests.filter(test =>
        options.categories!.includes(test.category)
      );
    }

    if (options.tags?.length) {
      filteredTests = filteredTests.filter(test =>
        options.tags!.some(tag => test.tags.includes(tag))
      );
    }

    if (options.authors?.length) {
      filteredTests = filteredTests.filter(test =>
        options.authors!.includes(test.author.id)
      );
    }

    if (options.status?.length) {
      filteredTests = filteredTests.filter(test =>
        options.status!.includes(test.status)
      );
    }

    // Apply sorting
    if (options.sortBy) {
      filteredTests.sort((a, b) => {
        let valueA: any, valueB: any;
        
        switch (options.sortBy) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'created':
            valueA = a.createdAt;
            valueB = b.createdAt;
            break;
          case 'updated':
            valueA = a.updatedAt;
            valueB = b.updatedAt;
            break;
          case 'popularity':
            valueA = a.usage.popularityScore;
            valueB = b.usage.popularityScore;
            break;
          case 'quality':
            valueA = a.quality.overallScore;
            valueB = b.quality.overallScore;
            break;
          default:
            return 0;
        }

        if (options.sortOrder === 'desc') {
          return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
        } else {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        }
      });
    }

    // Apply pagination
    const total = filteredTests.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const paginatedTests = filteredTests.slice(offset, offset + limit);

    // Generate facets
    const facets = this.generateFacets(filteredTests);

    return {
      tests: paginatedTests,
      total,
      facets
    };
  }

  private generateFacets(tests: LibraryTest[]) {
    // Generate category facets
    const categoryMap = new Map<string, { name: string; count: number }>();
    const tagMap = new Map<string, number>();
    const authorMap = new Map<string, { name: string; count: number }>();
    const frameworkMap = new Map<string, number>();

    tests.forEach(test => {
      // Categories
      const catCount = categoryMap.get(test.category) || { name: test.category, count: 0 };
      categoryMap.set(test.category, { ...catCount, count: catCount.count + 1 });

      // Tags
      test.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });

      // Authors
      const authorCount = authorMap.get(test.author.id) || { name: test.author.name, count: 0 };
      authorMap.set(test.author.id, { ...authorCount, count: authorCount.count + 1 });

      // Frameworks
      const framework = test.recording.metadata.framework;
      frameworkMap.set(framework, (frameworkMap.get(framework) || 0) + 1);
    });

    return {
      categories: Array.from(categoryMap.entries()).map(([id, data]) => ({ id, ...data })),
      tags: Array.from(tagMap.entries()).map(([name, count]) => ({ name, count })),
      authors: Array.from(authorMap.entries()).map(([id, data]) => ({ id, ...data })),
      frameworks: Array.from(frameworkMap.entries()).map(([name, count]) => ({ name, count }))
    };
  }
}