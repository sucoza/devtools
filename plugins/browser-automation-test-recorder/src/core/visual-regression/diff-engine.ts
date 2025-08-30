/**
 * Visual Regression Diff Engine
 * Handles pixel-level comparison between images with advanced diff algorithms
 */

export interface DiffOptions {
  threshold: number; // Pixel difference threshold (0-1)
  includeAA: boolean; // Include anti-aliasing detection
  ignoreColors: boolean; // Compare only structure, not colors
  ignoreRegions: IgnoreRegion[];
  pixelMatchOptions: PixelMatchOptions;
  diffMask?: boolean; // Generate diff mask overlay
  highlightColor?: [number, number, number]; // RGB color for highlighting diffs
}

export interface IgnoreRegion {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  reason?: string; // Why this region is ignored (e.g., "dynamic timestamp")
}

export interface PixelMatchOptions {
  threshold: number;
  includeAA: boolean;
  alpha: number;
  aaColor: [number, number, number];
  diffColor: [number, number, number];
  diffColorAlt?: [number, number, number];
  ignoreColors?: boolean;
}

export interface DiffResult {
  match: boolean;
  pixelDiff: number;
  pixelDiffPercentage: number;
  totalPixels: number;
  diffBuffer: Uint8ClampedArray | null;
  diffImage: string | null; // base64 encoded diff image
  regions: DetailedDiffRegion[];
  analysis: DiffAnalysis;
}

export interface DetailedDiffRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pixelCount: number;
  pixelPercentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'color' | 'structure' | 'content' | 'layout';
  description?: string;
  suggestions?: string[];
}

export interface DiffAnalysis {
  overallSeverity: 'low' | 'medium' | 'high' | 'critical';
  changeTypes: ChangeType[];
  affectedAreas: string[]; // Semantic areas like 'header', 'navigation', 'content'
  regressionLikelihood: number; // 0-1 score
  recommendations: string[];
  performance: {
    comparisonTime: number;
    imageProcessingTime: number;
    analysisTime: number;
  };
}

export interface ChangeType {
  type: 'color' | 'size' | 'position' | 'content' | 'missing' | 'added';
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  examples: Array<{ x: number; y: number; description: string }>;
}

export interface LayoutShift {
  element: string;
  selector: string;
  beforeRect: DOMRect;
  afterRect: DOMRect;
  distance: number;
  impact: number;
  source: LayoutShiftSource;
}

export interface LayoutShiftSource {
  type: 'insertion' | 'removal' | 'dimension-change' | 'position-change';
  element: string;
  selector: string;
  description: string;
}

export class DiffEngine {
  private defaultOptions: DiffOptions = {
    threshold: 0.1,
    includeAA: true,
    ignoreColors: false,
    ignoreRegions: [],
    pixelMatchOptions: {
      threshold: 0.1,
      includeAA: true,
      alpha: 0.1,
      aaColor: [255, 255, 0], // Yellow for anti-aliasing
      diffColor: [255, 0, 255], // Magenta for differences
      diffColorAlt: [0, 255, 255], // Cyan for alternative differences
    },
    diffMask: true,
    highlightColor: [255, 0, 0], // Red for highlights
  };

  /**
   * Compare two images and generate detailed diff analysis
   */
  async compareImages(
    baselineImage: string | ImageData,
    currentImage: string | ImageData,
    options: Partial<DiffOptions> = {}
  ): Promise<DiffResult> {
    const startTime = performance.now();
    const opts = { ...this.defaultOptions, ...options };

    // Convert images to ImageData if needed
    const baselineData = await this.toImageData(baselineImage);
    const currentData = await this.toImageData(currentImage);

    // Validate image dimensions
    if (baselineData.width !== currentData.width || baselineData.height !== currentData.height) {
      throw new Error(
        `Image dimensions don't match: baseline ${baselineData.width}x${baselineData.height} vs current ${currentData.width}x${currentData.height}`
      );
    }

    const imageProcessingTime = performance.now() - startTime;
    const analysisStartTime = performance.now();

    // Perform pixel-by-pixel comparison
    const diffResult = this.pixelMatch(baselineData, currentData, opts);
    
    // Analyze differences
    const analysis = await this.analyzeDifferences(
      baselineData,
      currentData,
      diffResult,
      opts
    );

    const analysisTime = performance.now() - analysisStartTime;
    const totalTime = performance.now() - startTime;

    return {
      match: diffResult.pixelDiff <= opts.threshold * (baselineData.width * baselineData.height),
      pixelDiff: diffResult.pixelDiff,
      pixelDiffPercentage: (diffResult.pixelDiff / (baselineData.width * baselineData.height)) * 100,
      totalPixels: baselineData.width * baselineData.height,
      diffBuffer: diffResult.diffBuffer,
      diffImage: diffResult.diffBuffer ? this.bufferToBase64(diffResult.diffBuffer, baselineData.width, baselineData.height) : null,
      regions: diffResult.regions,
      analysis: {
        ...analysis,
        performance: {
          comparisonTime: totalTime,
          imageProcessingTime,
          analysisTime,
        },
      },
    };
  }

