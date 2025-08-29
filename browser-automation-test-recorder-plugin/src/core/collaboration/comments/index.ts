/**
 * Comments and Annotations System Exports
 * Central exports for the comments and visual annotations functionality
 */

export * from './comment-manager';
export * from './visual-annotations';

// Re-export types for convenience
export type {
  CommentCreationOptions,
  CommentUpdateOptions,
  CommentQueryOptions,
  CommentThread,
  CommentSearchResult,
  MentionNotification,
  CommentManagerConfig
} from './comment-manager';

export type {
  VisualAnnotationOptions,
  AnnotationType,
  AnnotationStyle,
  VisualAnnotation,
  AnnotationOverlay,
  AnnotationInteraction,
  VisualAnnotationConfig
} from './visual-annotations';