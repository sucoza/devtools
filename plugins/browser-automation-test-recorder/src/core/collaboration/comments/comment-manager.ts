/**
 * Comment Manager for Test Recordings
 * Handles threaded comments, mentions, reactions, and visual annotations
 */

import type {
  TestComment,
  CommentAttachment,
  CommentPosition,
  CollaborationUser,
} from '../../../types';

/**
 * Comment creation options
 */
export interface CommentCreationOptions {
  content: string;
  testId: string;
  eventId?: string; // Comment on specific event
  parentId?: string; // For threaded replies
  position?: CommentPosition; // Visual position
  attachments?: File[];
  mentions?: string[]; // User IDs to mention
}

/**
 * Comment update options
 */
export interface CommentUpdateOptions {
  content?: string;
  attachments?: File[];
  mentions?: string[];
}

/**
 * Comment query options
 */
export interface CommentQueryOptions {
  testId?: string;
  eventId?: string;
  authorId?: string;
  parentId?: string | null; // null for top-level comments
  includeReplies?: boolean;
  sortBy?: 'created' | 'updated' | 'reactions';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Comment thread structure
 */
export interface CommentThread {
  comment: TestComment;
  replies: CommentThread[];
  totalReplies: number;
  hasMoreReplies: boolean;
}

/**
 * Comment search result
 */
export interface CommentSearchResult {
  comments: TestComment[];
  total: number;
  threads: CommentThread[];
}

/**
 * Mention notification
 */
export interface MentionNotification {
  commentId: string;
  mentionedUser: CollaborationUser;
  author: CollaborationUser;
  testId: string;
  content: string;
}

/**
 * Comment Manager for handling test recording comments
 */
export class CommentManager {
  private readonly storage: CommentStorage;
  private readonly attachmentManager: AttachmentManager;
  private readonly notificationManager: NotificationManager;
  private readonly mentionParser: MentionParser;

  constructor(config: CommentManagerConfig) {
    this.storage = new CommentStorage(config.storage);
    this.attachmentManager = new AttachmentManager(config.attachments);
    this.notificationManager = new NotificationManager(config.notifications);
    this.mentionParser = new MentionParser();
  }

  /**
   * Create a new comment
   */
  async createComment(
    options: CommentCreationOptions,
    author: CollaborationUser
  ): Promise<TestComment> {
    // Parse mentions from content
    const mentions = this.mentionParser.extractMentions(options.content);
    const allMentions = [...new Set([...(options.mentions || []), ...mentions])];

    // Process attachments
    const attachments = options.attachments 
      ? await this.attachmentManager.processAttachments(options.attachments)
      : [];

    // Create comment
    const comment: TestComment = {
      id: this.generateCommentId(),
      parentId: options.parentId,
      testId: options.testId,
      eventId: options.eventId,
      content: options.content,
      author,
      mentions: allMentions,
      attachments,
      reactions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      edited: false,
      position: options.position
    };

    // Save comment
    await this.storage.saveComment(comment);

    // Send notifications for mentions
    if (allMentions.length > 0) {
      await this.notifyMentionedUsers(comment);
    }

    // Send notification to test owner/collaborators
    await this.notifyTestCollaborators(comment);

    return comment;
  }

