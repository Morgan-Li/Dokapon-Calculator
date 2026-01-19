/**
 * Template matching for digit recognition
 * Uses preprocessed digit templates to recognize numbers in game screenshots
 */

// Cache for loaded and preprocessed templates
let digitTemplates: Map<string, HTMLCanvasElement> | null = null;

/**
 * Load all digit templates (0-9) from assets
 */
async function loadDigitTemplates(): Promise<Map<string, HTMLCanvasElement>> {
  const templates = new Map<string, HTMLCanvasElement>();

  // Import all digit templates
  const templateModules = import.meta.glob('/src/assets/templates/digits/*.png', {
    eager: true,
    query: '?url',
    import: 'default'
  });

  // Load all digit templates
  for (let digit = 0; digit <= 9; digit++) {
    const templatePath = `/src/assets/templates/digits/${digit}.png`;
    const templateUrl = templateModules[templatePath] as string;

    if (!templateUrl) {
      console.error(`Template not found: ${digit}.png`);
      continue;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        templates.set(digit.toString(), canvas);
        console.log(`Loaded template ${digit}: ${canvas.width}x${canvas.height}`);
        resolve();
      };
      img.onerror = () => {
        console.error(`Failed to load template: ${digit}.png`);
        reject(new Error(`Failed to load template: ${digit}.png`));
      };
      img.src = templateUrl;
    });
  }

  console.log(`Loaded ${templates.size} digit templates`);
  return templates;
}

/**
 * Get cached templates or load them if not cached
 */
async function getTemplates(): Promise<Map<string, HTMLCanvasElement>> {
  if (!digitTemplates) {
    digitTemplates = await loadDigitTemplates();
  }
  return digitTemplates;
}

/**
 * Count white pixels in image data (for debugging)
 */
function countWhitePixels(data: Uint8ClampedArray): number {
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 128) { // White pixel
      count++;
    }
  }
  return count;
}

/**
 * Alternative matching using Sum of Squared Differences (more robust for exact matches)
 * Returns a similarity score (0 = perfect match, higher = worse match)
 */
function matchTemplateSSD(
  source: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  template: Uint8ClampedArray,
  templateWidth: number,
  templateHeight: number,
  x: number,
  y: number
): number {
  let ssd = 0;
  let validPixels = 0;

  for (let ty = 0; ty < templateHeight; ty++) {
    for (let tx = 0; tx < templateWidth; tx++) {
      const sx = x + tx;
      const sy = y + ty;

      if (sx >= sourceWidth || sy >= sourceHeight) {
        continue; // Skip out of bounds pixels
      }

      const sourceIdx = (sy * sourceWidth + sx) * 4;
      const templateIdx = (ty * templateWidth + tx) * 4;

      const sourceVal = source[sourceIdx];
      const templateVal = template[templateIdx];

      const diff = sourceVal - templateVal;
      ssd += diff * diff;
      validPixels++;
    }
  }

  if (validPixels === 0) return 0;

  // Normalize by number of pixels
  const meanSSD = ssd / validPixels;

  // Convert to similarity score (0-1, where 1 is perfect match)
  // Assuming pixel values are 0-255, max possible difference per pixel is 255^2 = 65025
  const similarity = 1 - Math.min(meanSSD / 65025, 1);

  return similarity;
}

/**
 * Matching using Hamming distance (count of differing pixels) - VERY fast for binary images
 * Best for preprocessed black/white images
 */
function matchTemplateHamming(
  source: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  template: Uint8ClampedArray,
  templateWidth: number,
  templateHeight: number,
  x: number,
  y: number
): number {
  let differentPixels = 0;
  let validPixels = 0;
  const threshold = 128;

  for (let ty = 0; ty < templateHeight; ty++) {
    for (let tx = 0; tx < templateWidth; tx++) {
      const sx = x + tx;
      const sy = y + ty;

      if (sx >= sourceWidth || sy >= sourceHeight) {
        continue;
      }

      const sourceIdx = (sy * sourceWidth + sx) * 4;
      const templateIdx = (ty * templateWidth + tx) * 4;

      const sourceBinary = source[sourceIdx] > threshold ? 1 : 0;
      const templateBinary = template[templateIdx] > threshold ? 1 : 0;

      if (sourceBinary !== templateBinary) {
        differentPixels++;
      }
      validPixels++;
    }
  }

  if (validPixels === 0) return 0;

  // Return similarity (1 = perfect match, 0 = completely different)
  return 1 - (differentPixels / validPixels);
}

