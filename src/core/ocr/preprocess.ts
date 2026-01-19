/**
 * Image preprocessing utilities for improving OCR accuracy
 */

/**
 * Converts an image region to grayscale and increases contrast
 * to improve text recognition
 */
export function preprocessImageForOCR(
  canvas: HTMLCanvasElement,
  options: {
    contrast?: number; // 1.0 = normal, >1.0 = more contrast
    brightness?: number; // 0 = normal, >0 = brighter, <0 = darker
    threshold?: number; // 0-255, if set will convert to black/white
    adaptiveThreshold?: boolean; // Use adaptive thresholding (better for varying backgrounds)
  } = {}
): HTMLCanvasElement {
  const { contrast = 1.3, brightness = 0, threshold, adaptiveThreshold = false } = options;

  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // First pass: Convert to grayscale
  const grayValues = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Convert to grayscale using luminosity method
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply contrast and brightness
    gray = (gray - 128) * contrast + 128 + brightness;

    // Clamp to valid range
    gray = Math.max(0, Math.min(255, gray));

    grayValues[i / 4] = gray;
  }

  // Second pass: Apply thresholding
  if (adaptiveThreshold) {
    // Adaptive thresholding for better handling of varying backgrounds
    const windowSize = 15; // Window size for local threshold calculation
    const offset = Math.floor(windowSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;

        // Calculate local mean in window
        let sum = 0;
        let count = 0;
        for (let wy = Math.max(0, y - offset); wy < Math.min(height, y + offset + 1); wy++) {
          for (let wx = Math.max(0, x - offset); wx < Math.min(width, x + offset + 1); wx++) {
            sum += grayValues[wy * width + wx];
            count++;
          }
        }
        const localMean = sum / count;

        // Threshold based on local mean (subtract small value for bias toward black text)
        const gray = grayValues[idx] > localMean - 5 ? 255 : 0;

        const pixelIdx = idx * 4;
        data[pixelIdx] = gray;
        data[pixelIdx + 1] = gray;
        data[pixelIdx + 2] = gray;
      }
    }
  } else if (threshold !== undefined) {
    // Simple global threshold
    for (let i = 0; i < grayValues.length; i++) {
      const gray = grayValues[i] > threshold ? 255 : 0;
      data[i * 4] = gray;
      data[i * 4 + 1] = gray;
      data[i * 4 + 2] = gray;
    }
  } else {
    // No thresholding, just grayscale
    for (let i = 0; i < grayValues.length; i++) {
      const gray = grayValues[i];
      data[i * 4] = gray;
      data[i * 4 + 1] = gray;
      data[i * 4 + 2] = gray;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Inverts image colors (useful for white text on dark backgrounds)
 */
export function invertColors(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];         // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
    // Alpha channel remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Scales up small text regions to improve OCR accuracy
 */
export function upscaleCanvas(
  canvas: HTMLCanvasElement,
  scaleFactor: number = 2,
  useSharpScaling: boolean = false
): HTMLCanvasElement {
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = originalWidth * scaleFactor;
  tempCanvas.height = originalHeight * scaleFactor;

  const ctx = tempCanvas.getContext('2d')!;

  if (useSharpScaling) {
    // Disable smoothing for crisp pixel-perfect scaling (better for stylized fonts)
    ctx.imageSmoothingEnabled = false;
  } else {
    // Use smooth scaling for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  ctx.drawImage(
    canvas,
    0, 0, originalWidth, originalHeight,
    0, 0, tempCanvas.width, tempCanvas.height
  );

  return tempCanvas;
}

/**
 * Flood fill from borders to remove background, leaving only foreground text
 * This helps isolate text from colored backgrounds
 */
export function floodFillBorders(
  canvas: HTMLCanvasElement,
  fillColor: number = 0 // Black
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Create a visited array
  const visited = new Uint8Array(width * height);

  // Helper to get pixel index
  const getIdx = (x: number, y: number) => y * width + x;
  const getPixelIdx = (x: number, y: number) => (y * width + x) * 4;

  // Check if pixel should be filled (similar color to starting pixel)
  const shouldFill = (x: number, y: number, refValue: number, tolerance: number = 30): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    if (visited[getIdx(x, y)]) return false;

    const pixelIdx = getPixelIdx(x, y);
    const pixelValue = data[pixelIdx]; // Grayscale, so R=G=B

    return Math.abs(pixelValue - refValue) <= tolerance;
  };

  // Flood fill from a starting point
  const floodFill = (startX: number, startY: number) => {
    const stack: [number, number][] = [[startX, startY]];
    const refValue = data[getPixelIdx(startX, startY)];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;

      if (!shouldFill(x, y, refValue)) continue;

      visited[getIdx(x, y)] = 1;

      // Fill this pixel
      const pixelIdx = getPixelIdx(x, y);
      data[pixelIdx] = data[pixelIdx + 1] = data[pixelIdx + 2] = fillColor;

      // Add neighbors to stack
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
  };

  // Flood fill from all 4 borders
  // Top and bottom edges
  for (let x = 0; x < width; x++) {
    if (!visited[getIdx(x, 0)]) floodFill(x, 0); // Top
    if (!visited[getIdx(x, height - 1)]) floodFill(x, height - 1); // Bottom
  }

  // Left and right edges
  for (let y = 0; y < height; y++) {
    if (!visited[getIdx(0, y)]) floodFill(0, y); // Left
    if (!visited[getIdx(width - 1, y)]) floodFill(width - 1, y); // Right
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Applies morphological operations to clean up text
 */
export function morphologicalClose(canvas: HTMLCanvasElement, iterations: number = 1): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Dilate then erode to close gaps in characters
  for (let iter = 0; iter < iterations; iter++) {
    // Dilate (expand white regions)
    const dilated = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (
          data[idx] === 255 ||
          data[idx - 4] === 255 ||
          data[idx + 4] === 255 ||
          data[idx - width * 4] === 255 ||
          data[idx + width * 4] === 255
        ) {
          dilated[idx] = dilated[idx + 1] = dilated[idx + 2] = 255;
        }
      }
    }

    // Erode (shrink white regions)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (
          dilated[idx] === 255 &&
          dilated[idx - 4] === 255 &&
          dilated[idx + 4] === 255 &&
          dilated[idx - width * 4] === 255 &&
          dilated[idx + width * 4] === 255
        ) {
          data[idx] = data[idx + 1] = data[idx + 2] = 255;
        } else {
          data[idx] = data[idx + 1] = data[idx + 2] = 0;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
