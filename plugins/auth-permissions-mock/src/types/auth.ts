export interface User {
  id?: string;
  email?: string;
  name?: string;
  avatar?: string;
  [key: string]: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  roles: string[];
  permissions: string[];
  expires: number | null;
}

export interface JWTPayload {
  sub?: string;
  email?: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
  [key: string]: any;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
}

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
  responseType: 'code' | 'token' | 'id_token';
  state?: string;
  nonce?: string;
}

export interface OAuthFlow {
  id: string;
  name: string;
  config: OAuthConfig;
  isActive: boolean;
  authUrl?: string;
  tokenUrl?: string;
}

export interface StorageConfig {
  type: 'localStorage' | 'sessionStorage' | 'cookies';
  key: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

export interface MockScenario {
  id: string;
  name: string;
  description?: string;
  authState: AuthState;
  storageConfig?: StorageConfig;
  autoApply?: boolean;
}

export interface StorageOperation {
  timestamp: number;
  operation: 'set' | 'remove' | 'event';
  key: string;
  value: string | null;
  storage: 'localStorage' | 'sessionStorage' | 'event';
}