/**
 * Calculate normalized cross-correlation between two image regions
 */
function matchTemplate(
  source: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  template: Uint8ClampedArray,
  templateWidth: number,
  templateHeight: number,
  x: number,
  y: number
): number {
  let sum = 0;
  let templateSum = 0;
  let sourceSum = 0;
  let pixelCount = 0;

  for (let ty = 0; ty < templateHeight; ty++) {
    for (let tx = 0; tx < templateWidth; tx++) {
      const sx = x + tx;
      const sy = y + ty;

      if (sx >= sourceWidth || sy >= sourceHeight) {
        return 0; // Out of bounds
      }

      const sourceIdx = (sy * sourceWidth + sx) * 4;
      const templateIdx = (ty * templateWidth + tx) * 4;

      // Use only the red channel (grayscale, so all channels are the same)
      const sourceVal = source[sourceIdx];
      const templateVal = template[templateIdx];

      sum += sourceVal * templateVal;
      sourceSum += sourceVal * sourceVal;
      templateSum += templateVal * templateVal;
      pixelCount++;
    }
  }

  // Normalized cross-correlation
  const denom = Math.sqrt(sourceSum * templateSum);
  const ncc = denom === 0 ? 0 : sum / denom;

  return ncc;
}

/**
 * Find the best matching digit template at a specific location
 */
