/**
 * Test Recording Sharing Manager
 * Handles creating, updating, and managing shareable test recordings
 */

import type {
  RecordedEvent,
  SharedTestRecording,
  SharingSettings,
  CollaborationUser,
  SharedTestMetadata,
  TestVersion,
  VersionChange
} from '../../../types';

/**
 * Share creation options
 */
export interface ShareOptions {
  name: string;
  description?: string;
  visibility: 'private' | 'team' | 'public';
  allowFork: boolean;
  allowEdit: boolean;
  allowComment: boolean;
  allowDownload: boolean;
  expiresAt?: number;
  password?: string;
  tags?: string[];
  category?: string;
}

/**
 * Share export format
 */
export type ShareExportFormat = 'json' | 'har' | 'playwright' | 'cypress' | 'selenium' | 'zip';

/**
 * Share import result
 */
export interface ShareImportResult {
  success: boolean;
  recording?: SharedTestRecording;
  errors: string[];
  warnings: string[];
}

/**
 * Share validation result
 */
export interface ShareValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Sharing manager class for test recordings
 */
export class SharingManager {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly storage: SharingStorage;

  constructor(config: SharingConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.storage = new SharingStorage(config.storage);
  }

  /**
   * Create a shareable test recording
   */
  async createSharedTest(
    events: RecordedEvent[],
    options: ShareOptions,
    author: CollaborationUser
  ): Promise<SharedTestRecording> {
    // Validate events
    const validation = this.validateEvents(events);
    if (!validation.valid) {
      throw new Error(`Cannot share invalid recording: ${validation.errors.join(', ')}`);
    }

    // Generate unique IDs
    const id = this.generateId();
    const shareId = this.generateShareId();
    const now = Date.now();

    // Create metadata
    const metadata: SharedTestMetadata = {
      sessionId: `session_${now}`,
      url: events.find(e => e.type === 'navigation')?.data.type === 'navigation' ? 
        (events.find(e => e.type === 'navigation')?.data as any).url : 
        window.location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        isLandscape: window.innerWidth > window.innerHeight,
        isMobile: navigator.userAgent.includes('Mobile')
      },
      userAgent: navigator.userAgent,
      duration: this.calculateDuration(events),
      eventCount: events.length,
      tags: options.tags || [],
      category: options.category || 'uncategorized',
      framework: 'browser-automation-test-recorder',
      language: 'javascript',
      complexity: this.calculateComplexity(events),
      browserSupport: this.detectBrowserSupport(events),
      dependencies: this.extractDependencies(events)
    };

    // Create sharing settings
    const sharing: SharingSettings = {
      visibility: options.visibility,
      allowFork: options.allowFork,
      allowEdit: options.allowEdit,
      allowComment: options.allowComment,
      allowDownload: options.allowDownload,
      expiresAt: options.expiresAt,
      password: options.password,
      requireLogin: options.visibility !== 'public',
      permissions: {}
    };

    // Create initial version
    const initialVersion: TestVersion = {
      id: this.generateId(),
      version: '1.0.0',
      name: 'Initial version',
      description: 'Initial recording version',
      events,
      author,
      createdAt: now,
      tags: ['initial'],
      changelog: [{
        type: 'added',
        description: 'Initial recording created',
        eventIds: events.map(e => e.id)
      }],
      parentVersion: undefined
    };

    // Create shared test recording
    const sharedTest: SharedTestRecording = {
      id,
      originalId: id,
      shareId,
      name: options.name,
      description: options.description,
      events,
      metadata,
      sharing,
      collaborators: [author],
      comments: [],
      reviews: [],
      versions: [initialVersion],
      createdAt: now,
      updatedAt: now,
      createdBy: author.id
    };

    // Store locally
    await this.storage.saveSharedTest(sharedTest);

    // Upload to cloud if configured
    if (this.baseUrl && this.apiKey) {
      try {
        await this.uploadToCloud(sharedTest);
      } catch {
        // console.warn('Failed to upload to cloud:', error);
        // Continue with local storage
      }
    }

