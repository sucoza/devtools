/**
 * Visual Regression Baseline Manager
 * Handles baseline image storage, retrieval, and versioning
 */

export interface BaselineImage {
  id: string;
  name: string;
  url: string;
  selector?: string;
  viewport: ViewportConfig;
  format: 'png' | 'jpeg' | 'webp';
  data?: string; // base64 encoded image data
  path?: string; // local file path
  size: number;
  dimensions: { width: number; height: number };
  hash: string; // image hash for comparison
  createdAt: number;
  version: string;
  metadata: BaselineMetadata;
}

export interface BaselineMetadata {
  userAgent: string;
  devicePixelRatio: number;
  os: string;
  browser: string;
  tags: string[];
  description?: string;
  author?: string;
  environment?: string; // staging, production, etc.
  branch?: string;
  commit?: string;
}

export interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  isLandscape: boolean;
}

export interface BaselineSet {
  id: string;
  name: string;
  baselines: BaselineImage[];
  environment: string;
  version: string;
  createdAt: number;
  updatedAt: number;
}

export interface BaselineStorageConfig {
  type: 'local' | 'cloud' | 'git';
  path?: string;
  cloudConfig?: {
    provider: 'aws' | 'gcp' | 'azure' | 'custom';
    bucket: string;
    region?: string;
    credentials?: any;
  };
  gitConfig?: {
    repository: string;
    branch: string;
    path: string;
    token?: string;
  };
}

export class BaselineManager {
  private config: BaselineStorageConfig;
  private cache = new Map<string, BaselineImage>();
  private sets = new Map<string, BaselineSet>();

  constructor(config: BaselineStorageConfig) {
    this.config = config;
  }

  /**
   * Save a new baseline image
   */
  async saveBaseline(
    name: string,
    imageData: string | Uint8Array,
    options: {
      selector?: string;
      viewport: ViewportConfig;
      format?: 'png' | 'jpeg' | 'webp';
      metadata?: Partial<BaselineMetadata>;
      environment?: string;
      version?: string;
    }
  ): Promise<BaselineImage> {
    const id = this.generateBaselineId(name, options.selector);
    const hash = await this.calculateImageHash(imageData);
    
    const baseline: BaselineImage = {
      id,
      name,
      url: window.location.href,
      selector: options.selector,
      viewport: options.viewport,
      format: options.format || 'png',
      data: typeof imageData === 'string' ? imageData : this.arrayBufferToBase64(imageData),
      size: typeof imageData === 'string' ? imageData.length : imageData.length,
      dimensions: await this.getImageDimensions(imageData),
      hash,
      createdAt: Date.now(),
      version: options.version || '1.0.0',
      metadata: {
        userAgent: navigator.userAgent,
        devicePixelRatio: window.devicePixelRatio,
        os: this.detectOS(),
        browser: this.detectBrowser(),
        tags: [],
        environment: options.environment || 'local',
        ...options.metadata,
      },
    };

    // Store baseline based on configuration
    await this.storeBaseline(baseline);
    
    // Cache for quick access
    this.cache.set(id, baseline);

    return baseline;
  }

  /**
   * Get baseline image by name and selector
   */
  async getBaseline(
    name: string,
    selector?: string,
    environment?: string
  ): Promise<BaselineImage | null> {
    const id = this.generateBaselineId(name, selector);
    
    // Check cache first
    if (this.cache.has(id)) {
      const cached = this.cache.get(id)!;
      if (!environment || cached.metadata.environment === environment) {
        return cached;
      }
    }

    // Load from storage
    return await this.loadBaseline(id, environment);
  }

  /**
   * Get all baselines for a specific environment
   */
  async getBaselines(environment?: string): Promise<BaselineImage[]> {
    const baselines = await this.loadAllBaselines();
    
    if (environment) {
      return baselines.filter(b => b.metadata.environment === environment);
    }
    
    return baselines;
  }

  /**
   * Update existing baseline
   */
  async updateBaseline(
    id: string,
    updates: Partial<BaselineImage>
  ): Promise<BaselineImage | null> {
    const existing = this.cache.get(id) || await this.loadBaseline(id);
    
    if (!existing) {
      return null;
    }

    const updated: BaselineImage = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.storeBaseline(updated);
    this.cache.set(id, updated);

    return updated;
  }

  /**
   * Delete baseline
   */
  async deleteBaseline(id: string): Promise<boolean> {
    try {
      await this.removeBaseline(id);
      this.cache.delete(id);
      return true;
    } catch (error) {
      console.error('Failed to delete baseline:', error);
      return false;
    }
  }

  /**
   * Create or update baseline set
   */
  async saveBaselineSet(set: BaselineSet): Promise<void> {
    this.sets.set(set.id, set);
    
    // Store set metadata
    if (this.config.type === 'local') {
      localStorage.setItem(`baseline_set_${set.id}`, JSON.stringify(set));
    }
    // Implement cloud/git storage as needed
  }

  /**
   * Get baseline set
   */
  async getBaselineSet(id: string): Promise<BaselineSet | null> {
    if (this.sets.has(id)) {
      return this.sets.get(id)!;
    }

    if (this.config.type === 'local') {
      const stored = localStorage.getItem(`baseline_set_${id}`);
      if (stored) {
        const set = JSON.parse(stored);
        this.sets.set(id, set);
        return set;
      }
    }

    return null;
  }

