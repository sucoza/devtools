/**
 * Team Management System Exports
 * Central exports for the team management and permissions functionality
 */

export * from './team-manager';

// Re-export types for convenience
export type {
  TeamCreationOptions,
  MemberInvitationOptions,
  TeamQueryOptions,
  TeamStats,
  TeamInvitation,
  PermissionTemplate,
  TeamManagerConfig
} from './team-manager';