/**
 * Review Workflow Manager
 * Handles peer review process for test recordings with approval workflows
 */

import type {
  TestReview,
  ReviewStatus,
  ReviewCriteria,
  ReviewChecklistItem,
  ReviewChange,
  SharedTestRecording,
  CollaborationUser,
  CollaborationNotification as _CollaborationNotification
} from '../../../types';

/**
 * Review request options
 */
export interface ReviewRequestOptions {
  testId: string;
  reviewers: string[]; // User IDs
  criteria: ReviewCriteria;
  checklist?: Omit<ReviewChecklistItem, 'id' | 'checked' | 'comments'>[];
  dueDate?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message?: string;
  autoAssign?: boolean; // Auto-assign based on expertise
}

/**
 * Review completion options
 */
export interface ReviewCompletionOptions {
  status: ReviewStatus;
  comments: string[];
  checklist: ReviewChecklistItem[];
  changes?: Omit<ReviewChange, 'id' | 'applied'>[];
  requireChanges?: boolean;
  overallScore?: number; // 0-100
}

/**
 * Review assignment options
 */
export interface ReviewAssignmentOptions {
  reviewerId: string;
  criteria?: Partial<ReviewCriteria>;
  dueDate?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  autoAssign?: boolean;
}

/**
 * Review query options
 */