async function recognizeDigitAt(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<{ digit: string; confidence: number } | null> {
  const templates = await getTemplates();
  const ctx = canvas.getContext('2d')!;
  const sourceData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Extract the segment being recognized for debugging
  const segmentCanvas = document.createElement('canvas');
  segmentCanvas.width = width;
  segmentCanvas.height = height;
  const segmentCtx = segmentCanvas.getContext('2d')!;
  segmentCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

  let bestMatch = { digit: '', confidence: 0 };
  const matchScores: { digit: string; confidence: number }[] = [];
  let scaledTemplates: { [digit: string]: HTMLCanvasElement } = {};

  // CONFIGURATION FLAGS
  const VERBOSE_LOGGING = false; // Set to true for detailed per-digit logs
  const SHOW_SIZE_INFO = true;   // Show size mismatches (important diagnostic)

  for (const [digit, templateCanvas] of templates.entries()) {
    // Log size info only once (first digit)
    if (SHOW_SIZE_INFO && digit === '0') {
      console.log(`📏 Template size: ${templateCanvas.width}x${templateCanvas.height}, Segment size: ${width}x${height}`);
    }

    // MULTI-SCALE MATCHING STRATEGY
    // Try matching at multiple scales to handle size mismatches
    const tryMultiScale = true; // Set to false to use only segment size
    const scalesToTry: number[] = [];

    if (tryMultiScale) {
      // Try original template size AND scaled to segment height
      const scaleByHeight = height / templateCanvas.height;
      const scaleByWidth = width / templateCanvas.width;
      const averageScale = (scaleByHeight + scaleByWidth) / 2;

      // Try these scale factors
      scalesToTry.push(1.0); // Original template size
      if (Math.abs(scaleByHeight - 1.0) > 0.1) scalesToTry.push(scaleByHeight);
      if (Math.abs(scaleByWidth - 1.0) > 0.1) scalesToTry.push(scaleByWidth);
      if (Math.abs(averageScale - 1.0) > 0.1) scalesToTry.push(averageScale);
    } else {
      // Just scale to match segment size
      const scaleByHeight = height / templateCanvas.height;
      scalesToTry.push(scaleByHeight);
    }

    if (VERBOSE_LOGGING) {
      console.log(`Trying ${scalesToTry.length} scales for digit ${digit}: [${scalesToTry.map(s => s.toFixed(2)).join(', ')}]`);
    }

    let bestConfidenceForDigit = 0;
    let bestTemplateToUse: HTMLCanvasElement = templateCanvas;
    let bestScale = 1.0;

    // CONFIGURABLE: Choose matching algorithm
    type MatchingAlgorithm = 'ncc' | 'ssd' | 'hamming' | 'ensemble';
    const algorithm = 'ncc' as MatchingAlgorithm; // NCC is most robust to misalignment

    // Ensemble mode: Try multiple algorithms and pick the one with highest confidence
    const useEnsemble = algorithm === 'ensemble';

    // Increase search range for better misalignment tolerance
    const searchRange = 5; // pixels to search around the specified position (increased from 3)

    // Try each scale
    for (const scale of scalesToTry) {
      // Scale the template
      const scaledWidth = Math.round(templateCanvas.width * scale);
      const scaledHeight = Math.round(templateCanvas.height * scale);

      const scaledTemplate = document.createElement('canvas');
      scaledTemplate.width = scaledWidth;
      scaledTemplate.height = scaledHeight;
      const scaledCtx = scaledTemplate.getContext('2d')!;

      // Use crisp pixel scaling (no smoothing for pixel art)
      scaledCtx.imageSmoothingEnabled = false;
      scaledCtx.drawImage(templateCanvas, 0, 0, templateCanvas.width, templateCanvas.height, 0, 0, scaledWidth, scaledHeight);

      const templateCtx = scaledTemplate.getContext('2d')!;
      const templateData = templateCtx.getImageData(0, 0, scaledWidth, scaledHeight);

      // Try matching at the specified location (and nearby positions for slight misalignment)
      // searchRange is defined above in the outer scope

      for (let dy = -searchRange; dy <= searchRange; dy++) {
        for (let dx = -searchRange; dx <= searchRange; dx++) {
          let confidence: number;

          if (useEnsemble) {
            // Try all algorithms and take the maximum confidence
            const ncc = matchTemplate(
              sourceData.data,
              canvas.width,
              canvas.height,
              templateData.data,
              scaledWidth,
              scaledHeight,
              x + dx,
              y + dy
            );
            const ssd = matchTemplateSSD(
              sourceData.data,
              canvas.width,
              canvas.height,
              templateData.data,
              scaledWidth,
              scaledHeight,
              x + dx,
              y + dy
            );
            const hamming = matchTemplateHamming(
              sourceData.data,
              canvas.width,
              canvas.height,
              templateData.data,
              scaledWidth,
              scaledHeight,
              x + dx,
              y + dy
            );

            // Take the maximum confidence across all methods
            confidence = Math.max(ncc, ssd, hamming);

            // Log which algorithm performed best (only in verbose mode)
            if (VERBOSE_LOGGING && confidence > 0.5 && Math.random() < 0.1) { // Sample 10%
              const best = ncc >= ssd && ncc >= hamming ? 'NCC' : ssd >= hamming ? 'SSD' : 'Hamming';
              console.log(`Best algo for digit ${digit}: ${best} (NCC: ${ncc.toFixed(3)}, SSD: ${ssd.toFixed(3)}, Hamming: ${hamming.toFixed(3)})`);
            }
          } else {
            // Use single algorithm
            if (algorithm === 'ncc') {
              confidence = matchTemplate(sourceData.data, canvas.width, canvas.height, templateData.data, scaledWidth, scaledHeight, x + dx, y + dy);
            } else if (algorithm === 'ssd') {
              confidence = matchTemplateSSD(sourceData.data, canvas.width, canvas.height, templateData.data, scaledWidth, scaledHeight, x + dx, y + dy);
            } else if (algorithm === 'hamming') {
              confidence = matchTemplateHamming(sourceData.data, canvas.width, canvas.height, templateData.data, scaledWidth, scaledHeight, x + dx, y + dy);
            } else {
              confidence = matchTemplate(sourceData.data, canvas.width, canvas.height, templateData.data, scaledWidth, scaledHeight, x + dx, y + dy);
            }
          }

          if (confidence > bestConfidenceForDigit) {
            bestConfidenceForDigit = confidence;
            bestTemplateToUse = scaledTemplate;
            bestScale = scale;
          }
        }
      }
    }

    // Use the best scale variant for this digit
    scaledTemplates[digit] = bestTemplateToUse;

    // DIAGNOSTIC: Check if template and segment have similar pixel distributions (verbose only)
    if (VERBOSE_LOGGING) {
      const segmentData = segmentCtx.getImageData(0, 0, width, height);
      const templateCtx = bestTemplateToUse.getContext('2d')!;
      const templateData = templateCtx.getImageData(0, 0, bestTemplateToUse.width, bestTemplateToUse.height);
      const templateWhitePixels = countWhitePixels(templateData.data);
      const segmentWhitePixels = countWhitePixels(segmentData.data);
      const templateTotal = bestTemplateToUse.width * bestTemplateToUse.height;
      const segmentTotal = width * height;
      console.log(`Template ${digit} (scale ${bestScale.toFixed(2)}x) white ratio: ${(templateWhitePixels/templateTotal*100).toFixed(1)}%, Segment white ratio: ${(segmentWhitePixels/segmentTotal*100).toFixed(1)}%`);
    }

    matchScores.push({ digit, confidence: bestConfidenceForDigit });

    if (bestConfidenceForDigit > bestMatch.confidence) {
      bestMatch = { digit, confidence: bestConfidenceForDigit };
    }
  }

  // Simplified logging - only show result summary
  const sortedScores = matchScores.sort((a, b) => b.confidence - a.confidence);
  const top3 = sortedScores.slice(0, 3).map(s => `${s.digit}:${(s.confidence*100).toFixed(0)}%`).join(', ');

  console.log(`🔍 Segment at x=${x} → Best: "${bestMatch.digit}" (${(bestMatch.confidence * 100).toFixed(1)}%) | Top 3: ${top3}`);

  // Detailed visual output only if requested
  if (VERBOSE_LOGGING) {
    console.groupCollapsed(`[VERBOSE] Full details for x=${x}`);

    console.log('%c📸 SEGMENT:', 'font-weight: bold; font-size: 14px; color: cyan');
    console.log('%c ', `
      font-size: 1px;
      padding: ${segmentCanvas.height/2}px ${segmentCanvas.width/2}px;
      background: url(${segmentCanvas.toDataURL()}) no-repeat;
      background-size: contain;
    `);

    console.log('%c✅ BEST MATCH (digit ' + bestMatch.digit + '):', 'font-weight: bold; font-size: 14px; color: lime');
    if (scaledTemplates[bestMatch.digit]) {
      console.log('%c ', `
        font-size: 1px;
        padding: ${scaledTemplates[bestMatch.digit].height/2}px ${scaledTemplates[bestMatch.digit].width/2}px;
        background: url(${scaledTemplates[bestMatch.digit].toDataURL()}) no-repeat;
        background-size: contain;
      `);
    }

    // DIAGNOSTIC: Create a side-by-side comparison canvas for the best match
    if (bestMatch.digit && scaledTemplates[bestMatch.digit]) {
      const comparisonCanvas = document.createElement('canvas');
      const template = scaledTemplates[bestMatch.digit];
      comparisonCanvas.width = Math.max(segmentCanvas.width, template.width) * 2 + 10;
      comparisonCanvas.height = Math.max(segmentCanvas.height, template.height);
      const compCtx = comparisonCanvas.getContext('2d')!;

      // White background
      compCtx.fillStyle = 'white';
      compCtx.fillRect(0, 0, comparisonCanvas.width, comparisonCanvas.height);

      // Draw segment on left
      compCtx.drawImage(segmentCanvas, 0, 0);

      // Draw template on right
      compCtx.drawImage(template, segmentCanvas.width + 10, 0);

      console.log('%c🔬 SIDE-BY-SIDE COMPARISON (Segment vs Template):', 'font-weight: bold; font-size: 14px; color: orange');
      console.log('%c ', `
        font-size: 1px;
        padding: ${comparisonCanvas.height/2}px ${comparisonCanvas.width/2}px;
        background: url(${comparisonCanvas.toDataURL()}) no-repeat;
        background-size: contain;
      `);
    }

    console.groupEnd();
  }

  // Require minimum confidence threshold
  if (bestMatch.confidence < 0.6) {
    console.warn(`Low confidence match: ${bestMatch.digit} @ ${bestMatch.confidence.toFixed(3)}`);
    return null;
  }

  return bestMatch;
}

/**
 * Segment and recognize all digits in a preprocessed canvas
 * Assumes digits are arranged horizontally with some spacing
 */
export async function recognizeDigits(canvas: HTMLCanvasElement): Promise<string | null> {
  // Validate canvas dimensions
  if (canvas.width <= 0 || canvas.height <= 0) {
    console.error('Invalid canvas dimensions:', { width: canvas.width, height: canvas.height });
    return null;
  }

  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Find columns that contain any white pixels (digit content)
  const columnHasContent: boolean[] = new Array(width).fill(false);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      if (data[idx] > 128) { // White pixel (after adaptive threshold)
        columnHasContent[x] = true;
        break;
      }
    }
  }

  // Find segments (groups of consecutive columns with content)
  const segments: { start: number; end: number }[] = [];
  let inSegment = false;
  let segmentStart = 0;

  for (let x = 0; x < width; x++) {
    if (columnHasContent[x] && !inSegment) {
      // Start of new segment
      segmentStart = x;
      inSegment = true;
    } else if (!columnHasContent[x] && inSegment) {
      // End of segment
      segments.push({ start: segmentStart, end: x });
      inSegment = false;
    }
  }

  // Don't forget the last segment if it extends to the edge
  if (inSegment) {
    segments.push({ start: segmentStart, end: width });
  }

  // Recognize each segment as a digit
  const recognizedDigits: string[] = [];
  for (const segment of segments) {
    const segmentWidth = segment.end - segment.start;

    // Skip segments that are too small (noise)
    if (segmentWidth < 3) {
      continue;
    }

    // Recognize digit at this segment
    const result = await recognizeDigitAt(canvas, segment.start, 0, segmentWidth, height);

    if (result) {
      recognizedDigits.push(result.digit);
      console.log(`Recognized digit "${result.digit}" with confidence ${result.confidence.toFixed(3)}`);
    } else {
      console.warn(`Failed to recognize digit at x=${segment.start}`);
      return null; // If any digit fails, return null
    }
  }

  if (recognizedDigits.length === 0) {
    return null;
  }

  return recognizedDigits.join('');
}

