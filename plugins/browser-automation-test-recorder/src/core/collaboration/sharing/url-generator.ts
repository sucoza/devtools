/**
 * URL Generator for Shareable Test Recordings
 * Handles creation of shareable URLs with various options and security features
 */

import type {
  SharedTestRecording,
  SharingSettings
} from '../../../types';

/**
 * URL generation options
 */
export interface UrlOptions {
  baseUrl?: string;
  includeToken?: boolean;
  expiration?: number;
  format?: 'viewer' | 'editor' | 'embed';
  theme?: 'light' | 'dark' | 'auto';
  autoplay?: boolean;
  hideControls?: boolean;
  startTime?: number;
  endTime?: number;
}

/**
 * Generated URL result
 */
export interface GeneratedUrl {
  url: string;
  embedCode?: string;
  qrCode?: string;
  shortUrl?: string;
  expiresAt?: number;
  token?: string;
}

/**
 * URL validation result
 */
export interface UrlValidationResult {
  valid: boolean;
  shareId?: string;
  token?: string;
  options?: UrlOptions;
  error?: string;
}

/**
 * URL generator for sharing test recordings
 */
export class UrlGenerator {
  private readonly defaultBaseUrl: string;
  private readonly secretKey: string;

  constructor(config: {
    baseUrl: string;
    secretKey: string;
  }) {
    this.defaultBaseUrl = config.baseUrl;
    this.secretKey = config.secretKey;
  }

  /**
   * Generate a shareable URL for a test recording
   */
  generateShareUrl(
    test: SharedTestRecording,
    options: UrlOptions = {}
  ): GeneratedUrl {
    const baseUrl = options.baseUrl || this.defaultBaseUrl;
    const shareId = test.shareId;
    
    // Build URL with parameters
    const url = new URL(`${baseUrl}/shared/${shareId}`);
    
    // Add format parameter
    if (options.format && options.format !== 'viewer') {
      url.searchParams.set('format', options.format);
    }
    
    // Add UI options
    if (options.theme && options.theme !== 'auto') {
      url.searchParams.set('theme', options.theme);
    }
    
    if (options.autoplay) {
      url.searchParams.set('autoplay', 'true');
    }
    
    if (options.hideControls) {
      url.searchParams.set('controls', 'false');
    }
    
    // Add time parameters
    if (options.startTime !== undefined) {
      url.searchParams.set('start', options.startTime.toString());
    }
    
    if (options.endTime !== undefined) {
      url.searchParams.set('end', options.endTime.toString());
    }
    
    // Generate access token if required
    let token: string | undefined;
    if (options.includeToken || test.sharing.requireLogin || test.sharing.password) {
      token = this.generateAccessToken(test, options);
      url.searchParams.set('token', token);
    }
    
    // Create result
    const result: GeneratedUrl = {
      url: url.toString(),
      token,
      expiresAt: options.expiration
    };
    
    // Generate embed code if requested
    if (options.format === 'embed') {
      result.embedCode = this.generateEmbedCode(url.toString(), {
        width: 800,
        height: 600,
        allowFullscreen: true
      });
    }
    
    // Generate QR code data URL
    result.qrCode = this.generateQrCodeDataUrl(url.toString());
    
    // Generate short URL if possible
    result.shortUrl = this.generateShortUrl(url.toString());
    
    return result;
  }

  /**
   * Generate a direct download URL
   */
  generateDownloadUrl(
    test: SharedTestRecording,
    format: 'json' | 'har' | 'playwright' | 'cypress' | 'selenium' = 'json'
  ): string {
    const baseUrl = this.defaultBaseUrl;
    const shareId = test.shareId;
    
    const url = new URL(`${baseUrl}/api/shared/${shareId}/download`);
    url.searchParams.set('format', format);
    
    // Add access token if required
    if (test.sharing.requireLogin) {
      const token = this.generateAccessToken(test, { format: 'viewer' });
      url.searchParams.set('token', token);
    }
    
    return url.toString();
  }

  /**
   * Generate an API access URL
   */
  generateApiUrl(
    test: SharedTestRecording,
    endpoint: 'metadata' | 'events' | 'comments' | 'reviews' = 'metadata'
  ): string {
    const baseUrl = this.defaultBaseUrl;
    const shareId = test.shareId;
    
    const url = new URL(`${baseUrl}/api/shared/${shareId}/${endpoint}`);
    
    // Add access token
    const token = this.generateAccessToken(test, { format: 'viewer' });
    url.searchParams.set('token', token);
    
    return url.toString();
  }

