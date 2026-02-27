/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { i18n, createI18n, formatNumber, formatDate, isRTL } from '../index';

describe('@sucoza/i18n', () => {
  beforeEach(() => {
    i18n.clear();
  });

  describe('Basic functionality', () => {
    it('should set and get locale', async () => {
      await i18n.setLocale('es');
      expect(i18n.locale).toBe('es');
    });

    it('should add and retrieve translations', () => {
      i18n.addTranslations('en', {
        greeting: 'Hello World!'
      });

      expect(i18n.t('greeting')).toBe('Hello World!');
    });

    it('should handle interpolation', () => {
      i18n.addTranslations('en', {
        greeting: 'Hello {{name}}!'
      });

      expect(i18n.t('greeting', { interpolation: { name: 'John' } })).toBe('Hello John!');
    });

    it('should handle pluralization', () => {
      i18n.addTranslations('en', {
        item: '{{count}} item',
        item_plural: '{{count}} items'
      });

      expect(i18n.t('item', { count: 1, interpolation: { count: 1 } })).toBe('1 item');
      expect(i18n.t('item', { count: 5, interpolation: { count: 5 } })).toBe('5 items');
    });

    it('should handle missing translations with fallback', () => {
      const result = i18n.t('nonexistent.key', { defaultValue: 'Fallback value' });
      expect(result).toBe('Fallback value');
    });

    it('should handle namespaces', () => {
      i18n.addTranslations('en', {
        login: 'Log In'
      }, 'auth');

      expect(i18n.t('login', { namespace: 'auth' })).toBe('Log In');
    });
  });

  describe('Custom instance', () => {
    it('should create custom instance with config', () => {
      const customI18n = createI18n({
        locale: 'fr',
        fallbackLocale: 'en',
        debug: false
      });

      expect(customI18n.locale).toBe('fr');
      expect(customI18n.config.fallbackLocale).toBe('en');
      expect(customI18n.config.debug).toBe(false);
    });

    it('should handle independent instances', () => {
      const i18n1 = createI18n({ locale: 'en' });
      const i18n2 = createI18n({ locale: 'es' });

      i18n1.addTranslations('en', { greeting: 'Hello' });
      i18n2.addTranslations('es', { greeting: 'Hola' });

      expect(i18n1.t('greeting')).toBe('Hello');
      expect(i18n2.t('greeting')).toBe('Hola');
    });
  });

  describe('Events', () => {
    it('should emit locale change events', (done) => {
      i18n.on('locale:change', (event) => {
        expect(event.from).toBe('en');
        expect(event.to).toBe('es');
        done();
      });

      i18n.setLocale('es');
    });

    it('should emit translation access events', (done) => {
      i18n.addTranslations('en', { test: 'Test' });
      
      i18n.on('translation:access', (event) => {
        expect(event.key).toBe('test');
        expect(event.locale).toBe('en');
        done();
      });

      i18n.t('test');
    });

    it('should emit missing translation events', (done) => {
      i18n.on('translation:missing', (event) => {
        expect(event.key).toBe('missing.key');
        expect(event.locale).toBe('en');
        done();
      });

      i18n.t('missing.key');
    });
  });

  describe('Utility functions', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56');
      // Note: Exact formatting may vary by system locale support
    });

    it('should format dates correctly', () => {
      // Use explicit UTC noon to avoid timezone-related date shifts
      const date = new Date('2023-12-25T12:00:00');
      const formatted = formatDate(date, 'en-US');
      expect(formatted).toContain('12'); // Month
      expect(formatted).toContain('25'); // Day
      expect(formatted).toContain('2023'); // Year
    });

    it('should detect RTL languages', () => {
      expect(isRTL('ar')).toBe(true);
      expect(isRTL('he')).toBe(true);
      expect(isRTL('en')).toBe(false);
      expect(isRTL('es')).toBe(false);
    });
  });

  describe('Performance and usage tracking', () => {
    it('should track translation usage', () => {
      i18n.addTranslations('en', { test: 'Test' });

      i18n.t('test');
      i18n.t('test');

      const stats = i18n.getUsageStats();
      // The key stored includes the default namespace prefix (e.g., "common:test")
      const testStat = stats.find(stat => stat.key === 'common:test');

      expect(testStat).toBeDefined();
      expect(testStat?.count).toBe(2);
    });

    it('should track missing keys', () => {
      i18n.t('missing.key1');
      i18n.t('missing.key2');

      const missingKeys = i18n.getMissingKeys();
      // Missing keys include the default namespace prefix
      expect(missingKeys).toContain('common:missing.key1');
      expect(missingKeys).toContain('common:missing.key2');
    });

    it('should provide current state', () => {
      i18n.addTranslations('en', { test: 'Test' });
      i18n.t('test');
      
      const state = i18n.getState();
      expect(state.locale).toBe('en');
      expect(state.translations).toBeDefined();
      expect(state.usage).toHaveLength(1);
    });
  });
});