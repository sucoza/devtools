/**
 * Visual Annotations for Test Recordings
 * Handles visual comments overlaid on screenshots and UI elements
 */

import type {
  TestComment as _TestComment,
  CommentPosition,
  ScreenshotInfo,
  CollaborationUser
} from '../../../types';

/**
 * Visual annotation creation options
 */
export interface VisualAnnotationOptions {
  testId: string;
  eventId?: string;
  screenshotId?: string;
  position: { x: number; y: number };
  elementSelector?: string;
  content: string;
  annotationType: AnnotationType;
  style?: AnnotationStyle;
}

/**
 * Annotation types
 */
export type AnnotationType = 
  | 'comment'      // General comment
  | 'issue'        // Bug or issue
  | 'suggestion'   // Improvement suggestion
  | 'question'     // Question about functionality
  | 'highlight';   // Highlight important area

/**
 * Annotation visual style
 */
export interface AnnotationStyle {
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  size: 'small' | 'medium' | 'large';
  shape: 'circle' | 'square' | 'arrow' | 'pin';
  opacity?: number;
}

/**
 * Visual annotation data
 */
export interface VisualAnnotation {
  id: string;
  testId: string;
  eventId?: string;
  screenshotId?: string;
  position: CommentPosition;
  content: string;
  type: AnnotationType;
  style: AnnotationStyle;
  author: CollaborationUser;
  comments: string[]; // Comment IDs
  createdAt: number;
  updatedAt: number;
  resolved: boolean;
  resolvedBy?: CollaborationUser;
  resolvedAt?: number;
}

/**
 * Annotation overlay information
 */
export interface AnnotationOverlay {
  annotations: VisualAnnotation[];
  screenshot: ScreenshotInfo;
  viewport: { width: number; height: number };
  scale: number;
}

/**
 * Annotation interaction event
 */
export interface AnnotationInteraction {
  type: 'click' | 'hover' | 'drag' | 'resize';
  annotationId: string;
  position: { x: number; y: number };
  user: CollaborationUser;
  timestamp: number;
}

/**
 * Visual Annotations Manager
 */
export class VisualAnnotationManager {
  private readonly storage: AnnotationStorage;
  private readonly screenshotManager: ScreenshotManager;
  private readonly eventBus: AnnotationEventBus;

  constructor(config: VisualAnnotationConfig) {
    this.storage = new AnnotationStorage(config.storage);
    this.screenshotManager = new ScreenshotManager(config.screenshots);
    this.eventBus = new AnnotationEventBus();
  }

  /**
   * Create visual annotation
   */
  async createAnnotation(
    options: VisualAnnotationOptions,
    author: CollaborationUser
  ): Promise<VisualAnnotation> {
    // Validate position
    if (options.screenshotId) {
      await this.validateScreenshotPosition(options.screenshotId, options.position);
    }

    // Create annotation
    const annotation: VisualAnnotation = {
      id: this.generateAnnotationId(),
      testId: options.testId,
      eventId: options.eventId,
      screenshotId: options.screenshotId,
      position: {
        x: options.position.x,
        y: options.position.y,
        elementSelector: options.elementSelector,
        screenshotId: options.screenshotId
      },
      content: options.content,
      type: options.annotationType,
      style: options.style || this.getDefaultStyle(options.annotationType),
      author,
      comments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resolved: false
    };

    await this.storage.saveAnnotation(annotation);

    // Emit event
    this.eventBus.emit('annotation:created', annotation);

    return annotation;
  }

