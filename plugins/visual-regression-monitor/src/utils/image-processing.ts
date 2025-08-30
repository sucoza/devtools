import type { DiffRegion } from '../types';
import { } from './index';

/**
 * Load image from data URL
 */
export function loadImage(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Convert ImageData to data URL
 */
export function imageDataToDataUrl(imageData: ImageData, format: 'png' | 'jpeg' = 'png'): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.toDataURL(`image/${format}`);
}

/**
 * Resize image to match dimensions
 */
export function resizeImageData(imageData: ImageData, targetWidth: number, targetHeight: number): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Create temporary canvas with original image
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) {
    throw new Error('Could not get temporary canvas context');
  }
  
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  tempCtx.putImageData(imageData, 0, 0);
  
  // Resize to target dimensions
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
  
  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Convert image to grayscale
 */
export function toGrayscale(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate grayscale using luminance formula
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // Alpha channel remains unchanged
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Apply Gaussian blur to reduce noise
 */
export function applyGaussianBlur(imageData: ImageData, radius: number = 1): ImageData {
  if (radius <= 0) return imageData;
  
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);
  const output = new Uint8ClampedArray(imageData.data);
  
  // Simple box blur approximation of Gaussian blur
  const size = radius * 2 + 1;
  const weight = 1 / (size * size);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const idx = (ny * width + nx) * 4;
          
          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
          a += data[idx + 3] * weight;
        }
      }
      
      const idx = (y * width + x) * 4;
      output[idx] = Math.round(r);
      output[idx + 1] = Math.round(g);
      output[idx + 2] = Math.round(b);
      output[idx + 3] = Math.round(a);
    }
  }
  
  return new ImageData(output, width, height);
}

/**
 * Calculate SSIM (Structural Similarity Index) between two images
 */
export function calculateSSIM(imageData1: ImageData, imageData2: ImageData): number {
  if (imageData1.width !== imageData2.width || imageData1.height !== imageData2.height) {
    throw new Error('Images must have the same dimensions for SSIM calculation');
  }
  
  const data1 = imageData1.data;
  const data2 = imageData2.data;
  const length = data1.length;
  
  let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, sum12 = 0;
  const N = length / 4; // Number of pixels
  
  // Convert to grayscale and calculate sums
  for (let i = 0; i < length; i += 4) {
    const gray1 = 0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2];
    const gray2 = 0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2];
    
    sum1 += gray1;
    sum2 += gray2;
    sum1Sq += gray1 * gray1;
    sum2Sq += gray2 * gray2;
    sum12 += gray1 * gray2;
  }
  
  const mean1 = sum1 / N;
  const mean2 = sum2 / N;
  const variance1 = sum1Sq / N - mean1 * mean1;
  const variance2 = sum2Sq / N - mean2 * mean2;
  const covariance = sum12 / N - mean1 * mean2;
  
  const c1 = 6.5025; // (0.01 * 255)^2
  const c2 = 58.5225; // (0.03 * 255)^2
  
  const numerator = (2 * mean1 * mean2 + c1) * (2 * covariance + c2);
  const denominator = (mean1 * mean1 + mean2 * mean2 + c1) * (variance1 + variance2 + c2);
  
  return numerator / denominator;
}

/**
 * Calculate perceptual hash (pHash) for image comparison
 */
export function calculatePerceptualHash(imageData: ImageData): string {
  // Resize to 32x32 for DCT
  const resized = resizeImageData(imageData, 32, 32);
  const grayscale = toGrayscale(resized);
  
  // Simple DCT approximation using average-based hashing
  const data = grayscale.data;
  const pixels: number[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    pixels.push(data[i]); // Use red channel since it's grayscale
  }
  
  // Calculate average
  const average = pixels.reduce((sum, pixel) => sum + pixel, 0) / pixels.length;
  
  // Create hash based on whether each pixel is above or below average
  let hash = '';
  for (const pixel of pixels) {
    hash += pixel > average ? '1' : '0';
  }
  
  return hash;
}

/**
 * Calculate Hamming distance between two binary strings
 */
export function calculateHammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hashes must be the same length');
  }
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  
  return distance;
}

/**
 * Apply threshold to image (convert to binary)
 */
