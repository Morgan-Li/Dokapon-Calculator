/**
 * OCR preprocessing presets for different text types
 */

import { preprocessImageForOCR, upscaleCanvas, invertColors, floodFillBorders } from './preprocess';

export type PreprocessPreset = 'adaptive' | 'sharp' | 'inverted' | 'simple' | 'highContrast' | 'floodFill';

export interface PreprocessConfig {
  name: string;
  description: string;
  apply: (canvas: HTMLCanvasElement) => HTMLCanvasElement;
}

export const PREPROCESS_PRESETS: Record<PreprocessPreset, PreprocessConfig> = {
  // Current default - adaptive thresholding
  adaptive: {
    name: 'Adaptive Threshold',
    description: '3x upscale + adaptive thresholding (current)',
    apply: (canvas: HTMLCanvasElement) => {
      const upscaled = upscaleCanvas(canvas, 3, false);
      return preprocessImageForOCR(upscaled, {
        contrast: 1.3,
        brightness: 0,
        adaptiveThreshold: true,
      });
    },
  },

  // Sharp scaling without smoothing + simple threshold
  sharp: {
    name: 'Sharp Scaling',
    description: '4x sharp upscale + high contrast threshold',
    apply: (canvas: HTMLCanvasElement) => {
      const upscaled = upscaleCanvas(canvas, 4, true); // Sharp scaling
      return preprocessImageForOCR(upscaled, {
        contrast: 1.5,
        brightness: 10,
        threshold: 140, // Simple threshold
      });
    },
  },

  // Inverted colors (for dark text on light background)
  inverted: {
    name: 'Inverted Colors',
    description: '3x upscale + color inversion + threshold',
    apply: (canvas: HTMLCanvasElement) => {
      const upscaled = upscaleCanvas(canvas, 3, false);
      const processed = preprocessImageForOCR(upscaled, {
        contrast: 1.4,
        brightness: 0,
        threshold: 128,
      });
      return invertColors(processed);
    },
  },

  // Simple approach - just grayscale and threshold
  simple: {
    name: 'Simple Threshold',
    description: '3x upscale + grayscale + fixed threshold',
    apply: (canvas: HTMLCanvasElement) => {
      const upscaled = upscaleCanvas(canvas, 3, false);
      return preprocessImageForOCR(upscaled, {
        contrast: 1.2,
        brightness: 0,
        threshold: 128,
      });
    },
  },

  // Very high contrast
  highContrast: {
    name: 'High Contrast',
    description: '4x sharp upscale + very high contrast',
    apply: (canvas: HTMLCanvasElement) => {
      const upscaled = upscaleCanvas(canvas, 4, true);
      return preprocessImageForOCR(upscaled, {
        contrast: 2.0,
        brightness: 0,
        threshold: 150,
      });
    },
  },

  // Flood fill borders + invert (NEW - for removing background colors)
  floodFill: {
    name: 'Flood Fill + Invert',
    description: 'Adaptive threshold + flood fill borders + invert to black text on white',
    apply: (canvas: HTMLCanvasElement) => {
      // 1. Upscale
      const upscaled = upscaleCanvas(canvas, 3, false);

      // 2. Adaptive threshold to separate text from background
      const thresholded = preprocessImageForOCR(upscaled, {
        contrast: 1.3,
        brightness: 0,
        adaptiveThreshold: true,
      });

      // 3. Flood fill from borders to remove background (fills with black)
      const filled = floodFillBorders(thresholded, 0);

      // 4. Invert so text becomes black on white (better for Tesseract)
      return invertColors(filled);
    },
  },
};
