import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  loadImage,
  imageDataToDataUrl,
  resizeImageData,
  toGrayscale,
  applyGaussianBlur,
  calculateSSIM,
  calculatePerceptualHash,
  calculateHammingDistance,
  applyThreshold,
  findConnectedComponents,
  highlightDifferences,
  createSideBySideComparison,
} from '../image-processing';
import type { DiffRegion } from '../../types';

// Mock DOM environment for canvas operations
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.HTMLImageElement = dom.window.HTMLImageElement;
global.Image = dom.window.Image;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;

// Mock ImageData constructor since JSDOM doesn't provide a complete one
global.ImageData = class ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
    if (dataOrWidth instanceof Uint8ClampedArray) {
      // Constructor with data array
      const data = dataOrWidth;
      const width = widthOrHeight;
      
      if (typeof width !== 'number' || width <= 0) {
        throw new Error('Index or size is negative or greater than the allowed amount');
      }
      
      if (height !== undefined) {
        if (typeof height !== 'number' || height <= 0) {
          throw new Error('Index or size is negative or greater than the allowed amount');
        }
        if (data.length !== width * height * 4) {
          throw new Error('Index or size is negative or greater than the allowed amount');
        }
        this.width = width;
        this.height = height;
        this.data = data;
      } else {
        throw new Error('Height must be provided when using data array');
      }
    } else {
      // Constructor with just dimensions
      const width = dataOrWidth as number;
      const heightVal = widthOrHeight;
      
      if (typeof width !== 'number' || width <= 0) {
        throw new Error('Index or size is negative or greater than the allowed amount');
      }
      if (typeof heightVal !== 'number' || heightVal <= 0) {
        throw new Error('Index or size is negative or greater than the allowed amount');
      }
      
      this.width = width;
      this.height = heightVal;
      this.data = new Uint8ClampedArray(width * heightVal * 4);
    }
  }
};

// Helper functions to create test image data
function createTestImageData(width: number, height: number, fillColor: [number, number, number, number] = [255, 255, 255, 255]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fillColor[0];     // R
    data[i + 1] = fillColor[1]; // G
    data[i + 2] = fillColor[2]; // B
    data[i + 3] = fillColor[3]; // A
  }
  return new ImageData(data, width, height);
}

function createPatternImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Create a simple checkerboard pattern
      const isEven = (Math.floor(x / 10) + Math.floor(y / 10)) % 2 === 0;
      const color = isEven ? 255 : 0;
      
      data[i] = color;     // R
      data[i + 1] = color; // G
      data[i + 2] = color; // B
      data[i + 3] = 255;   // A
    }
  }
  
  return new ImageData(data, width, height);
}

// Mock canvas context methods
function mockCanvasContext() {
  const mockContext = {
    drawImage: vi.fn(),
    putImageData: vi.fn(),
    getImageData: vi.fn((x: number, y: number, width: number, height: number) => {
      // Return appropriate sized data for the requested dimensions
      const size = width * height * 4;
      const data = new Uint8ClampedArray(size);
      
      // Fill with some pattern data for more realistic testing
      for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = Math.floor(i / 4);
        const row = Math.floor(pixelIndex / width);
        const col = pixelIndex % width;
        
        // Create checkerboard pattern
        const isEven = (Math.floor(row / 8) + Math.floor(col / 8)) % 2 === 0;
        const value = isEven ? 255 : 128;
        
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 255;   // A
      }
      
      return new ImageData(data, width, height);
    }),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    canvas: { 
      toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
      width: 32, // Default size for mock
      height: 32
    }
  };

  // Mock canvas getContext method
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any);
  
  return mockContext;
}

// Set up the mock immediately
mockCanvasContext();