  /**
   * Generate embed code for iframes
   */
  generateEmbedCode(
    url: string,
    options: {
      width?: number;
      height?: number;
      allowFullscreen?: boolean;
      sandbox?: string[];
    } = {}
  ): string {
    const {
      width = 800,
      height = 600,
      allowFullscreen = true,
      sandbox = ['allow-scripts', 'allow-same-origin']
    } = options;

    const sandboxAttr = sandbox.length > 0 ? `sandbox="${sandbox.join(' ')}"` : '';
    const allowAttr = allowFullscreen ? 'allowfullscreen' : '';

    return `<iframe 
      src="${url}" 
      width="${width}" 
      height="${height}"
      ${sandboxAttr}
      ${allowAttr}
      frameborder="0"
      title="Shared Test Recording">
    </iframe>`;
  }

  /**
   * Validate and parse a share URL
   */
  validateShareUrl(url: string): UrlValidationResult {
    try {
      const parsed = new URL(url);
      
      // Check if it's a valid share URL
      const pathMatch = parsed.pathname.match(/^\/shared\/([a-zA-Z0-9]+)$/);
      if (!pathMatch) {
        return {
          valid: false,
          error: 'Invalid share URL format'
        };
      }
      
      const shareId = pathMatch[1];
      const searchParams = parsed.searchParams;
      
      // Extract options
      const options: UrlOptions = {
        format: (searchParams.get('format') as any) || 'viewer',
        theme: (searchParams.get('theme') as any) || 'auto',
        autoplay: searchParams.get('autoplay') === 'true',
        hideControls: searchParams.get('controls') === 'false'
      };
      
      // Extract time parameters
      const startTime = searchParams.get('start');
      if (startTime) {
        options.startTime = parseInt(startTime, 10);
      }
      
      const endTime = searchParams.get('end');
      if (endTime) {
        options.endTime = parseInt(endTime, 10);
      }
      
      // Extract token
      const token = searchParams.get('token');
      
      return {
        valid: true,
        shareId,
        token: token || undefined,
        options
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Generate access token for secure sharing
   */
  private generateAccessToken(
    test: SharedTestRecording,
    options: UrlOptions
  ): string {
    const payload = {
      testId: test.id,
      shareId: test.shareId,
      format: options.format || 'viewer',
      iat: Math.floor(Date.now() / 1000),
      exp: options.expiration || Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    // In production, use proper JWT library
    return this.simpleEncode(payload);
  }

  /**
   * Generate QR code data URL
   */
  private generateQrCodeDataUrl(url: string): string {
    // In production, use actual QR code library
    // For now, return placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" fill="black">QR Code</text>
      </svg>
    `)}`;
  }

  /**
   * Generate short URL
   */
  private generateShortUrl(url: string): string {
    // In production, integrate with URL shortener service
    const hash = this.simpleHash(url);
    return `${this.defaultBaseUrl}/s/${hash}`;
  }

  /**
   * Simple encoding for demonstration (use proper JWT in production)
   */
  private simpleEncode(payload: any): string {
    return btoa(JSON.stringify(payload));
  }

  /**
   * Simple hash function for demonstration
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substr(0, 8);
  }
}

/**
 * URL utilities for sharing
 */
export class ShareUrlUtils {
  /**
   * Extract share ID from URL
   */
  static extractShareId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/^\/shared\/([a-zA-Z0-9]+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is a valid share URL
   */
  static isShareUrl(url: string): boolean {
    return this.extractShareId(url) !== null;
  }

  /**
   * Create URL with updated parameters
   */
  static updateUrlParams(url: string, params: Record<string, string>): string {
    try {
      const parsed = new URL(url);
      Object.entries(params).forEach(([key, value]) => {
        parsed.searchParams.set(key, value);
      });
      return parsed.toString();
    } catch {
      return url;
    }
  }

  /**
   * Remove parameters from URL
   */
  static removeUrlParams(url: string, params: string[]): string {
    try {
      const parsed = new URL(url);
      params.forEach(param => {
        parsed.searchParams.delete(param);
      });
      return parsed.toString();
    } catch {
      return url;
    }
  }

  /**
   * Get parameter from URL
   */
  static getUrlParam(url: string, param: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get(param);
    } catch {
      return null;
    }
  }

  /**
   * Generate preview URL for social media
   */
  static generatePreviewUrl(shareUrl: string): string {
    return ShareUrlUtils.updateUrlParams(shareUrl, {
      format: 'embed',
      hideControls: 'true',
      autoplay: 'false'
    });
  }
}