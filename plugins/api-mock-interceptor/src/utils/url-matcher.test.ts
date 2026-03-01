import { describe, it, expect } from 'vitest';
import { matchUrl } from './url-matcher';

describe('matchUrl', () => {
  describe('wildcard matching with try/catch', () => {
    it('matches wildcard patterns normally', () => {
      expect(matchUrl('https://api.example.com/users', 'https://api.example.com/*')).toBe(true);
      expect(matchUrl('https://api.example.com/users', '*/users')).toBe(true);
    });

    it('returns false instead of throwing on malformed regex patterns', () => {
      // A pattern with unbalanced brackets after wildcard processing
      // should not throw, just return false
      expect(() => matchUrl('test', '/[invalid/')).not.toThrow();
      expect(matchUrl('test', '/[invalid/')).toBe(false);
    });
  });

  describe('regex pattern matching', () => {
    it('matches valid regex patterns (delimited by /)', () => {
      expect(matchUrl('https://api.example.com/users/123', '/users\\/\\d+/')).toBe(true);
    });

    it('returns false for invalid regex patterns', () => {
      expect(matchUrl('test', '/[invalid regex/')).toBe(false);
    });
  });

  describe('exact and substring match', () => {
    it('matches exact URL', () => {
      expect(matchUrl('https://api.example.com', 'https://api.example.com')).toBe(true);
    });

    it('matches substring', () => {
      expect(matchUrl('https://api.example.com/users', 'example.com')).toBe(true);
    });

    it('matches everything with empty pattern', () => {
      expect(matchUrl('https://anything.com', '')).toBe(true);
    });
  });
});