describe('Image Processing Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toGrayscale', () => {
    it('should convert color image to grayscale', () => {
      const colorImageData = createTestImageData(2, 2, [255, 128, 64, 255]);
      
      const result = toGrayscale(colorImageData);
      
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
      
      // Check that all RGB channels have the same value (grayscale)
      for (let i = 0; i < result.data.length; i += 4) {
        expect(result.data[i]).toBe(result.data[i + 1]);
        expect(result.data[i + 1]).toBe(result.data[i + 2]);
        expect(result.data[i + 3]).toBe(255); // Alpha should remain unchanged
      }
    });

    it('should calculate correct luminance values', () => {
      // Test with pure red pixel
      const redImageData = createTestImageData(1, 1, [255, 0, 0, 255]);
      const redGray = toGrayscale(redImageData);
      const expectedRed = Math.round(0.299 * 255 + 0.587 * 0 + 0.114 * 0);
      
      expect(redGray.data[0]).toBe(expectedRed);
      expect(redGray.data[1]).toBe(expectedRed);
      expect(redGray.data[2]).toBe(expectedRed);
    });
  });

  describe('calculateSSIM', () => {
    it('should return 1.0 for identical images', () => {
      const imageData1 = createTestImageData(50, 50, [128, 128, 128, 255]);
      const imageData2 = createTestImageData(50, 50, [128, 128, 128, 255]);
      
      const ssim = calculateSSIM(imageData1, imageData2);
      
      expect(ssim).toBeCloseTo(1.0, 2);
    });

    it('should throw error for different sized images', () => {
      const image1 = createTestImageData(50, 50);
      const image2 = createTestImageData(60, 60);
      
      expect(() => calculateSSIM(image1, image2)).toThrow('Images must have the same dimensions');
    });
  });

  describe('calculatePerceptualHash', () => {
    it('should generate consistent hashes for the same image', () => {
      const imageData = createTestImageData(100, 100, [128, 128, 128, 255]);
      
      const hash1 = calculatePerceptualHash(imageData);
      const hash2 = calculatePerceptualHash(imageData);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(1024); // 32x32 = 1024 bits
    });

    it('should generate binary hash strings', () => {
      const imageData = createPatternImageData(50, 50);
      const hash = calculatePerceptualHash(imageData);
      
      expect(hash).toMatch(/^[01]+$/); // Should only contain 0s and 1s
      expect(hash).toHaveLength(1024);
    });
  });

  describe('calculateHammingDistance', () => {
    it('should return 0 for identical hashes', () => {
      const hash1 = '1010101010';
      const hash2 = '1010101010';
      
      const distance = calculateHammingDistance(hash1, hash2);
      
      expect(distance).toBe(0);
    });

    it('should return correct distance for different hashes', () => {
      const hash1 = '1010101010';
      const hash2 = '0101010101';
      
      const distance = calculateHammingDistance(hash1, hash2);
      
      expect(distance).toBe(10); // All bits are different
    });

    it('should throw error for different length hashes', () => {
      const hash1 = '1010';
      const hash2 = '101010';
      
      expect(() => calculateHammingDistance(hash1, hash2)).toThrow('Hashes must be the same length');
    });
  });

  describe('applyThreshold', () => {
    it('should convert to binary with custom threshold', () => {
      const grayImage = createTestImageData(2, 2, [100, 100, 100, 255]);
      
      const lowThreshold = applyThreshold(grayImage, 50);
      const highThreshold = applyThreshold(grayImage, 150);
      
      // With threshold 50, gray (100) should become white (255)
      expect(lowThreshold.data[0]).toBe(255);
      
      // With threshold 150, gray (100) should become black (0)
      expect(highThreshold.data[0]).toBe(0);
    });
  });

  describe('findConnectedComponents', () => {
    it('should find no regions in uniform image', () => {
      const uniformImage = createTestImageData(20, 20, [0, 0, 0, 255]);
      const regions = findConnectedComponents(uniformImage);
      
      expect(regions).toHaveLength(0);
    });

    it('should find single large region', () => {
      const image = createTestImageData(20, 20, [255, 255, 255, 255]);
      const regions = findConnectedComponents(image, 5);
      
      expect(regions).toHaveLength(1);
      expect(regions[0].width).toBe(20);
      expect(regions[0].height).toBe(20);
      expect(regions[0].severity).toBe('medium'); // 20x20 = 400 pixels = medium
    });
  });

  describe('highlightDifferences', () => {
    it('should highlight specified regions', () => {
      const imageData = createTestImageData(100, 100, [128, 128, 128, 255]);
      const regions: DiffRegion[] = [
        {
          x: 10,
          y: 10,
          width: 20,
          height: 20,
          severity: 'medium',
          type: 'modification',
        },
      ];
      
      const result = highlightDifferences(imageData, regions);
      
      expect(result.width).toBe(imageData.width);
      expect(result.height).toBe(imageData.height);
    });
  });
});
