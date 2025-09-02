/**
 * Collaboration Manager
 * Main orchestrator for all collaboration features including sharing, library, comments, reviews, and team management
 */

import type {
  CollaborationUser,
  CollaborationTeam,
  SharedTestRecording,
  TestLibrary,
  TestComment,
  TestReview,
  RecordedEvent,
  CollaborationNotification,
  ActivityFeedItem
} from '../../types';

import { SharingManager, type SharingConfig } from './sharing';
import { LibraryManager, type LibraryConfig } from './library';
import { CommentManager, type CommentManagerConfig } from './comments';
import { ReviewManager, type ReviewManagerConfig } from './review';
import { TeamManager, type TeamManagerConfig } from './team';

/**
 * Collaboration system configuration
 */
export interface CollaborationConfig {
  sharing: SharingConfig;
  library: LibraryConfig;
  comments: CommentManagerConfig;
  review: ReviewManagerConfig;
  team: TeamManagerConfig;
  sync: {
    enabled: boolean;
    interval: number; // milliseconds
    endpoint?: string;
    apiKey?: string;
  };
  notifications: {
    realtime: boolean;
    endpoint?: string;
    apiKey?: string;
  };
}

/**
 * Collaboration system initialization options
 */
export interface CollaborationInitOptions {
  user: CollaborationUser;
  teamId?: string;
  enableRealtime?: boolean;
  enableNotifications?: boolean;
}

/**
 * Collaboration system status
 */
export interface CollaborationStatus {
  initialized: boolean;
  connected: boolean;
  syncing: boolean;
  currentUser: CollaborationUser | null;
  currentTeam: CollaborationTeam | null;
  lastSync: number;
  pendingOperations: number;
}

/**
 * Main Collaboration Manager that orchestrates all collaboration features
 */
export class CollaborationManager {
  // Core managers
  private readonly sharingManager: SharingManager;
  private readonly libraryManager: LibraryManager;
  private readonly commentManager: CommentManager;
  private readonly reviewManager: ReviewManager;
  private readonly teamManager: TeamManager;

  // System state
  private currentUser: CollaborationUser | null = null;
  private currentTeam: CollaborationTeam | null = null;
  private initialized = false;
  private connected = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private notificationHandlers = new Map<string, ((notification: CollaborationNotification) => void)[]>();

  constructor(private readonly config: CollaborationConfig) {
    // Initialize managers
    this.sharingManager = new SharingManager(config.sharing);
    this.libraryManager = new LibraryManager(config.library);
    this.commentManager = new CommentManager(config.comments);
    this.reviewManager = new ReviewManager(config.review);
    this.teamManager = new TeamManager(config.team);
  }

  /**
   * Initialize collaboration system
   */
  async initialize(options: CollaborationInitOptions): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.currentUser = options.user;

    // Load or create team
    if (options.teamId) {
      this.currentTeam = await this.teamManager.getTeam(options.teamId);
      if (!this.currentTeam) {
        throw new Error(`Team not found: ${options.teamId}`);
      }
    }

    // Start sync if enabled
    if (this.config.sync.enabled) {
      await this.startSync();
    }

    // Connect to real-time notifications if enabled
    if (options.enableNotifications && this.config.notifications.realtime) {
      await this.connectNotifications();
    }

    this.initialized = true;
    this.connected = true;