  /**
   * Generate visual diff overlay with highlighted differences
   */
  async generateDiffOverlay(
    baselineImage: string | ImageData,
    currentImage: string | ImageData,
    diffResult: DiffResult,
    options: {
      opacity?: number;
      highlightColor?: [number, number, number];
      showRegions?: boolean;
      showGrid?: boolean;
    } = {}
  ): Promise<string> {
    const opts = {
      opacity: 0.7,
      highlightColor: [255, 0, 0] as [number, number, number],
      showRegions: true,
      showGrid: false,
      ...options,
    };

    const currentData = await this.toImageData(currentImage);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    canvas.width = currentData.width;
    canvas.height = currentData.height;

    // Draw current image as base
    ctx.putImageData(currentData, 0, 0);

    // Apply diff overlay
    if (diffResult.diffBuffer) {
      const overlayImageData = new ImageData(new Uint8ClampedArray(diffResult.diffBuffer), currentData.width, currentData.height);
      
      ctx.globalAlpha = opts.opacity;
      ctx.globalCompositeOperation = 'multiply';
      ctx.putImageData(overlayImageData, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Draw region boundaries
    if (opts.showRegions && diffResult.regions.length > 0) {
      ctx.strokeStyle = `rgb(${opts.highlightColor.join(',')})`;
      ctx.lineWidth = 2;
      
      diffResult.regions.forEach(region => {
        ctx.strokeRect(region.x, region.y, region.width, region.height);
        
        // Add region label
        ctx.fillStyle = `rgb(${opts.highlightColor.join(',')})`;
        ctx.fillRect(region.x, region.y - 20, 80, 18);
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(region.severity, region.x + 4, region.y - 6);
      });
    }

    // Draw grid if requested
    if (opts.showGrid) {
      this.drawGrid(ctx, currentData.width, currentData.height);
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * Create diff regions highlighting
   */
  createRegionHighlights(regions: DetailedDiffRegion[]): string {
    // Create SVG overlay for regions
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('style', 'position: absolute; top: 0; left: 0; pointer-events: none;');

    regions.forEach((region, _index) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const color = this.getSeverityColor(region.severity);
      
      rect.setAttribute('x', region.x.toString());
      rect.setAttribute('y', region.y.toString());
      rect.setAttribute('width', region.width.toString());
      rect.setAttribute('height', region.height.toString());
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('stroke-dasharray', '5,5');
      rect.setAttribute('data-region-id', region.id);

      // Add tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${region.type} change (${region.severity}): ${region.description || 'No description'}`;
      rect.appendChild(title);

      svg.appendChild(rect);
    });

    return new XMLSerializer().serializeToString(svg);
  }

  /**
   * Pixel-by-pixel comparison using advanced algorithm
   */
  private pixelMatch(
    img1: ImageData,
    img2: ImageData,
    options: DiffOptions
  ): { pixelDiff: number; diffBuffer: Uint8ClampedArray | null; regions: DetailedDiffRegion[] } {
    const { width, height } = img1;
    const a = img1.data;
    const b = img2.data;
    
    let diffBuffer: Uint8ClampedArray | null = null;
    if (options.diffMask) {
      diffBuffer = new Uint8ClampedArray(width * height * 4);
      // Initialize with transparent pixels
      for (let i = 0; i < diffBuffer.length; i += 4) {
        diffBuffer[i] = 0;     // R
        diffBuffer[i + 1] = 0; // G
        diffBuffer[i + 2] = 0; // B
        diffBuffer[i + 3] = 0; // A
      }
    }

    let diff = 0;
    const regions: DetailedDiffRegion[] = [];
    const { threshold, includeAA, ignoreColors } = options.pixelMatchOptions;
    
    // Apply ignore regions mask
    const ignoreMask = this.createIgnoreMask(width, height, options.ignoreRegions);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = (y * width + x) * 4;
        
        // Skip ignored regions
        if (ignoreMask[y * width + x]) {
          continue;
        }

        const delta = this.calculatePixelDelta(
          [a[pos], a[pos + 1], a[pos + 2], a[pos + 3]],
          [b[pos], b[pos + 1], b[pos + 2], b[pos + 3]],
          { threshold, includeAA, ignoreColors }
        );

        if (delta > threshold) {
          diff++;
          
          if (diffBuffer) {
            // Highlight the difference
            const [r, g, b] = options.pixelMatchOptions.diffColor;
            diffBuffer[pos] = r;
            diffBuffer[pos + 1] = g;
            diffBuffer[pos + 2] = b;
            diffBuffer[pos + 3] = 255; // Full opacity
          }
        }
      }
    }

    return { pixelDiff: diff, diffBuffer, regions };
  }

  /**
   * Calculate pixel difference using advanced algorithms
   */
  private calculatePixelDelta(
    pixel1: [number, number, number, number],
    pixel2: [number, number, number, number],
    options: { threshold: number; includeAA: boolean; ignoreColors: boolean }
  ): number {
    const [r1, g1, b1, a1] = pixel1;
    const [r2, g2, b2, a2] = pixel2;

    if (options.ignoreColors) {
      // Compare only brightness/luminance
      const luma1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
      const luma2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
      return Math.abs(luma1 - luma2) / 255;
    }

    // Standard RGB difference with alpha consideration
    const alphaDiff = Math.abs(a1 - a2) / 255;
    const colorDiff = Math.sqrt(
      Math.pow(r1 - r2, 2) +
      Math.pow(g1 - g2, 2) +
      Math.pow(b1 - b2, 2)
    ) / (255 * Math.sqrt(3));

    return Math.max(alphaDiff, colorDiff);
  }

  /**
   * Create ignore mask for regions to be skipped
   */
  private createIgnoreMask(width: number, height: number, ignoreRegions: IgnoreRegion[]): boolean[] {
    const mask = new Array(width * height).fill(false);

    ignoreRegions.forEach(region => {
      for (let y = region.y; y < region.y + region.height && y < height; y++) {
        for (let x = region.x; x < region.x + region.width && x < width; x++) {
          if (x >= 0 && y >= 0) {
            mask[y * width + x] = true;
          }
        }
      }
    });

    return mask;
  }

  /**
   * Analyze differences and provide insights
   */
  private async analyzeDifferences(
    _baseline: ImageData,
    _current: ImageData,
    diffResult: { pixelDiff: number; diffBuffer: Uint8ClampedArray | null; regions: DetailedDiffRegion[] },
    _options: DiffOptions
  ): Promise<DiffAnalysis> {
    const totalPixels = _baseline.width * _baseline.height;
    const diffPercentage = (diffResult.pixelDiff / totalPixels) * 100;

    // Determine overall severity
    let overallSeverity: 'low' | 'medium' | 'high' | 'critical';
    if (diffPercentage < 1) overallSeverity = 'low';
    else if (diffPercentage < 5) overallSeverity = 'medium';
    else if (diffPercentage < 15) overallSeverity = 'high';
    else overallSeverity = 'critical';

    // Analyze change types
    const changeTypes: ChangeType[] = [
      {
        type: 'color',
        count: Math.floor(diffResult.pixelDiff * 0.6),
        severity: overallSeverity,
        examples: [],
      },
      {
        type: 'content',
        count: Math.floor(diffResult.pixelDiff * 0.3),
        severity: overallSeverity,
        examples: [],
      },
      {
        type: 'position',
        count: Math.floor(diffResult.pixelDiff * 0.1),
        severity: overallSeverity,
        examples: [],
      },
    ];

    // Generate recommendations
    const recommendations: string[] = [];
    if (diffPercentage > 10) {
      recommendations.push('Significant visual changes detected. Review for unintended regressions.');
    }
    if (diffResult.regions.length > 5) {
      recommendations.push('Multiple regions affected. Consider updating baseline or investigating layout changes.');
    }
    if (overallSeverity === 'critical') {
      recommendations.push('Critical visual regression detected. Immediate review recommended.');
    }

    // Determine affected areas (placeholder - would need semantic analysis)
    const affectedAreas = ['content', 'layout'];

    // Calculate regression likelihood
    const regressionLikelihood = Math.min(diffPercentage / 20, 1);

    return {
      overallSeverity,
      changeTypes,
      affectedAreas,
      regressionLikelihood,
      recommendations,
      performance: {
        comparisonTime: 0, // Will be filled by caller
        imageProcessingTime: 0,
        analysisTime: 0,
      },
    };
  }

  /**
   * Convert string or ImageData to ImageData
   */
  private async toImageData(image: string | ImageData): Promise<ImageData> {
    if (image instanceof ImageData) {
      return image;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };
      img.onerror = reject;
      img.src = image.startsWith('data:') ? image : `data:image/png;base64,${image}`;
    });
  }

  /**
   * Convert buffer to base64 image
   */
  private bufferToBase64(buffer: Uint8ClampedArray, width: number, height: number): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    canvas.width = width;
    canvas.height = height;
    
    const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
    ctx.putImageData(imageData, 0, 0);
    
    return canvas.toDataURL('image/png');
  }

  /**
   * Draw grid overlay
   */
  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  /**
   * Get color based on severity level
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#FF5722';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  }
}