  /**
   * Update an existing comment
   */
  async updateComment(
    commentId: string,
    options: CommentUpdateOptions,
    user: CollaborationUser
  ): Promise<TestComment> {
    const existingComment = await this.storage.getComment(commentId);
    if (!existingComment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // Check permissions
    if (existingComment.author.id !== user.id && !user.permissions.canEdit) {
      throw new Error('Insufficient permissions to edit comment');
    }

    // Parse mentions if content changed
    let mentions = existingComment.mentions;
    if (options.content && options.content !== existingComment.content) {
      const parsedMentions = this.mentionParser.extractMentions(options.content);
      mentions = [...new Set([...(options.mentions || []), ...parsedMentions])];
    }

    // Process new attachments
    let attachments = existingComment.attachments;
    if (options.attachments) {
      const newAttachments = await this.attachmentManager.processAttachments(options.attachments);
      attachments = [...existingComment.attachments, ...newAttachments];
    }

    // Update comment
    const updatedComment: TestComment = {
      ...existingComment,
      ...options,
      mentions,
      attachments,
      updatedAt: Date.now(),
      edited: true
    };

    await this.storage.saveComment(updatedComment);

    // Notify newly mentioned users
    const newMentions = mentions.filter(m => !existingComment.mentions.includes(m));
    if (newMentions.length > 0) {
      const notificationComment = { ...updatedComment, mentions: newMentions };
      await this.notifyMentionedUsers(notificationComment);
    }

    return updatedComment;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, user: CollaborationUser): Promise<void> {
    const comment = await this.storage.getComment(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // Check permissions
    if (comment.author.id !== user.id && !user.permissions.canDelete) {
      throw new Error('Insufficient permissions to delete comment');
    }

    // Delete attachments
    await this.attachmentManager.deleteAttachments(comment.attachments);

    // Delete comment and all replies
    await this.storage.deleteCommentAndReplies(commentId);
  }

  /**
   * Get comment by ID
   */
  async getComment(commentId: string): Promise<TestComment | null> {
    return this.storage.getComment(commentId);
  }

  /**
   * Query comments with filters
   */
  async queryComments(options: CommentQueryOptions): Promise<CommentSearchResult> {
    const comments = await this.storage.queryComments(options);
    const total = await this.storage.countComments(options);
    const threads = options.includeReplies 
      ? await this.buildCommentThreads(comments)
      : [];

    return { comments, total, threads };
  }

  /**
   * Get comments for a specific test
   */
  async getTestComments(
    testId: string,
    includeReplies: boolean = true
  ): Promise<CommentThread[]> {
    const topLevelComments = await this.storage.queryComments({
      testId,
      parentId: null,
      sortBy: 'created',
      sortOrder: 'asc'
    });

    if (!includeReplies) {
      return topLevelComments.map(comment => ({
        comment,
        replies: [],
        totalReplies: 0,
        hasMoreReplies: false
      }));
    }

    return this.buildCommentThreads(topLevelComments);
  }

  /**
   * Get comments for a specific event
   */
  async getEventComments(
    testId: string,
    eventId: string
  ): Promise<TestComment[]> {
    return this.storage.queryComments({
      testId,
      eventId,
      sortBy: 'created',
      sortOrder: 'asc'
    });
  }

  /**
   * Add reaction to comment
   */
  async addReaction(
    commentId: string,
    emoji: string,
    user: CollaborationUser
  ): Promise<TestComment> {
    const comment = await this.storage.getComment(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // Find existing reaction
    let reaction = comment.reactions.find(r => r.emoji === emoji);
    if (!reaction) {
      reaction = { emoji, users: [], count: 0 };
      comment.reactions.push(reaction);
    }

    // Add user if not already reacted
    if (!reaction.users.includes(user.id)) {
      reaction.users.push(user.id);
      reaction.count = reaction.users.length;
    }

    comment.updatedAt = Date.now();
    await this.storage.saveComment(comment);

    return comment;
  }

  /**
   * Remove reaction from comment
   */
  async removeReaction(
    commentId: string,
    emoji: string,
    user: CollaborationUser
  ): Promise<TestComment> {
    const comment = await this.storage.getComment(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    const reaction = comment.reactions.find(r => r.emoji === emoji);
    if (reaction) {
      reaction.users = reaction.users.filter(id => id !== user.id);
      reaction.count = reaction.users.length;

      // Remove reaction if no users left
      if (reaction.count === 0) {
        comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
      }
    }

    comment.updatedAt = Date.now();
    await this.storage.saveComment(comment);

    return comment;
  }

  /**
   * Search comments by text
   */
  async searchComments(
    query: string,
    options: {
      testId?: string;
      authorId?: string;
      dateRange?: [number, number];
    } = {}
  ): Promise<TestComment[]> {
    return this.storage.searchComments(query, options);
  }

  /**
   * Get user's mentions
   */
  async getUserMentions(
    userId: string,
    options: {
      testId?: string;
      unreadOnly?: boolean;
      limit?: number;
    } = {}
  ): Promise<TestComment[]> {
    return this.storage.getUserMentions(userId, options);
  }

  /**
   * Mark mentions as read
   */
  async markMentionsRead(userId: string, commentIds: string[]): Promise<void> {
    // Implementation would track read status per user
    await this.notificationManager.markNotificationsRead(userId, commentIds);
  }

  /**
   * Get comment statistics
   */
  async getCommentStats(testId: string): Promise<{
    totalComments: number;
    topLevelComments: number;
    replies: number;
    participants: number;
    reactions: number;
    mentions: number;
  }> {
    const allComments = await this.storage.queryComments({ testId });
    const topLevel = allComments.filter(c => !c.parentId);
    const replies = allComments.filter(c => c.parentId);
    const participants = new Set(allComments.map(c => c.author.id)).size;
    const reactions = allComments.reduce((sum, c) => sum + c.reactions.length, 0);
    const mentions = allComments.reduce((sum, c) => sum + c.mentions.length, 0);

    return {
      totalComments: allComments.length,
      topLevelComments: topLevel.length,
      replies: replies.length,
      participants,
      reactions,
      mentions
    };
  }

  /**
   * Export comments for backup/analysis
   */
  async exportComments(testId: string): Promise<{
    comments: TestComment[];
    metadata: {
      testId: string;
      exportedAt: number;
      totalComments: number;
      dateRange: [number, number] | null;
    };
  }> {
    const comments = await this.storage.queryComments({ testId });
    const dates = comments.map(c => c.createdAt);
    const dateRange: [number, number] | null = dates.length > 0 ? [Math.min(...dates), Math.max(...dates)] : null;

    return {
      comments,
      metadata: {
        testId,
        exportedAt: Date.now(),
        totalComments: comments.length,
        dateRange
      }
    };
  }

  /**
   * Private helper methods
   */
  private async buildCommentThreads(comments: TestComment[]): Promise<CommentThread[]> {
    const threads: CommentThread[] = [];

    for (const comment of comments) {
      const replies = await this.loadCommentReplies(comment.id);
      const thread: CommentThread = {
        comment,
        replies: await this.buildCommentThreads(replies.slice(0, 3)), // First 3 replies
        totalReplies: replies.length,
        hasMoreReplies: replies.length > 3
      };
      threads.push(thread);
    }

    return threads;
  }

  private async loadCommentReplies(parentId: string): Promise<TestComment[]> {
    return this.storage.queryComments({
      parentId,
      sortBy: 'created',
      sortOrder: 'asc'
    });
  }

  private async notifyMentionedUsers(comment: TestComment): Promise<void> {
    for (const userId of comment.mentions) {
      if (userId !== comment.author.id) { // Don't notify self
        await this.notificationManager.sendMentionNotification({
          commentId: comment.id,
          mentionedUser: { id: userId } as CollaborationUser,
          author: comment.author,
          testId: comment.testId,
          content: this.truncateContent(comment.content, 100)
        });
      }
    }
  }

  private async notifyTestCollaborators(comment: TestComment): Promise<void> {
    // Get test collaborators and notify them of new comment
    // This would integrate with the sharing system
    await this.notificationManager.sendCommentNotification(comment);
  }

  private truncateContent(content: string, maxLength: number): string {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Configuration interfaces
 */
export interface CommentManagerConfig {
  storage: {
    type: 'indexeddb' | 'localstorage' | 'cloud';
    endpoint?: string;
    apiKey?: string;
  };
  attachments: {
    maxFileSize: number;
    allowedTypes: string[];
    storage: 'local' | 'cloud';
    cloudConfig?: {
      endpoint: string;
      apiKey: string;
    };
  };
  notifications: {
    realtime: boolean;
    email: boolean;
    inApp: boolean;
  };
}

/**
 * Comment storage implementation
 */
class CommentStorage {
  private readonly config: CommentManagerConfig['storage'];

  constructor(config: CommentManagerConfig['storage']) {
    this.config = config;
  }

  async saveComment(comment: TestComment): Promise<void> {
    if (this.config.type === 'localstorage') {
      localStorage.setItem(`comment_${comment.id}`, JSON.stringify(comment));
    }
    // Add IndexedDB and cloud implementations
  }

  async getComment(commentId: string): Promise<TestComment | null> {
    if (this.config.type === 'localstorage') {
      const data = localStorage.getItem(`comment_${commentId}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async queryComments(options: CommentQueryOptions): Promise<TestComment[]> {
    const comments: TestComment[] = [];
    
    if (this.config.type === 'localstorage') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('comment_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const comment = JSON.parse(data);
            
            // Apply filters
            if (options.testId && comment.testId !== options.testId) continue;
            if (options.eventId && comment.eventId !== options.eventId) continue;
            if (options.authorId && comment.author.id !== options.authorId) continue;
            if (options.parentId !== undefined && comment.parentId !== options.parentId) continue;
            
            comments.push(comment);
          }
        }
      }
    }
    
    // Sort results
    if (options.sortBy) {
      comments.sort((a, b) => {
        let valueA: any, valueB: any;
        
        switch (options.sortBy) {
          case 'created':
            valueA = a.createdAt;
            valueB = b.createdAt;
            break;
          case 'updated':
            valueA = a.updatedAt;
            valueB = b.updatedAt;
            break;
          case 'reactions':
            valueA = a.reactions.reduce((sum, r) => sum + r.count, 0);
            valueB = b.reactions.reduce((sum, r) => sum + r.count, 0);
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
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    return comments.slice(offset, offset + limit);
  }

  async countComments(options: CommentQueryOptions): Promise<number> {
    const comments = await this.queryComments({ ...options, limit: undefined, offset: undefined });
    return comments.length;
  }

  async deleteCommentAndReplies(commentId: string): Promise<void> {
    // Delete the comment and all its replies recursively
    const comment = await this.getComment(commentId);
    if (!comment) return;

    // Find and delete all replies
    const replies = await this.queryComments({ parentId: commentId });
    for (const reply of replies) {
      await this.deleteCommentAndReplies(reply.id);
    }

    // Delete the comment itself
    if (this.config.type === 'localstorage') {
      localStorage.removeItem(`comment_${commentId}`);
    }
  }

  async searchComments(
    query: string,
    options: {
      testId?: string;
      authorId?: string;
      dateRange?: [number, number];
    }
  ): Promise<TestComment[]> {
    const allComments = await this.queryComments({ testId: options.testId });
    const queryLower = query.toLowerCase();

    return allComments.filter(comment => {
      // Text search
      if (!comment.content.toLowerCase().includes(queryLower)) {
        return false;
      }

      // Author filter
      if (options.authorId && comment.author.id !== options.authorId) {
        return false;
      }

      // Date range filter
      if (options.dateRange) {
        const [start, end] = options.dateRange;
        if (comment.createdAt < start || comment.createdAt > end) {
          return false;
        }
      }

      return true;
    });
  }

  async getUserMentions(
    userId: string,
    options: {
      testId?: string;
      unreadOnly?: boolean;
      limit?: number;
    }
  ): Promise<TestComment[]> {
    const allComments = await this.queryComments({ testId: options.testId });
    
    const mentions = allComments.filter(comment => 
      comment.mentions.includes(userId) && comment.author.id !== userId
    );

    // Apply limit
    const limit = options.limit || 50;
    return mentions.slice(0, limit);
  }
}

/**
 * Attachment manager for comment files
 */
class AttachmentManager {
  private readonly config: CommentManagerConfig['attachments'];

  constructor(config: CommentManagerConfig['attachments']) {
    this.config = config;
  }

  async processAttachments(files: File[]): Promise<CommentAttachment[]> {
    const attachments: CommentAttachment[] = [];

    for (const file of files) {
      // Validate file
      if (file.size > this.config.maxFileSize) {
        throw new Error(`File ${file.name} exceeds maximum size`);
      }

      if (!this.config.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not allowed`);
      }

      // Process file (upload to storage)
      const url = await this.uploadFile(file);

      const attachment: CommentAttachment = {
        id: this.generateAttachmentId(),
        name: file.name,
        type: this.getAttachmentType(file.type),
        url,
        size: file.size,
        mimeType: file.type
      };

      attachments.push(attachment);
    }

    return attachments;
  }

  async deleteAttachments(attachments: CommentAttachment[]): Promise<void> {
    for (const attachment of attachments) {
      await this.deleteFile(attachment.url);
    }
  }

  private async uploadFile(file: File): Promise<string> {
    if (this.config.storage === 'local') {
      // For demo purposes, create a blob URL
      return URL.createObjectURL(file);
    } else {
      // Upload to cloud storage
      // Implementation would use actual cloud API
      return `https://storage.example.com/${this.generateAttachmentId()}`;
    }
  }

  private async deleteFile(url: string): Promise<void> {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    // For cloud storage, make DELETE request
  }

  private getAttachmentType(mimeType: string): CommentAttachment['type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('text/') || mimeType.includes('document')) return 'document';
    return 'document';
  }

  private generateAttachmentId(): string {
    return `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Notification manager for comment events
 */
class NotificationManager {
  private readonly config: CommentManagerConfig['notifications'];

  constructor(config: CommentManagerConfig['notifications']) {
    this.config = config;
  }

  async sendMentionNotification(_mention: MentionNotification): Promise<void> {
    // Send notification for user mention
    if (this.config.inApp) {
      // Create in-app notification
    }

    if (this.config.email) {
      // Send email notification
    }

    if (this.config.realtime) {
      // Send real-time notification via WebSocket
    }
  }

  async sendCommentNotification(_comment: TestComment): Promise<void> {
    // Send notification for new comment
    if (this.config.inApp) {
      // Create in-app notification
    }
  }

  async markNotificationsRead(_userId: string, _commentIds: string[]): Promise<void> {
    // Mark notifications as read for user
  }
}

/**
 * Mention parser for extracting user mentions from text
 */
class MentionParser {
  extractMentions(content: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      mentions.push(match[1]); // Extract username/ID
    }

    return [...new Set(mentions)]; // Remove duplicates
  }

  replaceMentionsWithLinks(content: string, users: CollaborationUser[]): string {
    const userMap = new Map(users.map(user => [user.name.toLowerCase(), user]));
    
    return content.replace(/@(\w+)/g, (match, username) => {
      const user = userMap.get(username.toLowerCase());
      if (user) {
        return `<span class="mention" data-user-id="${user.id}">@${user.name}</span>`;
      }
      return match;
    });
  }
}