/**
 * Recognize a slash-separated number pair (e.g., "50/100" for HP)
 * Strategy: Remove the slash and recognize all digits, then parse as "currentmax"
 * We'll assume current and max HP are the same for now (user can edit if different)
 */
export async function recognizeNumberPair(canvas: HTMLCanvasElement): Promise<{ current: number; max: number } | null> {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Remove vertical lines that might be slashes
  // Look for columns that are mostly filled (vertical lines)
  for (let x = 0; x < width; x++) {
    let whitePixels = 0;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      if (data[idx] > 128) {
        whitePixels++;
      }
    }

    // If this column has many white pixels (likely a slash), clear it
    if (whitePixels > height * 0.4) {
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = 0; // Make it black
      }
    }
  }

  // Put the cleaned image back
  ctx.putImageData(imageData, 0, 0);

  // Now recognize all digits (slash is removed)
  const allDigits = await recognizeDigits(canvas);

  if (!allDigits) {
    console.warn('Failed to recognize HP digits after removing slash');
    return null;
  }

  // For now, treat it as a single number (current = max)
  // User can edit manually if current HP differs from max
  const hp = parseInt(allDigits);
  console.log(`Recognized HP value: ${hp} (treating current = max)`);

  return {
    current: hp,
    max: hp
  };
}
