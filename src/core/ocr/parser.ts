import Tesseract from 'tesseract.js';
import { ROI } from '../../types';
import { LEFT_CARD_ROIS, RIGHT_CARD_ROIS } from './rois';
import { preprocessImageForOCR, upscaleCanvas, floodFillBorders, invertColors } from './preprocess';

// OCR worker (reusable)
let worker: Tesseract.Worker | null = null;

// Initialize Tesseract worker with optimized settings
async function getWorker(): Promise<Tesseract.Worker> {
  if (!worker) {
    worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Configure Tesseract for better accuracy
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /+-',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE, // Treat image as a single text line
    });
  }
  return worker;
}

// Extract text from an ROI in an image (for text fields like Job, Weapon)
async function extractTextFromROI(
  imageData: string,
  roi: ROI
): Promise<string> {
  const w = await getWorker();

  // Extract ROI using canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageData;
  });

  canvas.width = roi.w;
  canvas.height = roi.h;

  // Draw cropped region
  ctx.drawImage(
    img,
    roi.x, roi.y, roi.w, roi.h,
    0, 0, roi.w, roi.h
  );

  // Preprocess the image for better OCR
  // 1. Upscale small text for better recognition (3x works better than 2x)
  const upscaledCanvas = upscaleCanvas(canvas, 3);

  // 2. Apply improved preprocessing with adaptive thresholding
  const processedCanvas = preprocessImageForOCR(upscaledCanvas, {
    contrast: 1.3,        // Less aggressive contrast
    brightness: 0,        // No brightness adjustment
    adaptiveThreshold: true, // Use adaptive thresholding for better results
  });

  // Run OCR on the preprocessed region
  const { data } = await w.recognize(processedCanvas);

  // Log confidence for debugging
  console.log(`OCR extracted "${data.text.trim()}" with confidence ${data.confidence}`);

  return data.text.trim();
}

// Extract numbers from an ROI using TESSERACT with flood fill preprocessing
async function extractNumberFromROI(
  imageData: string,
  roi: ROI
): Promise<string | null> {
  const w = await getWorker();

  // Extract ROI using canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageData;
  });

  canvas.width = roi.w;
  canvas.height = roi.h;

  // Draw cropped region
  ctx.drawImage(
    img,
    roi.x, roi.y, roi.w, roi.h,
    0, 0, roi.w, roi.h
  );

  // NEW APPROACH: Flood fill + invert for better Tesseract recognition
  // 1. Upscale
  const upscaledCanvas = upscaleCanvas(canvas, 3);

  // 2. Apply adaptive threshold
  const thresholded = preprocessImageForOCR(upscaledCanvas, {
    contrast: 1.3,
    brightness: 0,
    adaptiveThreshold: true,
  });

  // 3. Flood fill from borders to remove background
  const filled = floodFillBorders(thresholded, 0);

  // 4. Invert colors (black text on white background for Tesseract)
  const processedCanvas = invertColors(filled);

  // Run Tesseract OCR
  const { data } = await w.recognize(processedCanvas);

  // Extract only digits from result
  const digitsOnly = data.text.replace(/\D/g, ''); // Remove non-digits

  if (digitsOnly) {
    console.log(`Tesseract (flood fill) extracted number: "${digitsOnly}" (confidence: ${data.confidence.toFixed(1)}%)`);
    return digitsOnly;
  } else {
    console.warn(`Tesseract failed for ROI at (${roi.x}, ${roi.y}) - got: "${data.text}"`);
    return null;
  }
}

// Extract current HP from an ROI using TESSERACT with flood fill preprocessing
async function extractHPFromROI(
  imageData: string,
  roi: ROI
): Promise<number | null> {
  const w = await getWorker();

  // Extract ROI using canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageData;
  });

  canvas.width = roi.w;
  canvas.height = roi.h;

  // Draw cropped region
  ctx.drawImage(
    img,
    roi.x, roi.y, roi.w, roi.h,
    0, 0, roi.w, roi.h
  );

  // NEW APPROACH: Flood fill + invert for better Tesseract recognition
  const upscaledCanvas = upscaleCanvas(canvas, 3);
  const thresholded = preprocessImageForOCR(upscaledCanvas, {
    contrast: 1.3,
    brightness: 0,
    adaptiveThreshold: true,
  });
  const filled = floodFillBorders(thresholded, 0);
  const processedCanvas = invertColors(filled);

  // Run Tesseract OCR
  const { data } = await w.recognize(processedCanvas);

  // Extract current HP (first number before the slash)
  const hpMatch = data.text.match(/(\d+)/);

  if (hpMatch) {
    const current = parseInt(hpMatch[1]);
    console.log(`Tesseract (flood fill) extracted HP: ${current} (confidence: ${data.confidence.toFixed(1)}%)`);
    return current;
  }

  console.warn(`Tesseract failed for HP at (${roi.x}, ${roi.y}) - got: "${data.text}"`);
  return null;
}

// Extract all stats from one character card
export async function extractCharacterStats(
  imageData: string,
  side: 'left' | 'right'
): Promise<{
  job: string;
  weapon: string;
  offensiveMagic: string;
  defensiveMagic: string;
  hp: number | null;
  at: number | null;
  df: number | null;
  mg: number | null;
  sp: number | null;
}> {
  const rois = side === 'left' ? LEFT_CARD_ROIS : RIGHT_CARD_ROIS;

  // Extract text fields (Job, Weapon, Magic) using Tesseract
  // Extract numeric fields using flood fill + Tesseract
  const [jobText, weaponText, offensiveMagicText, defensiveMagicText, hp, atText, dfText, mgText, spText] = await Promise.all([
    extractTextFromROI(imageData, rois.job),
    extractTextFromROI(imageData, rois.weapon),
    extractTextFromROI(imageData, rois.offensiveMagic),
    extractTextFromROI(imageData, rois.defensiveMagic),
    extractHPFromROI(imageData, rois.hp),
    extractNumberFromROI(imageData, rois.at),
    extractNumberFromROI(imageData, rois.df),
    extractNumberFromROI(imageData, rois.mg),
    extractNumberFromROI(imageData, rois.sp),
  ]);

  return {
    job: jobText,
    weapon: weaponText,
    offensiveMagic: offensiveMagicText,
    defensiveMagic: defensiveMagicText,
    hp,
    at: atText ? parseInt(atText) : null,
    df: dfText ? parseInt(dfText) : null,
    mg: mgText ? parseInt(mgText) : null,
    sp: spText ? parseInt(spText) : null,
  };
}

// Cleanup worker when done
export async function cleanupOCR() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
