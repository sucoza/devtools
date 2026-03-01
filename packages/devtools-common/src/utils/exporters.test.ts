import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportData, copyToClipboard, importFromJSON } from './exporters';

/**
 * Tests for the exporters utility functions.
 *
 * Key areas tested:
 * - exportData with JSON format
 * - exportData with CSV format (array data and non-array error)
 * - downloadFile try/finally ensuring URL.revokeObjectURL is always called
 * - copyToClipboard delegates to navigator.clipboard.writeText
 */

describe('exporters', () => {
  let mockCreateElement: ReturnType<typeof vi.fn>;
  let mockAppendChild: ReturnType<typeof vi.fn>;
  let mockRemoveChild: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockLink: { href: string; download: string; style: { display: string }; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn(),
    };

    mockCreateElement = vi.fn().mockReturnValue(mockLink);
    mockAppendChild = vi.fn();
    mockRemoveChild = vi.fn();
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    mockRevokeObjectURL = vi.fn();

    // Mock document APIs
    vi.spyOn(document, 'createElement').mockImplementation(mockCreateElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

    // Mock URL APIs
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    // Mock navigator for clipboard and userAgent
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, 'userAgent', {
      value: 'test-agent',
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('exportData', () => {
    it('should export JSON format with correct content', () => {
      const data = { key: 'value', count: 42 };

      exportData(data, 'test-plugin', '1.0.0', {
        format: 'json',
        pretty: true,
      });

      // Should create a link element
      expect(mockCreateElement).toHaveBeenCalledWith('a');

      // Should create a blob URL
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);

      // Should set download filename
      expect(mockLink.download).toMatch(/^test-plugin-export-\d+\.json$/);

      // Should click the link to trigger download
      expect(mockLink.click).toHaveBeenCalledTimes(1);

      // Should revoke the blob URL
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should export JSON with metadata when includeMetadata is true', () => {
      const data = { key: 'value' };

      exportData(data, 'test-plugin', '1.0.0', {
        format: 'json',
        pretty: true,
        includeMetadata: true,
      });

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });

    it('should use custom filename when provided', () => {
      const data = { key: 'value' };

      exportData(data, 'test-plugin', '1.0.0', {
        format: 'json',
        filename: 'custom-export.json',
      });

      expect(mockLink.download).toBe('custom-export.json');
    });

    it('should throw for CSV format with non-array data', () => {
      const data = { key: 'value' };

      expect(() => {
        exportData(data, 'test-plugin', '1.0.0', { format: 'csv' });
      }).toThrow('CSV export requires array data');
    });

    it('should export CSV format with array data', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      exportData(data, 'test-plugin', '1.0.0', { format: 'csv' });

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockLink.download).toMatch(/^test-plugin-export-\d+\.csv$/);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should export CSV with empty array producing empty content', () => {
      const data: any[] = [];

      exportData(data, 'test-plugin', '1.0.0', { format: 'csv' });

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });

    it('should export text format', () => {
      const data = { key: 'value' };

      exportData(data, 'test-plugin', '1.0.0', { format: 'txt' });

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockLink.download).toMatch(/^test-plugin-export-\d+\.txt$/);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });

    it('should throw for unsupported format', () => {
      expect(() => {
        exportData({}, 'test-plugin', '1.0.0', { format: 'xml' as any });
      }).toThrow('Unsupported export format: xml');
    });
  });

  describe('downloadFile - try/finally URL revocation', () => {
    it('should revoke blob URL even when click() throws', () => {
      mockLink.click.mockImplementation(() => {
        throw new Error('Click failed');
      });

      const data = { key: 'value' };

      expect(() => {
        exportData(data, 'test-plugin', '1.0.0', { format: 'json' });
      }).toThrow('Click failed');

      // The critical fix: URL.revokeObjectURL should STILL be called
      // even though click() threw an error, thanks to the try/finally block.
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should revoke blob URL even when appendChild throws', () => {
      mockAppendChild.mockImplementation(() => {
        throw new Error('appendChild failed');
      });

      expect(() => {
        exportData({ key: 'value' }, 'test-plugin', '1.0.0', { format: 'json' });
      }).toThrow('appendChild failed');

      // URL should still be revoked
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should revoke blob URL on successful export', () => {
      exportData({ key: 'value' }, 'test-plugin', '1.0.0', { format: 'json' });

      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('copyToClipboard', () => {
    it('should call navigator.clipboard.writeText with JSON content', async () => {
      const data = { key: 'value', nested: { a: 1 } };

      await copyToClipboard(data);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(data, null, 2)
      );
    });

    it('should call navigator.clipboard.writeText with text content', async () => {
      const data = 'plain text content';

      await copyToClipboard(data, 'text');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('plain text content');
    });

    it('should default to JSON format', async () => {
      const data = [1, 2, 3];

      await copyToClipboard(data);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(data, null, 2)
      );
    });

    it('should convert non-string data to string in text mode', async () => {
      const data = 12345;

      await copyToClipboard(data, 'text');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('12345');
    });
  });

  describe('importFromJSON', () => {
    it('should parse valid export data', () => {
      const json = JSON.stringify({
        plugin: 'test',
        version: '1.0.0',
        timestamp: Date.now(),
        data: { key: 'value' },
      });

      const result = importFromJSON(json);
      expect(result.plugin).toBe('test');
      expect(result.version).toBe('1.0.0');
      expect(result.data).toEqual({ key: 'value' });
    });

    it('should throw on invalid JSON', () => {
      expect(() => importFromJSON('{ invalid json }')).toThrow('Failed to import JSON');
    });

    it('should throw on missing required fields', () => {
      expect(() => importFromJSON('{"plugin": "test"}')).toThrow(
        'Invalid export data structure'
      );
    });
  });
});
