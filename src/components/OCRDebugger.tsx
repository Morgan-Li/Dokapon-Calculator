import { useEffect, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { ROI } from '../types';
import { LEFT_CARD_ROIS, RIGHT_CARD_ROIS, REFERENCE_WIDTH, REFERENCE_HEIGHT } from '../core/ocr/rois';
import { PREPROCESS_PRESETS, PreprocessPreset } from '../core/ocr/presets';

interface OCRDebuggerProps {
  imageData: string;
  onClose: () => void;
}

interface PreprocessVariant {
  preset: PreprocessPreset;
  canvas: HTMLCanvasElement;
  text: string;
  confidence: number;
}

interface ROIPreview {
  name: string;
  roi: ROI;
  originalCanvas: HTMLCanvasElement;
  variants: PreprocessVariant[];
}

export function OCRDebugger({ imageData, onClose }: OCRDebuggerProps) {
  const [previews, setPreviews] = useState<ROIPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generatePreviews();
  }, [imageData]);

  const generatePreviews = async () => {
    setIsLoading(true);
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData;
    });

    const allROIs = [
      ...Object.entries(LEFT_CARD_ROIS).map(([name, roi]) => ({ name: `Left ${name}`, roi })),
      ...Object.entries(RIGHT_CARD_ROIS).map(([name, roi]) => ({ name: `Right ${name}`, roi })),
    ];

    const previewList: ROIPreview[] = [];

    // Create Tesseract worker for OCR
    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /+-',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
    });

    for (const { name, roi } of allROIs) {
      // Extract original ROI
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = roi.w;
      originalCanvas.height = roi.h;
      const originalCtx = originalCanvas.getContext('2d')!;
      originalCtx.drawImage(img, roi.x, roi.y, roi.w, roi.h, 0, 0, roi.w, roi.h);

      // Try all preprocessing presets
      const variants: PreprocessVariant[] = [];
      const presetsToTry: PreprocessPreset[] = ['floodFill', 'adaptive', 'sharp', 'simple', 'highContrast'];

      for (const preset of presetsToTry) {
        const config = PREPROCESS_PRESETS[preset];

        // Clone the original canvas for this variant
        const clonedCanvas = document.createElement('canvas');
        clonedCanvas.width = originalCanvas.width;
        clonedCanvas.height = originalCanvas.height;
        const clonedCtx = clonedCanvas.getContext('2d')!;
        clonedCtx.drawImage(originalCanvas, 0, 0);

        // Apply preprocessing
        const processedCanvas = config.apply(clonedCanvas);

        // Run OCR
        const { data } = await worker.recognize(processedCanvas);

        variants.push({
          preset,
          canvas: processedCanvas,
          text: data.text.trim(),
          confidence: data.confidence,
        });
      }

      previewList.push({
        name,
        roi,
        originalCanvas,
        variants,
      });
    }

    // Cleanup worker
    await worker.terminate();

    setPreviews(previewList);
    setIsLoading(false);

    // Draw full image with ROI overlays
    drawFullImageWithROIs(img);
  };

  const drawFullImageWithROIs = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;

    // Set canvas size to match reference dimensions
    canvas.width = REFERENCE_WIDTH;
    canvas.height = REFERENCE_HEIGHT;

    // Draw the aligned image
    ctx.drawImage(img, 0, 0, REFERENCE_WIDTH, REFERENCE_HEIGHT);

    // Draw ROI overlays
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';

    const drawROI = (name: string, roi: ROI, color: string) => {
      ctx.strokeStyle = color;
      ctx.strokeRect(roi.x, roi.y, roi.w, roi.h);
      ctx.fillStyle = color;
      ctx.fillText(name, roi.x, roi.y - 5);
    };

    // Draw left card ROIs in green
    Object.entries(LEFT_CARD_ROIS).forEach(([name, roi]) => {
      drawROI(name, roi, 'rgba(0, 255, 0, 0.9)');
    });

    // Draw right card ROIs in cyan
    Object.entries(RIGHT_CARD_ROIS).forEach(([name, roi]) => {
      drawROI(name, roi, 'rgba(0, 255, 255, 0.9)');
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-auto">
      <div className="container mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">OCR Debug Visualization</h2>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>

          {isLoading ? (
            <div className="text-white text-center py-12">Loading previews...</div>
          ) : (
            <>
              {/* Full image with ROI overlays */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-3">Aligned Image with ROI Overlays</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto border border-gray-700"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Green boxes = Left character | Cyan boxes = Right character
                </p>
              </div>

              {/* Individual ROI previews */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Preprocessing Comparison - Find the Best Method
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Each ROI is processed with 4 different methods. Green highlight = best confidence.
                </p>
                <div className="space-y-6">
                  {previews.map((preview, index) => {
                    // Find best variant
                    const bestVariant = preview.variants.reduce((best, current) =>
                      current.confidence > best.confidence ? current : best
                    );

                    return (
                      <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <div className="font-semibold text-white mb-3 text-lg">{preview.name}</div>
                        <div className="text-xs text-gray-400 mb-2">
                          ROI: {preview.roi.w}x{preview.roi.h} @ ({preview.roi.x},{preview.roi.y})
                        </div>

                        {/* Original */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-400 mb-1">Original Extract:</div>
                          <canvas
                            ref={(canvas) => {
                              if (canvas) {
                                const ctx = canvas.getContext('2d')!;
                                canvas.width = preview.originalCanvas.width;
                                canvas.height = preview.originalCanvas.height;
                                ctx.drawImage(preview.originalCanvas, 0, 0);
                              }
                            }}
                            className="border border-gray-600 bg-gray-900"
                            style={{ imageRendering: 'pixelated', maxHeight: '60px' }}
                          />
                        </div>

                        {/* Preprocessing variants */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {preview.variants.map((variant, vIdx) => {
                            const isBest = variant === bestVariant;
                            const config = PREPROCESS_PRESETS[variant.preset];

                            return (
                              <div
                                key={vIdx}
                                className={`rounded p-2 ${
                                  isBest ? 'bg-green-900/30 ring-2 ring-green-500' : 'bg-gray-800'
                                }`}
                              >
                                <div className="text-xs font-semibold text-white mb-1">
                                  {config.name} {isBest && '⭐'}
                                </div>
                                <div className="text-xs text-gray-400 mb-2">
                                  {config.description}
                                </div>

                                {/* Processed image */}
                                <div className="bg-black p-1 rounded mb-2">
                                  <canvas
                                    ref={(canvas) => {
                                      if (canvas) {
                                        const ctx = canvas.getContext('2d')!;
                                        canvas.width = variant.canvas.width;
                                        canvas.height = variant.canvas.height;
                                        ctx.drawImage(variant.canvas, 0, 0);
                                      }
                                    }}
                                    className="w-full h-auto"
                                    style={{ imageRendering: 'pixelated' }}
                                  />
                                </div>

                                {/* OCR result */}
                                <div className="text-xs font-mono text-white bg-black p-1 rounded mb-1">
                                  <div className="text-gray-400">Tesseract:</div>
                                  "{variant.text || '(empty)'}"
                                  <div className="text-gray-500 mt-1">
                                    {variant.confidence.toFixed(1)}% conf
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