  /**
   * Update annotation
   */
  async updateAnnotation(
    annotationId: string,
    updates: Partial<VisualAnnotation>,
    user: CollaborationUser
  ): Promise<VisualAnnotation> {
    const annotation = await this.storage.getAnnotation(annotationId);
    if (!annotation) {
      throw new Error(`Annotation not found: ${annotationId}`);
    }

    // Check permissions
    if (annotation.author.id !== user.id && !user.permissions.canEdit) {
      throw new Error('Insufficient permissions to edit annotation');
    }

    const updatedAnnotation: VisualAnnotation = {
      ...annotation,
      ...updates,
      updatedAt: Date.now()
    };

    await this.storage.saveAnnotation(updatedAnnotation);

    // Emit event
    this.eventBus.emit('annotation:updated', updatedAnnotation);

    return updatedAnnotation;
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(annotationId: string, user: CollaborationUser): Promise<void> {
    const annotation = await this.storage.getAnnotation(annotationId);
    if (!annotation) {
      throw new Error(`Annotation not found: ${annotationId}`);
    }

    // Check permissions
    if (annotation.author.id !== user.id && !user.permissions.canDelete) {
      throw new Error('Insufficient permissions to delete annotation');
    }

    await this.storage.deleteAnnotation(annotationId);

    // Emit event
    this.eventBus.emit('annotation:deleted', { id: annotationId, annotation });
  }

  /**
   * Get annotations for test
   */
  async getTestAnnotations(testId: string): Promise<VisualAnnotation[]> {
    return this.storage.getAnnotationsByTest(testId);
  }

  /**
   * Get annotations for specific event
   */
  async getEventAnnotations(testId: string, eventId: string): Promise<VisualAnnotation[]> {
    return this.storage.getAnnotationsByEvent(testId, eventId);
  }

  /**
   * Get annotations for screenshot
   */
  async getScreenshotAnnotations(screenshotId: string): Promise<VisualAnnotation[]> {
    return this.storage.getAnnotationsByScreenshot(screenshotId);
  }

  /**
   * Create annotation overlay for display
   */
  async createOverlay(
    testId: string,
    eventId?: string,
    screenshotId?: string
  ): Promise<AnnotationOverlay> {
    let annotations: VisualAnnotation[];
    
    if (screenshotId) {
      annotations = await this.getScreenshotAnnotations(screenshotId);
    } else if (eventId) {
      annotations = await this.getEventAnnotations(testId, eventId);
    } else {
      annotations = await this.getTestAnnotations(testId);
    }

    // Get screenshot info
    const screenshot = screenshotId 
      ? await this.screenshotManager.getScreenshot(screenshotId)
      : null;

    if (!screenshot) {
      throw new Error('Screenshot required for annotation overlay');
    }

    return {
      annotations,
      screenshot,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scale: 1.0
    };
  }

  /**
   * Add comment to annotation
   */
  async addCommentToAnnotation(
    annotationId: string,
    commentId: string
  ): Promise<VisualAnnotation> {
    const annotation = await this.storage.getAnnotation(annotationId);
    if (!annotation) {
      throw new Error(`Annotation not found: ${annotationId}`);
    }

    annotation.comments.push(commentId);
    annotation.updatedAt = Date.now();

    await this.storage.saveAnnotation(annotation);
    return annotation;
  }

  /**
   * Remove comment from annotation
   */
  async removeCommentFromAnnotation(
    annotationId: string,
    commentId: string
  ): Promise<VisualAnnotation> {
    const annotation = await this.storage.getAnnotation(annotationId);
    if (!annotation) {
      throw new Error(`Annotation not found: ${annotationId}`);
    }

    annotation.comments = annotation.comments.filter(id => id !== commentId);
    annotation.updatedAt = Date.now();

    await this.storage.saveAnnotation(annotation);
    return annotation;
  }

  /**
   * Resolve annotation
   */
  async resolveAnnotation(
    annotationId: string,
    user: CollaborationUser
  ): Promise<VisualAnnotation> {
    return this.updateAnnotation(annotationId, {
      resolved: true,
      resolvedBy: user,
      resolvedAt: Date.now()
    }, user);
  }

  /**
   * Reopen annotation
   */
  async reopenAnnotation(
    annotationId: string,
    user: CollaborationUser
  ): Promise<VisualAnnotation> {
    return this.updateAnnotation(annotationId, {
      resolved: false,
      resolvedBy: undefined,
      resolvedAt: undefined
    }, user);
  }

  /**
   * Move annotation to new position
   */
  async moveAnnotation(
    annotationId: string,
    newPosition: { x: number; y: number },
    user: CollaborationUser
  ): Promise<VisualAnnotation> {
    const annotation = await this.storage.getAnnotation(annotationId);
    if (!annotation) {
      throw new Error(`Annotation not found: ${annotationId}`);
    }

    // Validate new position if on screenshot
    if (annotation.screenshotId) {
      await this.validateScreenshotPosition(annotation.screenshotId, newPosition);
    }

    const updatedPosition: CommentPosition = {
      ...annotation.position,
      x: newPosition.x,
      y: newPosition.y
    };

    return this.updateAnnotation(annotationId, { position: updatedPosition }, user);
  }

  /**
   * Get annotation statistics
   */
  async getAnnotationStats(testId: string): Promise<{
    total: number;
    byType: Record<AnnotationType, number>;
    resolved: number;
    unresolved: number;
    authors: number;
  }> {
    const annotations = await this.getTestAnnotations(testId);
    
    const byType: Record<AnnotationType, number> = {
      comment: 0,
      issue: 0,
      suggestion: 0,
      question: 0,
      highlight: 0
    };

    let resolved = 0;
    const authors = new Set<string>();

    annotations.forEach(annotation => {
      byType[annotation.type]++;
      if (annotation.resolved) resolved++;
      authors.add(annotation.author.id);
    });

    return {
      total: annotations.length,
      byType,
      resolved,
      unresolved: annotations.length - resolved,
      authors: authors.size
    };
  }

  /**
   * Export annotations for backup
   */
  async exportAnnotations(testId: string): Promise<{
    annotations: VisualAnnotation[];
    metadata: {
      testId: string;
      exportedAt: number;
      totalAnnotations: number;
    };
  }> {
    const annotations = await this.getTestAnnotations(testId);

    return {
      annotations,
      metadata: {
        testId,
        exportedAt: Date.now(),
        totalAnnotations: annotations.length
      }
    };
  }

  /**
   * Subscribe to annotation events
   */
  onAnnotationEvent(
    event: 'created' | 'updated' | 'deleted' | 'resolved',
    callback: (data: any) => void
  ): () => void {
    return this.eventBus.on(`annotation:${event}`, callback);
  }

  /**
   * Private helper methods
   */
  private async validateScreenshotPosition(
    screenshotId: string,
    position: { x: number; y: number }
  ): Promise<void> {
    const screenshot = await this.screenshotManager.getScreenshot(screenshotId);
    if (!screenshot) {
      throw new Error(`Screenshot not found: ${screenshotId}`);
    }

    if (position.x < 0 || position.x > screenshot.dimensions.width ||
        position.y < 0 || position.y > screenshot.dimensions.height) {
      throw new Error('Position is outside screenshot boundaries');
    }
  }

  private getDefaultStyle(type: AnnotationType): AnnotationStyle {
    const styles: Record<AnnotationType, AnnotationStyle> = {
      comment: {
        color: '#3B82F6',
        backgroundColor: '#EBF8FF',
        borderColor: '#3B82F6',
        size: 'medium',
        shape: 'circle',
        opacity: 0.9
      },
      issue: {
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
        borderColor: '#EF4444',
        size: 'medium',
        shape: 'circle',
        opacity: 0.9
      },
      suggestion: {
        color: '#10B981',
        backgroundColor: '#F0FDF4',
        borderColor: '#10B981',
        size: 'medium',
        shape: 'circle',
        opacity: 0.9
      },
      question: {
        color: '#F59E0B',
        backgroundColor: '#FFFBEB',
        borderColor: '#F59E0B',
        size: 'medium',
        shape: 'circle',
        opacity: 0.9
      },
      highlight: {
        color: '#8B5CF6',
        backgroundColor: '#F5F3FF',
        borderColor: '#8B5CF6',
        size: 'large',
        shape: 'square',
        opacity: 0.7
      }
    };

    return styles[type];
  }

  private generateAnnotationId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Configuration for visual annotations
 */
export interface VisualAnnotationConfig {
  storage: {
    type: 'indexeddb' | 'localstorage' | 'cloud';
    endpoint?: string;
    apiKey?: string;
  };
  screenshots: {
    storage: 'local' | 'cloud';
    endpoint?: string;
    apiKey?: string;
  };
}

/**
 * Storage for visual annotations
 */
class AnnotationStorage {
  private readonly config: VisualAnnotationConfig['storage'];

  constructor(config: VisualAnnotationConfig['storage']) {
    this.config = config;
  }

  async saveAnnotation(annotation: VisualAnnotation): Promise<void> {
    if (this.config.type === 'localstorage') {
      localStorage.setItem(`annotation_${annotation.id}`, JSON.stringify(annotation));
    }
  }

  async getAnnotation(annotationId: string): Promise<VisualAnnotation | null> {
    if (this.config.type === 'localstorage') {
      const data = localStorage.getItem(`annotation_${annotationId}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async deleteAnnotation(annotationId: string): Promise<void> {
    if (this.config.type === 'localstorage') {
      localStorage.removeItem(`annotation_${annotationId}`);
    }
  }

  async getAnnotationsByTest(testId: string): Promise<VisualAnnotation[]> {
    return this.queryAnnotations({ testId });
  }

  async getAnnotationsByEvent(testId: string, eventId: string): Promise<VisualAnnotation[]> {
    return this.queryAnnotations({ testId, eventId });
  }

  async getAnnotationsByScreenshot(screenshotId: string): Promise<VisualAnnotation[]> {
    return this.queryAnnotations({ screenshotId });
  }

  private async queryAnnotations(filters: {
    testId?: string;
    eventId?: string;
    screenshotId?: string;
  }): Promise<VisualAnnotation[]> {
    const annotations: VisualAnnotation[] = [];
    
    if (this.config.type === 'localstorage') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('annotation_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const annotation = JSON.parse(data);
            
            // Apply filters
            if (filters.testId && annotation.testId !== filters.testId) continue;
            if (filters.eventId && annotation.eventId !== filters.eventId) continue;
            if (filters.screenshotId && annotation.screenshotId !== filters.screenshotId) continue;
            
            annotations.push(annotation);
          }
        }
      }
    }
    
    return annotations.sort((a, b) => a.createdAt - b.createdAt);
  }
}

/**
 * Screenshot manager for annotations
 */
class ScreenshotManager {
  private readonly config: VisualAnnotationConfig['screenshots'];

  constructor(config: VisualAnnotationConfig['screenshots']) {
    this.config = config;
  }

  async getScreenshot(screenshotId: string): Promise<ScreenshotInfo | null> {
    // Implementation would retrieve screenshot from storage
    return {
      id: screenshotId,
      format: 'png',
      fullPage: false,
      size: 1024 * 1024, // 1MB
      dimensions: { width: 1920, height: 1080 },
      data: undefined,
      path: `/screenshots/${screenshotId}.png`
    };
  }
}

/**
 * Event bus for annotation events
 */
class AnnotationEventBus {
  private listeners = new Map<string, Array<(data: any) => void>>();

  emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch {
          // silently ignore
        }
      });
    }
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }
}