    // // console.log('Collaboration system initialized successfully');
  }

  /**
   * Shutdown collaboration system
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // Stop sync
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Disconnect notifications
    await this.disconnectNotifications();

    this.initialized = false;
    this.connected = false;
    this.currentUser = null;
    this.currentTeam = null;

    // // console.log('Collaboration system shutdown');
  }

  /**
   * Get current collaboration status
   */
  getStatus(): CollaborationStatus {
    return {
      initialized: this.initialized,
      connected: this.connected,
      syncing: this.syncInterval !== null,
      currentUser: this.currentUser,
      currentTeam: this.currentTeam,
      lastSync: Date.now(), // Would be actual last sync time
      pendingOperations: 0 // Would be actual pending count
    };
  }

  /**
   * Sharing operations
   */
  async shareTest(
    events: RecordedEvent[],
    options: {
      name: string;
      description?: string;
      visibility: 'private' | 'team' | 'public';
      allowFork?: boolean;
      allowEdit?: boolean;
      allowComment?: boolean;
      tags?: string[];
    }
  ): Promise<SharedTestRecording> {
    this.ensureInitialized();

    return this.sharingManager.createSharedTest(events, {
      name: options.name,
      description: options.description,
      visibility: options.visibility,
      allowFork: options.allowFork ?? true,
      allowEdit: options.allowEdit ?? false,
      allowComment: options.allowComment ?? true,
      allowDownload: true,
      tags: options.tags
    }, this.currentUser!);
  }

  async getSharedTest(testId: string): Promise<SharedTestRecording | null> {
    return this.sharingManager.getSharedTest(testId);
  }

  async forkSharedTest(
    testId: string,
    name: string,
    description?: string
  ): Promise<SharedTestRecording> {
    this.ensureInitialized();

    return this.sharingManager.forkSharedTest(testId, {
      name,
      description,
      visibility: 'private'
    }, this.currentUser!);
  }

  /**
   * Library operations
   */
  async getTeamLibrary(): Promise<TestLibrary> {
    this.ensureInitialized();

    if (!this.currentTeam) {
      throw new Error('No team selected');
    }

    return this.libraryManager.getLibrary(this.currentTeam.id);
  }

  async publishToLibrary(
    sharedTest: SharedTestRecording,
    options: {
      category: string;
      tags: string[];
      description?: string;
      visibility: 'public' | 'team' | 'private';
      status?: 'draft' | 'review' | 'published';
    }
  ): Promise<void> {
    this.ensureInitialized();

    if (!this.currentTeam) {
      throw new Error('No team selected');
    }

    const library = await this.getTeamLibrary();
    
    await this.libraryManager.publishTest(library.id, sharedTest, {
      status: options.status || 'draft',
      category: options.category,
      tags: options.tags,
      description: options.description,
      visibility: options.visibility
    }, this.currentUser!);
  }

  async searchLibrary(query: string, filters?: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
  }) {
    this.ensureInitialized();

    if (!this.currentTeam) {
      throw new Error('No team selected');
    }

    const library = await this.getTeamLibrary();

    return this.libraryManager.searchTests(library.id, {
      query,
      categories: filters?.categories,
      tags: filters?.tags,
      authors: filters?.authors,
      sortBy: 'popularity',
      sortOrder: 'desc'
    });
  }

  /**
   * Comment operations
   */
  async addComment(
    testId: string,
    content: string,
    options?: {
      eventId?: string;
      parentId?: string;
      position?: { x: number; y: number };
      mentions?: string[];
    }
  ): Promise<TestComment> {
    this.ensureInitialized();

    return this.commentManager.createComment({
      testId,
      content,
      eventId: options?.eventId,
      parentId: options?.parentId,
      position: options?.position ? {
        x: options.position.x,
        y: options.position.y
      } : undefined,
      mentions: options?.mentions
    }, this.currentUser!);
  }

  async getTestComments(testId: string) {
    return this.commentManager.getTestComments(testId);
  }

  async replyToComment(
    parentCommentId: string,
    content: string,
    mentions?: string[]
  ): Promise<TestComment> {
    this.ensureInitialized();

    const parentComment = await this.commentManager.getComment(parentCommentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    return this.commentManager.createComment({
      testId: parentComment.testId,
      content,
      parentId: parentCommentId,
      mentions
    }, this.currentUser!);
  }

  async addReaction(commentId: string, emoji: string): Promise<void> {
    this.ensureInitialized();
    await this.commentManager.addReaction(commentId, emoji, this.currentUser!);
  }

  /**
   * Review operations
   */
  async requestReview(
    testId: string,
    reviewers: string[],
    options?: {
      dueDate?: number;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      message?: string;
    }
  ): Promise<TestReview[]> {
    this.ensureInitialized();

    return this.reviewManager.requestReview({
      testId,
      reviewers,
      criteria: {
        functionalCorrectness: true,
        selectorReliability: true,
        performanceImpact: false,
        codeQuality: true,
        documentation: true,
        browserCompatibility: false,
        custom: {}
      },
      dueDate: options?.dueDate,
      priority: options?.priority || 'medium',
      message: options?.message
    }, this.currentUser!);
  }

  async completeReview(
    reviewId: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    comments: string[],
    changes?: Array<{
      eventId: string;
      type: 'modify' | 'remove' | 'add';
      description: string;
    }>
  ): Promise<TestReview> {
    this.ensureInitialized();

    return this.reviewManager.completeReview(reviewId, {
      status: decision,
      comments,
      checklist: [], // Would be populated from UI
      changes: changes?.map(change => ({
        eventId: change.eventId,
        type: change.type,
        description: change.description
      }))
    }, this.currentUser!);
  }

  async getPendingReviews(): Promise<TestReview[]> {
    this.ensureInitialized();
    return this.reviewManager.getPendingReviews(this.currentUser!.id);
  }

  /**
   * Team operations
   */
  async createTeam(
    name: string,
    description?: string,
    initialMembers?: string[]
  ): Promise<CollaborationTeam> {
    this.ensureInitialized();

    const team = await this.teamManager.createTeam({
      name,
      description,
      initialMembers
    }, this.currentUser!);

    this.currentTeam = team;
    return team;
  }

  async inviteMembers(
    emails: string[],
    role: 'viewer' | 'editor' | 'reviewer' | 'admin',
    message?: string
  ) {
    this.ensureInitialized();

    if (!this.currentTeam) {
      throw new Error('No team selected');
    }

    return this.teamManager.inviteMembers(this.currentTeam.id, {
      emails,
      role,
      message
    }, this.currentUser!);
  }

  async getUserTeams(): Promise<CollaborationTeam[]> {
    this.ensureInitialized();
    return this.teamManager.getUserTeams(this.currentUser!.id);
  }

  async switchTeam(teamId: string): Promise<CollaborationTeam> {
    this.ensureInitialized();

    const team = await this.teamManager.getTeam(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    // Check if user is a member
    const isMember = team.members.some(m => m.id === this.currentUser!.id);
    if (!isMember) {
      throw new Error('User is not a member of this team');
    }

    this.currentTeam = team;
    return team;
  }

  /**
   * Activity and notifications
   */
  async getActivityFeed(_limit = 50): Promise<ActivityFeedItem[]> {
    // Implementation would fetch recent activity
    return [];
  }

  async getNotifications(_unreadOnly = false): Promise<CollaborationNotification[]> {
    // Implementation would fetch notifications
    return [];
  }

  async markNotificationRead(_notificationId: string): Promise<void> {
    // Implementation would mark notification as read
  }

  /**
   * Event handlers
   */
  onNotification(
    type: string,
    handler: (notification: CollaborationNotification) => void
  ): () => void {
    if (!this.notificationHandlers.has(type)) {
      this.notificationHandlers.set(type, []);
    }
    
    this.notificationHandlers.get(type)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.notificationHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Utility methods
   */
  async exportUserData(): Promise<{
    user: CollaborationUser;
    teams: CollaborationTeam[];
    sharedTests: SharedTestRecording[];
    comments: TestComment[];
    reviews: TestReview[];
  }> {
    this.ensureInitialized();

    const teams = await this.getUserTeams();
    const sharedTests = await this.sharingManager.listSharedTests({
      author: this.currentUser!.id
    });

    // Get user's comments and reviews (implementation would query from stores)
    const comments: TestComment[] = [];
    const reviews: TestReview[] = [];

    return {
      user: this.currentUser!,
      teams,
      sharedTests,
      comments,
      reviews
    };
  }

  async getCollaborationStats() {
    this.ensureInitialized();

    const stats = {
      testsShared: 0,
      testsForked: 0,
      commentsPosted: 0,
      reviewsCompleted: 0,
      teamsJoined: 0
    };

    if (this.currentTeam) {
      const teamStats = await this.teamManager.getTeamStats(this.currentTeam.id);
      Object.assign(stats, teamStats);
    }

    return stats;
  }

  /**
   * Private methods
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Collaboration system not initialized');
    }
  }

  private async startSync(): Promise<void> {
    if (!this.config.sync.enabled || this.syncInterval) {
      return;
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.performSync();
      } catch {
        // // console.error('Sync error:', err);
      }
    }, this.config.sync.interval);

    // Perform initial sync
    await this.performSync();
  }

  private async performSync(): Promise<void> {
    // Implementation would sync with remote server
    // // console.log('Performing collaboration sync...');
  }

  private async connectNotifications(): Promise<void> {
    // Implementation would connect to real-time notification service
    // // console.log('Connecting to notifications...');
  }

  private async disconnectNotifications(): Promise<void> {
    // Implementation would disconnect from notification service
    // // console.log('Disconnecting from notifications...');
  }

  private emitNotification(notification: CollaborationNotification): void {
    const handlers = this.notificationHandlers.get(notification.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(notification);
        } catch {
          // // console.error('Error in notification handler:', err);
        }
      });
    }
  }
}

/**
 * Create default collaboration configuration
 */
export function createDefaultCollaborationConfig(
  baseUrl?: string,
  apiKey?: string
): CollaborationConfig {
  return {
    sharing: {
      baseUrl: baseUrl || 'https://api.example.com',
      apiKey: apiKey || '',
      storage: {
        type: 'localstorage',
        name: 'collaboration-sharing'
      }
    },
    library: {
      storage: {
        type: 'localstorage',
        endpoint: baseUrl,
        apiKey
      },
      quality: {
        enabled: true,
        thresholds: {
          reliabilityScore: 70,
          maintainabilityScore: 60,
          complexityScore: 80,
          documentationScore: 50,
          testCoverage: 70,
          browserCompatibility: 80,
          performanceScore: 60,
          overallScore: 70
        }
      },
      search: {
        indexing: true,
        fuzzySearch: true
      }
    },
    comments: {
      storage: {
        type: 'localstorage',
        endpoint: baseUrl,
        apiKey
      },
      attachments: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'],
        storage: 'local'
      },
      notifications: {
        realtime: false,
        email: true,
        inApp: true
      }
    },
    review: {
      storage: {
        type: 'localstorage',
        endpoint: baseUrl,
        apiKey
      },
      notifications: {
        email: true,
        inApp: true,
        slack: false
      },
      workflow: {
        requireReview: false,
        minReviewers: 1,
        maxReviewers: 5,
        autoAssign: false,
        consensusRequired: false,
        allowSelfReview: false,
        timeoutDays: 7,
        escalationDays: 14,
        criteria: {
          functionalCorrectness: true,
          selectorReliability: true,
          performanceImpact: false,
          codeQuality: true,
          documentation: true,
          browserCompatibility: false,
          custom: {}
        }
      },
      assignment: {
        autoAssign: false,
        skillMatching: false,
        workloadBalancing: false
      }
    },
    team: {
      storage: {
        type: 'localstorage',
        endpoint: baseUrl,
        apiKey
      },
      users: {
        storage: 'local',
        endpoint: baseUrl,
        apiKey
      },
      invitations: {
        emailProvider: 'sendgrid',
        templates: {
          invitation: 'team-invitation-template'
        }
      },
      permissions: {
        templates: []
      },
      activity: {
        enabled: true,
        retention: 90 // days
      },
      notifications: {
        email: true,
        inApp: true,
        realtime: false
      }
    },
    sync: {
      enabled: false,
      interval: 30000, // 30 seconds
      endpoint: baseUrl,
      apiKey
    },
    notifications: {
      realtime: false,
      endpoint: baseUrl,
      apiKey
    }
  };
}