export interface ReviewQueryOptions {
  testId?: string;
  reviewerId?: string;
  assignerId?: string;
  status?: ReviewStatus[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  dateRange?: [number, number];
  overdue?: boolean;
  sortBy?: 'created' | 'updated' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Review statistics
 */
export interface ReviewStats {
  total: number;
  byStatus: Record<ReviewStatus, number>;
  byPriority: Record<string, number>;
  averageTime: number; // Average review time in ms
  overdue: number;
  thisMonth: number;
  completionRate: number;
}

/**
 * Review workflow configuration
 */
export interface ReviewWorkflowConfig {
  requireReview: boolean;
  minReviewers: number;
  maxReviewers: number;
  autoAssign: boolean;
  consensusRequired: boolean; // All reviewers must approve
  allowSelfReview: boolean;
  timeoutDays: number; // Auto-approve after N days
  escalationDays: number; // Escalate to admin after N days
  criteria: ReviewCriteria;
}

/**
 * Review Manager for handling test recording reviews
 */
export class ReviewManager {
  private readonly storage: ReviewStorage;
  private readonly notificationManager: ReviewNotificationManager;
  private readonly workflowEngine: ReviewWorkflowEngine;
  private readonly assignmentEngine: ReviewAssignmentEngine;

  constructor(config: ReviewManagerConfig) {
    this.storage = new ReviewStorage(config.storage);
    this.notificationManager = new ReviewNotificationManager(config.notifications);
    this.workflowEngine = new ReviewWorkflowEngine(config.workflow);
    this.assignmentEngine = new ReviewAssignmentEngine(config.assignment);
  }

  /**
   * Request review for a test recording
   */
  async requestReview(
    options: ReviewRequestOptions,
    requester: CollaborationUser
  ): Promise<TestReview[]> {
    // Validate test exists
    const test = await this.getTestRecording(options.testId);
    if (!test) {
      throw new Error(`Test not found: ${options.testId}`);
    }

    // Auto-assign reviewers if requested
    let reviewers = options.reviewers;
    if (options.autoAssign) {
      reviewers = await this.assignmentEngine.autoAssignReviewers(
        test,
        options.reviewers,
        requester
      );
    }

    // Create review requests
    const reviews: TestReview[] = [];
    for (const reviewerId of reviewers) {
      const review = await this.createReview({
        testId: options.testId,
        reviewerId,
        criteria: options.criteria,
        checklist: options.checklist || [],
        dueDate: options.dueDate,
        priority: options.priority,
        assignedBy: requester.id
      });

      reviews.push(review);
    }

    // Send notifications
    for (const review of reviews) {
      await this.notificationManager.sendReviewRequest(review, options.message);
    }

    return reviews;
  }

  /**
   * Assign review to specific reviewer
   */
  async assignReview(
    testId: string,
    options: ReviewAssignmentOptions,
    assigner: CollaborationUser
  ): Promise<TestReview> {
    // Check if reviewer is available
    const reviewer = await this.getUser(options.reviewerId);
    if (!reviewer) {
      throw new Error(`Reviewer not found: ${options.reviewerId}`);
    }

    // Create review
    const review = await this.createReview({
      testId,
      reviewerId: options.reviewerId,
      criteria: { ...this.workflowEngine.getDefaultCriteria(), ...options.criteria },
      checklist: [],
      dueDate: options.dueDate,
      priority: options.priority || 'medium',
      assignedBy: assigner.id
    });

    // Send notification
    await this.notificationManager.sendReviewAssignment(review);

    return review;
  }

  /**
   * Complete a review
   */
  async completeReview(
    reviewId: string,
    options: ReviewCompletionOptions,
    reviewer: CollaborationUser
  ): Promise<TestReview> {
    const review = await this.storage.getReview(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    // Check permissions
    if (review.reviewer.id !== reviewer.id) {
      throw new Error('Only assigned reviewer can complete this review');
    }

    // Validate completion
    if (options.status !== 'pending' && options.status !== 'in_progress') {
      await this.validateReviewCompletion(review, options);
    }

    // Process changes if provided
    const changes: ReviewChange[] = [];
    if (options.changes) {
      for (const change of options.changes) {
        changes.push({
          ...change,
          id: this.generateChangeId(),
          applied: false
        });
      }
    }

    // Update review
    const completedReview: TestReview = {
      ...review,
      status: options.status,
      completedAt: Date.now(),
      comments: options.comments,
      checklist: options.checklist,
      changes
    };

    await this.storage.saveReview(completedReview);

    // Handle workflow progression
    await this.workflowEngine.handleReviewCompletion(completedReview);

    // Send notifications
    await this.notificationManager.sendReviewCompletion(completedReview);

    return completedReview;
  }

  /**
   * Get review by ID
   */
  async getReview(reviewId: string): Promise<TestReview | null> {
    return this.storage.getReview(reviewId);
  }

  /**
   * Query reviews with filters
   */
  async queryReviews(options: ReviewQueryOptions): Promise<{
    reviews: TestReview[];
    total: number;
  }> {
    const reviews = await this.storage.queryReviews(options);
    const total = await this.storage.countReviews(options);

    return { reviews, total };
  }

  /**
   * Get reviews for a test
   */
  async getTestReviews(testId: string): Promise<TestReview[]> {
    return this.storage.getReviewsByTest(testId);
  }

  /**
   * Get reviews assigned to user
   */
  async getUserReviews(
    userId: string,
    status?: ReviewStatus[]
  ): Promise<TestReview[]> {
    return this.storage.getUserReviews(userId, status);
  }

  /**
   * Get pending reviews for user
   */
  async getPendingReviews(userId: string): Promise<TestReview[]> {
    return this.getUserReviews(userId, ['pending', 'in_progress']);
  }

  /**
   * Get overdue reviews
   */
  async getOverdueReviews(userId?: string): Promise<TestReview[]> {
    const now = Date.now();
    const allReviews = userId 
      ? await this.getUserReviews(userId, ['pending', 'in_progress'])
      : await this.storage.queryReviews({ status: ['pending', 'in_progress'] });

    return allReviews.filter(review => {
      const dueDate = this.calculateDueDate(review);
      return dueDate && now > dueDate;
    });
  }

  /**
   * Apply review changes to test
   */
  async applyReviewChanges(
    reviewId: string,
    changeIds: string[],
    applier: CollaborationUser
  ): Promise<TestReview> {
    const review = await this.storage.getReview(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    // Check permissions
    const test = await this.getTestRecording(review.testId);
    if (!test || !this.canApplyChanges(test, applier)) {
      throw new Error('Insufficient permissions to apply changes');
    }

    // Apply changes
    for (const changeId of changeIds) {
      const change = review.changes.find(c => c.id === changeId);
      if (change && !change.applied) {
        await this.applyChange(test, change);
        change.applied = true;
      }
    }

    await this.storage.saveReview(review);

    // Notify reviewer that changes were applied
    await this.notificationManager.sendChangesApplied(review, changeIds);

    return review;
  }

  /**
   * Reject review changes
   */
  async rejectReviewChanges(
    reviewId: string,
    changeIds: string[],
    reason: string,
    rejector: CollaborationUser
  ): Promise<TestReview> {
    const review = await this.storage.getReview(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    // Mark changes as rejected (add metadata)
    review.changes.forEach(change => {
      if (changeIds.includes(change.id)) {
        (change as any).rejected = true;
        (change as any).rejectionReason = reason;
        (change as any).rejectedBy = rejector.id;
        (change as any).rejectedAt = Date.now();
      }
    });

    await this.storage.saveReview(review);

    // Notify reviewer
    await this.notificationManager.sendChangesRejected(review, changeIds, reason);

    return review;
  }

  /**
   * Cancel review
   */
  async cancelReview(
    reviewId: string,
    reason: string,
    canceller: CollaborationUser
  ): Promise<void> {
    const review = await this.storage.getReview(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    // Check permissions
    if (review.assignedBy !== canceller.id && !canceller.permissions.canDelete) {
      throw new Error('Insufficient permissions to cancel review');
    }

    // Delete review
    await this.storage.deleteReview(reviewId);

    // Notify reviewer
    await this.notificationManager.sendReviewCancellation(review, reason);
  }

  /**
   * Get review statistics
   */
  async getReviewStats(options: {
    userId?: string;
    teamId?: string;
    dateRange?: [number, number];
  } = {}): Promise<ReviewStats> {
    const reviews = await this.storage.getReviewsForStats(options);
    
    const byStatus: Record<ReviewStatus, number> = {
      pending: 0,
      in_progress: 0,
      approved: 0,
      rejected: 0,
      changes_requested: 0
    };

    const byPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    let totalTime = 0;
    let completedCount = 0;
    let overdueCount = 0;
    const now = Date.now();

    reviews.forEach(review => {
      byStatus[review.status]++;
      
      const priority = (review as any).priority || 'medium';
      byPriority[priority]++;

      if (review.completedAt && review.requestedAt) {
        totalTime += review.completedAt - review.requestedAt;
        completedCount++;
      }

      const dueDate = this.calculateDueDate(review);
      if (dueDate && now > dueDate && 
          (review.status === 'pending' || review.status === 'in_progress')) {
        overdueCount++;
      }
    });

    const averageTime = completedCount > 0 ? totalTime / completedCount : 0;
    const completionRate = reviews.length > 0 ? 
      (completedCount / reviews.length) * 100 : 0;

    // Count reviews from this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const thisMonth = reviews.filter(r => 
      r.requestedAt >= monthStart.getTime()
    ).length;

    return {
      total: reviews.length,
      byStatus,
      byPriority,
      averageTime,
      overdue: overdueCount,
      thisMonth,
      completionRate
    };
  }

  /**
   * Check review consensus for test
   */
  async checkReviewConsensus(testId: string): Promise<{
    consensusReached: boolean;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    totalReviews: number;
    canPublish: boolean;
  }> {
    const reviews = await this.getTestReviews(testId);
    const config = this.workflowEngine.getConfig();
    
    const approvedCount = reviews.filter(r => r.status === 'approved').length;
    const rejectedCount = reviews.filter(r => r.status === 'rejected').length;
    const pendingCount = reviews.filter(r => 
      r.status === 'pending' || r.status === 'in_progress'
    ).length;

    let consensusReached = false;
    let canPublish = false;

    if (config.consensusRequired) {
      // All reviews must be approved
      consensusReached = reviews.length > 0 && approvedCount === reviews.length;
      canPublish = consensusReached;
    } else {
      // Majority approval or minimum reviewers
      const minApprovals = Math.max(1, Math.ceil(reviews.length / 2));
      consensusReached = approvedCount >= minApprovals && rejectedCount === 0;
      canPublish = approvedCount >= config.minReviewers && rejectedCount === 0;
    }

    return {
      consensusReached,
      approvedCount,
      rejectedCount,
      pendingCount,
      totalReviews: reviews.length,
      canPublish
    };
  }

  /**
   * Private helper methods
   */
  private async createReview(options: {
    testId: string;
    reviewerId: string;
    criteria: ReviewCriteria;
    checklist: Omit<ReviewChecklistItem, 'id' | 'checked' | 'comments'>[];
    dueDate?: number;
    priority?: string;
    assignedBy: string;
  }): Promise<TestReview> {
    const reviewer = await this.getUser(options.reviewerId);
    if (!reviewer) {
      throw new Error(`Reviewer not found: ${options.reviewerId}`);
    }

    const checklist: ReviewChecklistItem[] = options.checklist.map(item => ({
      ...item,
      id: this.generateChecklistId(),
      checked: false,
      comments: undefined
    }));

    const review: TestReview = {
      id: this.generateReviewId(),
      testId: options.testId,
      reviewer,
      status: 'pending',
      requestedAt: Date.now(),
      completedAt: undefined,
      comments: [],
      criteria: options.criteria,
      checklist,
      changes: [],
      assignedBy: options.assignedBy
    };

    await this.storage.saveReview(review);
    return review;
  }

  private async validateReviewCompletion(
    review: TestReview,
    options: ReviewCompletionOptions
  ): Promise<void> {
    // Check required criteria
    const requiredCriteria = Object.entries(review.criteria)
      .filter(([_, required]) => required)
      .map(([criterion]) => criterion);

    if (requiredCriteria.length > 0 && options.comments.length === 0) {
      throw new Error('Comments required for review completion');
    }

    // Check required checklist items
    const requiredItems = options.checklist.filter(item => item.required);
    const uncheckedRequired = requiredItems.filter(item => !item.checked);
    
    if (uncheckedRequired.length > 0) {
      throw new Error(`Required checklist items not completed: ${
        uncheckedRequired.map(item => item.description).join(', ')
      }`);
    }
  }

  private async applyChange(
    test: SharedTestRecording,
    change: ReviewChange
  ): Promise<void> {
    // Implementation would apply the change to the test recording
    // This is a simplified version - real implementation would modify events
    // console.log('Applying change:', change);
  }

  private canApplyChanges(
    test: SharedTestRecording,
    user: CollaborationUser
  ): boolean {
    return test.createdBy === user.id || 
           user.permissions.canEdit ||
           test.sharing.permissions[user.id]?.canEdit === true;
  }

  private calculateDueDate(review: TestReview): number | null {
    // Implementation would calculate due date based on review priority and config
    const config = this.workflowEngine.getConfig();
    return review.requestedAt + (config.timeoutDays * 24 * 60 * 60 * 1000);
  }

  private async getTestRecording(testId: string): Promise<SharedTestRecording | null> {
    // Implementation would retrieve test from sharing manager
    return null;
  }

  private async getUser(userId: string): Promise<CollaborationUser | null> {
    // Implementation would retrieve user from team manager
    return null;
  }

  private generateReviewId(): string {
    return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecklistId(): string {
    return `checklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Configuration interfaces
 */
export interface ReviewManagerConfig {
  storage: {
    type: 'indexeddb' | 'localstorage' | 'cloud';
    endpoint?: string;
    apiKey?: string;
  };
  notifications: {
    email: boolean;
    inApp: boolean;
    slack: boolean;
  };
  workflow: ReviewWorkflowConfig;
  assignment: {
    autoAssign: boolean;
    skillMatching: boolean;
    workloadBalancing: boolean;
  };
}

/**
 * Review storage implementation
 */
class ReviewStorage {
  private readonly config: ReviewManagerConfig['storage'];

  constructor(config: ReviewManagerConfig['storage']) {
    this.config = config;
  }

  async saveReview(review: TestReview): Promise<void> {
    if (this.config.type === 'localstorage') {
      localStorage.setItem(`review_${review.id}`, JSON.stringify(review));
    }
  }

  async getReview(reviewId: string): Promise<TestReview | null> {
    if (this.config.type === 'localstorage') {
      const data = localStorage.getItem(`review_${reviewId}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async deleteReview(reviewId: string): Promise<void> {
    if (this.config.type === 'localstorage') {
      localStorage.removeItem(`review_${reviewId}`);
    }
  }

  async queryReviews(options: ReviewQueryOptions): Promise<TestReview[]> {
    const reviews: TestReview[] = [];
    
    if (this.config.type === 'localstorage') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('review_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const review = JSON.parse(data);
            
            // Apply filters
            if (options.testId && review.testId !== options.testId) continue;
            if (options.reviewerId && review.reviewer.id !== options.reviewerId) continue;
            if (options.assignerId && review.assignedBy !== options.assignerId) continue;
            if (options.status && !options.status.includes(review.status)) continue;
            
            reviews.push(review);
          }
        }
      }
    }
    
    // Apply sorting and pagination
    return this.sortAndPaginate(reviews, options);
  }

  async countReviews(options: ReviewQueryOptions): Promise<number> {
    const reviews = await this.queryReviews({ ...options, limit: undefined, offset: undefined });
    return reviews.length;
  }

  async getReviewsByTest(testId: string): Promise<TestReview[]> {
    return this.queryReviews({ testId });
  }

  async getUserReviews(userId: string, status?: ReviewStatus[]): Promise<TestReview[]> {
    return this.queryReviews({ reviewerId: userId, status });
  }

  async getReviewsForStats(options: {
    userId?: string;
    teamId?: string;
    dateRange?: [number, number];
  }): Promise<TestReview[]> {
    const queryOptions: ReviewQueryOptions = {};
    
    if (options.userId) {
      queryOptions.reviewerId = options.userId;
    }
    
    if (options.dateRange) {
      queryOptions.dateRange = options.dateRange;
    }
    
    return this.queryReviews(queryOptions);
  }

  private sortAndPaginate(reviews: TestReview[], options: ReviewQueryOptions): TestReview[] {
    // Sort reviews
    if (options.sortBy) {
      reviews.sort((a, b) => {
        let valueA: any, valueB: any;
        
        switch (options.sortBy) {
          case 'created':
            valueA = a.requestedAt;
            valueB = b.requestedAt;
            break;
          case 'updated':
            valueA = a.completedAt || a.requestedAt;
            valueB = b.completedAt || b.requestedAt;
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
    return reviews.slice(offset, offset + limit);
  }
}

/**
 * Notification manager for reviews
 */
class ReviewNotificationManager {
  private readonly config: ReviewManagerConfig['notifications'];

  constructor(config: ReviewManagerConfig['notifications']) {
    this.config = config;
  }

  async sendReviewRequest(review: TestReview, message?: string): Promise<void> {
    // Send review request notification
  }

  async sendReviewAssignment(review: TestReview): Promise<void> {
    // Send review assignment notification
  }

  async sendReviewCompletion(review: TestReview): Promise<void> {
    // Send review completion notification
  }

  async sendChangesApplied(review: TestReview, changeIds: string[]): Promise<void> {
    // Send changes applied notification
  }

  async sendChangesRejected(review: TestReview, changeIds: string[], reason: string): Promise<void> {
    // Send changes rejected notification
  }

  async sendReviewCancellation(review: TestReview, reason: string): Promise<void> {
    // Send review cancellation notification
  }
}

/**
 * Review workflow engine
 */
class ReviewWorkflowEngine {
  private readonly config: ReviewWorkflowConfig;

  constructor(config: ReviewWorkflowConfig) {
    this.config = config;
  }

  getConfig(): ReviewWorkflowConfig {
    return this.config;
  }

  getDefaultCriteria(): ReviewCriteria {
    return this.config.criteria;
  }

  async handleReviewCompletion(review: TestReview): Promise<void> {
    // Handle workflow progression after review completion
    // This could trigger auto-publishing, notifications, etc.
  }
}

/**
 * Review assignment engine
 */
class ReviewAssignmentEngine {
  private readonly config: ReviewManagerConfig['assignment'];

  constructor(config: ReviewManagerConfig['assignment']) {
    this.config = config;
  }

  async autoAssignReviewers(
    test: SharedTestRecording,
    preferredReviewers: string[],
    requester: CollaborationUser
  ): Promise<string[]> {
    // Implementation would use skill matching and workload balancing
    // For now, return preferred reviewers
    return preferredReviewers;
  }
}