export function applyThreshold(imageData: ImageData, threshold: number = 128): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate grayscale
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const value = gray > threshold ? 255 : 0;
    
    data[i] = value;     // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
    // Alpha channel remains unchanged
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Find connected components (regions) in a binary image
 */
export function findConnectedComponents(imageData: ImageData, minSize: number = 10): DiffRegion[] {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const visited = new Array(width * height).fill(false);
  const regions: DiffRegion[] = [];
  
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  function floodFill(startX: number, startY: number): DiffRegion | null {
    const stack: Array<[number, number]> = [[startX, startY]];
    const points: Array<[number, number]> = [];
    
    while (stack.length > 0) {
      const coords = stack.pop();
      if (!coords) break;
      const [x, y] = coords;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) {
        continue;
      }
      
      const pixelIdx = idx * 4;
      const isWhite = data[pixelIdx] > 128; // White pixel indicates difference
      
      if (!isWhite) {
        continue;
      }
      
      visited[idx] = true;
      points.push([x, y]);
      
      // Add neighbors to stack
      for (const [dx, dy] of directions) {
        stack.push([x + dx, y + dy]);
      }
    }
    
    if (points.length < minSize) {
      return null;
    }
    
    // Calculate bounding box
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      severity: points.length > 1000 ? 'high' : points.length > 100 ? 'medium' : 'low',
      type: 'modification', // Default type, could be refined based on analysis
    };
  }
  
  // Find all connected components
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!visited[idx]) {
        const region = floodFill(x, y);
        if (region) {
          regions.push(region);
        }
      }
    }
  }
  
  return regions;
}

/**
 * Highlight differences in an image
 */
export function highlightDifferences(
  imageData: ImageData, 
  regions: DiffRegion[], 
  highlightColor: { r: number; g: number; b: number; a: number } = { r: 255, g: 0, b: 0, a: 100 }
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(imageData.data);
  
  for (const region of regions) {
    // Draw rectangle outline
    for (let x = region.x; x < region.x + region.width; x++) {
      for (let y = region.y; y < region.y + region.height; y++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4;
          
          // Blend highlight color with original
          const alpha = highlightColor.a / 255;
          output[idx] = Math.round(output[idx] * (1 - alpha) + highlightColor.r * alpha);
          output[idx + 1] = Math.round(output[idx + 1] * (1 - alpha) + highlightColor.g * alpha);
          output[idx + 2] = Math.round(output[idx + 2] * (1 - alpha) + highlightColor.b * alpha);
        }
      }
    }
  }
  
  return new ImageData(output, width, height);
}

/**
 * Create a side-by-side comparison image
 */
export function createSideBySideComparison(
  baseline: ImageData, 
  comparison: ImageData, 
  diff?: ImageData
): ImageData {
  const width = Math.max(baseline.width, comparison.width);
  const height = Math.max(baseline.height, comparison.height);
  const totalWidth = diff ? width * 3 : width * 2;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.width = totalWidth;
  canvas.height = height;
  
  // Draw baseline
  const baselineCanvas = document.createElement('canvas');
  const baselineCtx = baselineCanvas.getContext('2d');
  if (!baselineCtx) throw new Error('Failed to get baseline canvas context');
  baselineCanvas.width = baseline.width;
  baselineCanvas.height = baseline.height;
  baselineCtx.putImageData(baseline, 0, 0);
  ctx.drawImage(baselineCanvas, 0, 0);
  
  // Draw comparison
  const comparisonCanvas = document.createElement('canvas');
  const comparisonCtx = comparisonCanvas.getContext('2d');
  if (!comparisonCtx) throw new Error('Failed to get comparison canvas context');
  comparisonCanvas.width = comparison.width;
  comparisonCanvas.height = comparison.height;
  comparisonCtx.putImageData(comparison, 0, 0);
  ctx.drawImage(comparisonCanvas, width, 0);
  
  // Draw diff if provided
  if (diff) {
    const diffCanvas = document.createElement('canvas');
    const diffCtx = diffCanvas.getContext('2d');
    if (!diffCtx) throw new Error('Failed to get diff canvas context');
    diffCanvas.width = diff.width;
    diffCanvas.height = diff.height;
    diffCtx.putImageData(diff, 0, 0);
    ctx.drawImage(diffCanvas, width * 2, 0);
  }
  
  return ctx.getImageData(0, 0, totalWidth, height);
}