  /**
   * Compare current screenshot with baseline
   */
  async compareWithBaseline(
    baselineId: string,
    currentImage: string | Uint8Array,
    options?: {
      threshold?: number;
      ignoreRegions?: Array<{ x: number; y: number; width: number; height: number }>;
      pixelMatchOptions?: any;
    }
  ): Promise<VisualComparisonResult> {
    const baseline = await this.getBaseline(baselineId);
    
    if (!baseline) {
      throw new Error(`Baseline not found: ${baselineId}`);
    }

    // This would integrate with actual image comparison library
    // For now, returning a mock result structure
    return {
      passed: true,
      threshold: options?.threshold || 0.1,
      pixelDiff: 0,
      pixelDiffPercentage: 0,
      totalPixels: baseline.dimensions.width * baseline.dimensions.height,
      diffImage: null,
      regions: [],
    };
  }

  /**
   * Generate unique baseline ID
   */
  private generateBaselineId(name: string, selector?: string): string {
    const base = `${name}_${window.location.pathname}`;
    const selectorPart = selector ? `_${this.hashString(selector)}` : '';
    return `baseline_${this.hashString(base + selectorPart)}`;
  }

  /**
   * Store baseline in configured storage
   */
  private async storeBaseline(baseline: BaselineImage): Promise<void> {
    switch (this.config.type) {
      case 'local':
        localStorage.setItem(`baseline_${baseline.id}`, JSON.stringify(baseline));
        break;
      
      case 'cloud':
        await this.storeInCloud(baseline);
        break;
        
      case 'git':
        await this.storeInGit(baseline);
        break;
    }
  }

  /**
   * Load baseline from configured storage
   */
  private async loadBaseline(id: string, environment?: string): Promise<BaselineImage | null> {
    switch (this.config.type) {
      case 'local':
        const stored = localStorage.getItem(`baseline_${id}`);
        return stored ? JSON.parse(stored) : null;
      
      case 'cloud':
        return await this.loadFromCloud(id, environment);
        
      case 'git':
        return await this.loadFromGit(id, environment);
        
      default:
        return null;
    }
  }

  /**
   * Load all baselines
   */
  private async loadAllBaselines(): Promise<BaselineImage[]> {
    const baselines: BaselineImage[] = [];

    if (this.config.type === 'local') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('baseline_')) {
          const baseline = JSON.parse(localStorage.getItem(key)!);
          baselines.push(baseline);
        }
      }
    }

    return baselines;
  }

  /**
   * Remove baseline from storage
   */
  private async removeBaseline(id: string): Promise<void> {
    switch (this.config.type) {
      case 'local':
        localStorage.removeItem(`baseline_${id}`);
        break;
      
      case 'cloud':
        await this.removeFromCloud(id);
        break;
        
      case 'git':
        await this.removeFromGit(id);
        break;
    }
  }

  /**
   * Cloud storage implementation (placeholder)
   */
  private async storeInCloud(baseline: BaselineImage): Promise<void> {
    // Implement cloud storage logic based on provider
    console.log('Storing baseline in cloud:', baseline.id);
  }

  private async loadFromCloud(id: string, environment?: string): Promise<BaselineImage | null> {
    // Implement cloud loading logic
    console.log('Loading baseline from cloud:', id);
    return null;
  }

  private async removeFromCloud(id: string): Promise<void> {
    // Implement cloud removal logic
    console.log('Removing baseline from cloud:', id);
  }

  /**
   * Git storage implementation (placeholder)
   */
  private async storeInGit(baseline: BaselineImage): Promise<void> {
    // Implement git storage logic
    console.log('Storing baseline in git:', baseline.id);
  }

  private async loadFromGit(id: string, environment?: string): Promise<BaselineImage | null> {
    // Implement git loading logic
    console.log('Loading baseline from git:', id);
    return null;
  }

  private async removeFromGit(id: string): Promise<void> {
    // Implement git removal logic
    console.log('Removing baseline from git:', id);
  }

  /**
   * Calculate image hash for comparison
   */
  private async calculateImageHash(imageData: string | Uint8Array): Promise<string> {
    const data = typeof imageData === 'string' 
      ? new TextEncoder().encode(imageData)
      : imageData;
      
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(imageData: string | Uint8Array): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      
      if (typeof imageData === 'string') {
        img.src = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
      } else {
        const blob = new Blob([imageData], { type: 'image/png' });
        img.src = URL.createObjectURL(blob);
      }
    });
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Hash string for ID generation
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Detect operating system
   */
  private detectOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Detect browser
   */
  private detectBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
}

export interface VisualComparisonResult {
  passed: boolean;
  threshold: number;
  pixelDiff: number;
  pixelDiffPercentage: number;
  totalPixels: number;
  diffImage: string | null; // base64 encoded diff image
  regions: DiffRegion[];
}

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelDiff: number;
  severity: 'low' | 'medium' | 'high';
}

// Re-export types from diff-engine for convenience
export type {
  DiffOptions,
  DiffResult,
  DiffAnalysis,
  DetailedDiffRegion,
  IgnoreRegion,
  ChangeType,
} from './diff-engine';