    return sharedTest;
  }

  /**
   * Update an existing shared test
   */
  async updateSharedTest(
    testId: string,
    updates: Partial<SharedTestRecording>,
    author: CollaborationUser
  ): Promise<SharedTestRecording> {
    const existingTest = await this.storage.getSharedTest(testId);
    if (!existingTest) {
      throw new Error(`Shared test not found: ${testId}`);
    }

    // Check permissions
    if (!this.hasEditPermission(existingTest, author)) {
      throw new Error('Insufficient permissions to edit this test');
    }

    // Create new version if events changed
    let newVersion: TestVersion | undefined;
    if (updates.events && JSON.stringify(updates.events) !== JSON.stringify(existingTest.events)) {
      const lastVersion = existingTest.versions[existingTest.versions.length - 1];
      const versionParts = lastVersion.version.split('.').map(Number);
      versionParts[1]++; // Increment minor version
      
      newVersion = {
        id: this.generateId(),
        version: versionParts.join('.'),
        name: `Version ${versionParts.join('.')}`,
        description: 'Updated recording',
        events: updates.events,
        author,
        createdAt: Date.now(),
        tags: ['update'],
        changelog: this.generateChangelog(existingTest.events, updates.events),
        parentVersion: lastVersion.id
      };
    }

    // Apply updates
    const updatedTest: SharedTestRecording = {
      ...existingTest,
      ...updates,
      updatedAt: Date.now(),
      versions: newVersion ? [...existingTest.versions, newVersion] : existingTest.versions
    };

    // Update metadata if needed
    if (updates.events) {
      updatedTest.metadata = {
        ...updatedTest.metadata,
        eventCount: updates.events.length,
        duration: this.calculateDuration(updates.events),
        complexity: this.calculateComplexity(updates.events)
      };
    }

    // Save updates
    await this.storage.saveSharedTest(updatedTest);

    // Sync to cloud
    if (this.baseUrl && this.apiKey) {
      try {
        await this.syncToCloud(updatedTest);
      } catch {
        // console.warn('Failed to sync to cloud:', error);
      }
    }

    return updatedTest;
  }

  /**
   * Fork an existing shared test
   */
  async forkSharedTest(
    testId: string,
    options: Partial<ShareOptions>,
    author: CollaborationUser
  ): Promise<SharedTestRecording> {
    const originalTest = await this.getSharedTest(testId);
    if (!originalTest) {
      throw new Error(`Shared test not found: ${testId}`);
    }

    // Check fork permissions
    if (!originalTest.sharing.allowFork) {
      throw new Error('Forking is not allowed for this test');
    }

    // Create fork with new IDs but same events
    const forkOptions: ShareOptions = {
      name: options.name || `${originalTest.name} (Fork)`,
      description: options.description || `Fork of ${originalTest.name}`,
      visibility: options.visibility || 'private',
      allowFork: options.allowFork !== undefined ? options.allowFork : true,
      allowEdit: options.allowEdit !== undefined ? options.allowEdit : true,
      allowComment: options.allowComment !== undefined ? options.allowComment : true,
      allowDownload: options.allowDownload !== undefined ? options.allowDownload : true,
      tags: [...(originalTest.metadata.tags || []), 'fork'],
      category: options.category || originalTest.metadata.category
    };

    const forkedTest = await this.createSharedTest(originalTest.events, forkOptions, author);
    
    // Add fork metadata
    forkedTest.metadata = {
      ...forkedTest.metadata,
      dependencies: [...forkedTest.metadata.dependencies, `fork:${originalTest.id}`]
    };

    await this.storage.saveSharedTest(forkedTest);

    return forkedTest;
  }

  /**
   * Get shared test by ID
   */
  async getSharedTest(testId: string): Promise<SharedTestRecording | null> {
    // Try local storage first
    let test = await this.storage.getSharedTest(testId);
    
    // Try cloud if not found locally
    if (!test && this.baseUrl && this.apiKey) {
      try {
        test = await this.fetchFromCloud(testId);
        if (test) {
          await this.storage.saveSharedTest(test);
        }
      } catch {
        // console.warn('Failed to fetch from cloud:', error);
      }
    }

    return test;
  }

  /**
   * Get shared test by share ID (public URL)
   */
  async getSharedTestByShareId(shareId: string): Promise<SharedTestRecording | null> {
    return this.storage.getSharedTestByShareId(shareId);
  }

  /**
   * List shared tests with filters
   */
  async listSharedTests(filters?: {
    author?: string;
    visibility?: SharingSettings['visibility'];
    tags?: string[];
    category?: string;
    search?: string;
  }): Promise<SharedTestRecording[]> {
    return this.storage.listSharedTests(filters);
  }

  /**
   * Delete shared test
   */
  async deleteSharedTest(testId: string, user: CollaborationUser): Promise<void> {
    const test = await this.storage.getSharedTest(testId);
    if (!test) {
      throw new Error(`Shared test not found: ${testId}`);
    }

    // Check permissions
    if (test.createdBy !== user.id && !user.permissions.canDelete) {
      throw new Error('Insufficient permissions to delete this test');
    }

    await this.storage.deleteSharedTest(testId);

    // Delete from cloud
    if (this.baseUrl && this.apiKey) {
      try {
        await this.deleteFromCloud(testId);
      } catch {
        // console.warn('Failed to delete from cloud:', error);
      }
    }
  }

  /**
   * Export shared test in various formats
   */
  async exportSharedTest(
    testId: string,
    format: ShareExportFormat
  ): Promise<Blob | string> {
    const test = await this.getSharedTest(testId);
    if (!test) {
      throw new Error(`Shared test not found: ${testId}`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(test, null, 2);
      
      case 'har':
        return this.convertToHar(test);
      
      case 'playwright':
        return this.generatePlaywrightCode(test);
      
      case 'cypress':
        return this.generateCypressCode(test);
      
      case 'selenium':
        return this.generateSeleniumCode(test);
      
      case 'zip':
        return this.createZipExport(test);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import shared test from various formats
   */
  async importSharedTest(
    data: string | File,
    format: ShareExportFormat,
    author: CollaborationUser
  ): Promise<ShareImportResult> {
    try {
      let recording: SharedTestRecording;

      switch (format) {
        case 'json':
          recording = JSON.parse(typeof data === 'string' ? data : await data.text());
          break;
      
        case 'har':
          recording = await this.convertFromHar(
            typeof data === 'string' ? data : await data.text(),
            author
          );
          break;
      
        default:
          throw new Error(`Import format ${format} not yet implemented`);
      }

      // Validate imported recording
      const validation = this.validateSharedTest(recording);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Assign new IDs to avoid conflicts
      recording.id = this.generateId();
      recording.shareId = this.generateShareId();
      recording.createdBy = author.id;
      recording.collaborators = [author];

      await this.storage.saveSharedTest(recording);

      return {
        success: true,
        recording,
        errors: [],
        warnings: validation.warnings
      };
    } catch {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown import error'],
        warnings: []
      };
    }
  }

  /**
   * Generate shareable URL
   */
  generateShareUrl(shareId: string, baseUrl?: string): string {
    const base = baseUrl || this.baseUrl || window.location.origin;
    return `${base}/shared/${shareId}`;
  }

  /**
   * Validate events before sharing
   */
  private validateEvents(events: RecordedEvent[]): ShareValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (events.length === 0) {
      errors.push('Cannot share empty recording');
    }

    // Check for navigation events
    const hasNavigation = events.some(e => e.type === 'navigation');
    if (!hasNavigation) {
      warnings.push('Recording has no navigation events');
    }

    // Check for potential sensitive data
    events.forEach((event, index) => {
      if (event.type === 'input' && event.data.type === 'form') {
        const formData = (event.data as any).formData;
        if (formData && this.containsSensitiveData(formData)) {
          warnings.push(`Event ${index + 1} may contain sensitive data`);
          suggestions.push('Consider removing or masking sensitive input values');
        }
      }
    });

    // Check selector reliability
    const unreliableSelectors = events.filter(
      e => e.metadata?.reliability?.confidence && e.metadata.reliability.confidence < 0.7
    );
    if (unreliableSelectors.length > 0) {
      warnings.push(`${unreliableSelectors.length} events have unreliable selectors`);
      suggestions.push('Consider improving selector strategies before sharing');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate shared test structure
   */
  private validateSharedTest(test: SharedTestRecording): ShareValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields
    if (!test.id) errors.push('Missing test ID');
    if (!test.name) errors.push('Missing test name');
    if (!test.events || !Array.isArray(test.events)) errors.push('Missing or invalid events');
    if (!test.metadata) errors.push('Missing metadata');
    if (!test.sharing) errors.push('Missing sharing settings');

    // Validate events
    if (test.events) {
      const eventValidation = this.validateEvents(test.events);
      errors.push(...eventValidation.errors);
      warnings.push(...eventValidation.warnings);
      suggestions.push(...eventValidation.suggestions);
    }

    return { valid: errors.length === 0, errors, warnings, suggestions };
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateShareId(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  private calculateDuration(events: RecordedEvent[]): number {
    if (events.length === 0) return 0;
    const first = events[0].timestamp;
    const last = events[events.length - 1].timestamp;
    return last - first;
  }

  private calculateComplexity(events: RecordedEvent[]): 'simple' | 'medium' | 'complex' {
    const uniqueTypes = new Set(events.map(e => e.type)).size;
    const eventCount = events.length;
    
    if (eventCount < 10 && uniqueTypes < 4) return 'simple';
    if (eventCount < 50 && uniqueTypes < 8) return 'medium';
    return 'complex';
  }

  private detectBrowserSupport(events: RecordedEvent[]): string[] {
    // Analyze events for browser-specific features
    const support = ['chrome', 'firefox', 'safari', 'edge'];
    
    // Check for browser-specific features
    const hasTouch = events.some(e => e.type.startsWith('touch'));
    if (hasTouch) {
      // Mobile browsers
      return [...support, 'mobile'];
    }

    return support;
  }

  private extractDependencies(events: RecordedEvent[]): string[] {
    const dependencies: string[] = [];
    
    // Check for framework-specific selectors
    events.forEach(event => {
      const selector = event.target.selector;
      if (selector.includes('[data-testid=')) dependencies.push('data-testid');
      if (selector.includes('aria-')) dependencies.push('aria-labels');
      if (selector.includes('react-')) dependencies.push('react');
      if (selector.includes('ng-')) dependencies.push('angular');
    });

    return [...new Set(dependencies)];
  }

  private hasEditPermission(test: SharedTestRecording, user: CollaborationUser): boolean {
    return test.createdBy === user.id || 
           user.permissions.canEdit ||
           test.sharing.permissions[user.id]?.canEdit === true;
  }

  private generateChangelog(oldEvents: RecordedEvent[], newEvents: RecordedEvent[]): VersionChange[] {
    const changes: VersionChange[] = [];
    
    // Simple diff - in real implementation, use proper diffing algorithm
    if (newEvents.length > oldEvents.length) {
      changes.push({
        type: 'added',
        description: `Added ${newEvents.length - oldEvents.length} events`
      });
    } else if (newEvents.length < oldEvents.length) {
      changes.push({
        type: 'removed',
        description: `Removed ${oldEvents.length - newEvents.length} events`
      });
    } else {
      changes.push({
        type: 'modified',
        description: 'Modified existing events'
      });
    }

    return changes;
  }

  private containsSensitiveData(data: any): boolean {
    const sensitivePatterns = [
      /password/i,
      /ssn|social.security/i,
      /credit.card|creditcard/i,
      /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/, // Credit card pattern
      /\d{3}-\d{2}-\d{4}/ // SSN pattern
    ];

    const dataStr = JSON.stringify(data).toLowerCase();
    return sensitivePatterns.some(pattern => pattern.test(dataStr));
  }

  // Placeholder methods for cloud integration
  private async uploadToCloud(_test: SharedTestRecording): Promise<void> {
    // Implementation would use actual API
    // console.log('Upload to cloud:', test.id);
  }

  private async syncToCloud(_test: SharedTestRecording): Promise<void> {
    // Implementation would use actual API
    // console.log('Sync to cloud:', test.id);
  }

  private async fetchFromCloud(_testId: string): Promise<SharedTestRecording | null> {
    // Implementation would use actual API
    // console.log('Fetch from cloud:', testId);
    return null;
  }

  private async deleteFromCloud(_testId: string): Promise<void> {
    // Implementation would use actual API
    // console.log('Delete from cloud:', testId);
  }

  // Placeholder methods for format conversion
  private convertToHar(_test: SharedTestRecording): string {
    // Convert to HTTP Archive format
    return JSON.stringify({ log: { entries: [] } });
  }

  private async convertFromHar(_har: string, _author: CollaborationUser): Promise<SharedTestRecording> {
    // Convert from HAR to SharedTestRecording
    throw new Error('HAR import not implemented yet');
  }

  private generatePlaywrightCode(test: SharedTestRecording): string {
    // Generate Playwright test code
    return `// Generated Playwright test for: ${test.name}`;
  }

  private generateCypressCode(test: SharedTestRecording): string {
    // Generate Cypress test code
    return `// Generated Cypress test for: ${test.name}`;
  }

  private generateSeleniumCode(test: SharedTestRecording): string {
    // Generate Selenium test code
    return `// Generated Selenium test for: ${test.name}`;
  }

  private async createZipExport(_test: SharedTestRecording): Promise<Blob> {
    // Create ZIP with test files
    return new Blob(['zip content'], { type: 'application/zip' });
  }
}

/**
 * Configuration for sharing manager
 */
export interface SharingConfig {
  baseUrl?: string;
  apiKey?: string;
  storage: {
    type: 'indexeddb' | 'localstorage' | 'memory';
    name?: string;
  };
}

/**
 * Storage interface for shared tests
 */
export class SharingStorage {
  private readonly config: SharingConfig['storage'];

  constructor(config: SharingConfig['storage']) {
    this.config = config;
  }

  async saveSharedTest(test: SharedTestRecording): Promise<void> {
    // Implementation depends on storage type
    if (this.config.type === 'localstorage') {
      localStorage.setItem(`shared_test_${test.id}`, JSON.stringify(test));
    }
    // Add IndexedDB and memory implementations
  }

  async getSharedTest(testId: string): Promise<SharedTestRecording | null> {
    if (this.config.type === 'localstorage') {
      const data = localStorage.getItem(`shared_test_${testId}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async getSharedTestByShareId(shareId: string): Promise<SharedTestRecording | null> {
    // For localStorage, we'd need to iterate through all tests
    // In production, use proper indexing
    if (this.config.type === 'localstorage') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('shared_test_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const test = JSON.parse(data);
            if (test.shareId === shareId) {
              return test;
            }
          }
        }
      }
    }
    return null;
  }

  async listSharedTests(filters?: {
    author?: string;
    visibility?: SharingSettings['visibility'];
    tags?: string[];
    category?: string;
    search?: string;
  }): Promise<SharedTestRecording[]> {
    const tests: SharedTestRecording[] = [];
    
    if (this.config.type === 'localstorage') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('shared_test_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const test = JSON.parse(data);
            
            // Apply filters
            if (filters?.author && test.createdBy !== filters.author) continue;
            if (filters?.visibility && test.sharing.visibility !== filters.visibility) continue;
            if (filters?.category && test.metadata.category !== filters.category) continue;
            if (filters?.tags && !filters.tags.some(tag => test.metadata.tags.includes(tag))) continue;
            if (filters?.search) {
              const searchLower = filters.search.toLowerCase();
              if (!test.name.toLowerCase().includes(searchLower) &&
                  !test.description?.toLowerCase().includes(searchLower)) {
                continue;
              }
            }
            
            tests.push(test);
          }
        }
      }
    }
    
    return tests.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async deleteSharedTest(testId: string): Promise<void> {
    if (this.config.type === 'localstorage') {
      localStorage.removeItem(`shared_test_${testId}`);
    }
  }
}