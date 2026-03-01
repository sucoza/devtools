/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18n } from './i18n';

/**
 * Tests for the I18n event system, focusing on the fix that ensures
 * events fire regardless of the `devtools` configuration flag.
 *
 * Previously, when `devtools: false`, event listeners were silently
 * dropped and never called. The fix ensures `emit()` always dispatches
 * to registered listeners, irrespective of the devtools setting.
 */

describe('I18n event system', () => {
  let instance: I18n;

  beforeEach(() => {
    instance = new I18n({
      locale: 'en',
      fallbackLocale: 'en',
      devtools: true,
      debug: false,
    });
  });

  // ---------------------------------------------------------------
  // Events fire with devtools: true
  // ---------------------------------------------------------------
  describe('with devtools: true', () => {
    it('fires locale:change event when setLocale is called', async () => {
      const listener = vi.fn();
      instance.on('locale:change', listener);

      await instance.setLocale('es');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'en', to: 'es' }),
      );
    });

    it('fires translations:loaded event when addTranslations is called', () => {
      const listener = vi.fn();
      instance.on('translations:loaded', listener);

      instance.addTranslations('en', { greeting: 'Hello' });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ locale: 'en', count: 1 }),
      );
    });

    it('fires translation:access event when t() is called', () => {
      const listener = vi.fn();
      instance.addTranslations('en', { hello: 'Hello' });
      instance.on('translation:access', listener);

      instance.t('hello');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------
  // Events fire with devtools: false (THE FIX)
  // ---------------------------------------------------------------
  describe('with devtools: false (the fix)', () => {
    beforeEach(() => {
      instance = new I18n({
        locale: 'en',
        fallbackLocale: 'en',
        devtools: false,
        debug: false,
      });
    });

    it('fires locale:change event even when devtools is false', async () => {
      const listener = vi.fn();
      instance.on('locale:change', listener);

      await instance.setLocale('fr');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'en', to: 'fr' }),
      );
    });

    it('fires translations:loaded event even when devtools is false', () => {
      const listener = vi.fn();
      instance.on('translations:loaded', listener);

      instance.addTranslations('en', { key: 'value' });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('fires translation:access event even when devtools is false', () => {
      const listener = vi.fn();
      instance.addTranslations('en', { test: 'Test' });
      instance.on('translation:access', listener);

      instance.t('test');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('fires translation:missing event even when devtools is false', () => {
      const listener = vi.fn();
      instance.on('translation:missing', listener);

      instance.t('nonexistent.key');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ locale: 'en' }),
      );
    });
  });

  // ---------------------------------------------------------------
  // on() / off() registration
  // ---------------------------------------------------------------
  describe('on() and off()', () => {
    it('on() registers a listener that receives events', () => {
      const listener = vi.fn();
      instance.on('locale:change', listener);

      instance.emit('locale:change', {
        from: 'en',
        to: 'de',
        timestamp: Date.now(),
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('off() removes a listener so it no longer receives events', () => {
      const listener = vi.fn();
      instance.on('locale:change', listener);
      instance.off('locale:change', listener);

      instance.emit('locale:change', {
        from: 'en',
        to: 'de',
        timestamp: Date.now(),
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('on() returns an unsubscribe function', () => {
      const listener = vi.fn();
      const unsub = instance.on('locale:change', listener);

      unsub();

      instance.emit('locale:change', {
        from: 'en',
        to: 'de',
        timestamp: Date.now(),
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('multiple listeners can be registered for the same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      instance.on('locale:change', listener1);
      instance.on('locale:change', listener2);

      instance.emit('locale:change', {
        from: 'en',
        to: 'ja',
        timestamp: Date.now(),
      });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------
  // emit() error handling
  // ---------------------------------------------------------------
  describe('emit() error handling', () => {
    it('catches errors in listeners without breaking other listeners', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener exploded');
      });
      const normalListener = vi.fn();

      instance.on('locale:change', errorListener);
      instance.on('locale:change', normalListener);

      // Should not throw
      expect(() => {
        instance.emit('locale:change', {
          from: 'en',
          to: 'de',
          timestamp: Date.now(),
        });
      }).not.toThrow();

      // The error listener was called (and threw)
      expect(errorListener).toHaveBeenCalledTimes(1);
      // The normal listener still ran despite the error
      expect(normalListener).toHaveBeenCalledTimes(1);
    });

    it('logs errors from listeners to console.error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorListener = () => {
        throw new Error('broken');
      };

      instance.on('locale:change', errorListener);

      instance.emit('locale:change', {
        from: 'en',
        to: 'de',
        timestamp: Date.now(),
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------
  // locale:change fires on setLocale
  // ---------------------------------------------------------------
  describe('locale:change via setLocale', () => {
    it('fires locale:change with correct from/to values', async () => {
      const listener = vi.fn();
      instance.on('locale:change', listener);

      await instance.setLocale('pt');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'en',
          to: 'pt',
        }),
      );
    });

    it('does not fire locale:change when setting the same locale', async () => {
      const listener = vi.fn();
      instance.on('locale:change', listener);

      await instance.setLocale('en');

      // Same locale as current — setLocale should short-circuit
      expect(listener).not.toHaveBeenCalled();
    });

    it('includes a timestamp in the event data', async () => {
      const listener = vi.fn();
      instance.on('locale:change', listener);

      const before = Date.now();
      await instance.setLocale('zh');
      const after = Date.now();

      const eventData = listener.mock.calls[0][0];
      expect(eventData.timestamp).toBeGreaterThanOrEqual(before);
      expect(eventData.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
