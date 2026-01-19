import { useState, useRef, useEffect } from 'react';
import { OVERLAY_GUIDES, REFERENCE_WIDTH, REFERENCE_HEIGHT } from '../core/ocr/rois';

interface ImageAlignmentProps {
  imageData: string;
  onAlignmentComplete: (alignedImageData: string, scale: number) => void;
  onCancel: () => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export function ImageAlignment({ imageData, onAlignmentComplete, onCancel }: ImageAlignmentProps) {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image and set initial scale
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      // Calculate initial scale to fit the canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        const initialScale = Math.min(scaleX, scaleY) * 0.8;
        setTransform({
          x: (canvas.width - img.width * initialScale) / 2,
          y: (canvas.height - img.height * initialScale) / 2,
          scale: initialScale,
        });
      }
    };
    img.src = imageData;
  }, [imageData]);

  // Redraw canvas whenever transform changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image with current transform (user can drag/scale this)
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // Draw overlay guides - FIXED on canvas (don't move with image)
    // User drags the image to align it with these fixed guides

    // Scale to fit reference dimensions in canvas, maintaining aspect ratio
    const canvasAspect = canvas.width / canvas.height;
    const refAspect = REFERENCE_WIDTH / REFERENCE_HEIGHT;

    let guideScale: number;
    let offsetX: number;
    let offsetY: number;

    if (canvasAspect > refAspect) {
      // Canvas is wider - fit to height and center horizontally
      guideScale = canvas.height / REFERENCE_HEIGHT;
      offsetX = (canvas.width - REFERENCE_WIDTH * guideScale) / 2;
      offsetY = 0;
    } else {
      // Canvas is taller - fit to width and center vertically
      guideScale = canvas.width / REFERENCE_WIDTH;
      offsetX = 0;
      offsetY = (canvas.height - REFERENCE_HEIGHT * guideScale) / 2;
    }

    // Draw reference frame border to show the alignment area
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(offsetX, offsetY, REFERENCE_WIDTH * guideScale, REFERENCE_HEIGHT * guideScale);

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Draw card outlines - fixed on canvas, centered
    Object.entries(OVERLAY_GUIDES).forEach(([key, guide]) => {
      if (key.includes('Outline')) {
        ctx.strokeRect(
          guide.x * guideScale + offsetX,
          guide.y * guideScale + offsetY,
          guide.w * guideScale,
          guide.h * guideScale
        );
      }
    });

    // Draw field boxes with labels - fixed on canvas, centered
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';

    const drawLabeledBox = (label: string, guide: { x: number; y: number; w: number; h: number }) => {
      const x = guide.x * guideScale + offsetX;
      const y = guide.y * guideScale + offsetY;
      const w = guide.w * guideScale;
      const h = guide.h * guideScale;

      ctx.strokeRect(x, y, w, h);
      ctx.fillText(label, x, y - 5);
    };

    // Field label mapping: extract label from key name (e.g., "leftJobBox" -> "Job")
    const fieldLabels: Record<string, string> = {
      Job: 'Job',
      HP: 'HP',
      Stats: 'AT/DF/MG/SP',
      Weapon: 'Weapon',
      OffensiveMagic: 'Off. Magic',
      DefensiveMagic: 'Def. Magic',
    };

    // Draw all non-outline boxes with their labels
    Object.entries(OVERLAY_GUIDES).forEach(([key, guide]) => {
      if (key.includes('Outline')) return;

      // Extract field name from key (e.g., "leftJobBox" -> "Job", "rightStatsBox" -> "Stats")
      const fieldName = Object.keys(fieldLabels).find(f => key.includes(f));
      if (fieldName) {
        drawLabeledBox(fieldLabels[fieldName], guide);
      }
    });
  }, [transform]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setTransform({
      ...transform,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(0.1, Math.min(3, transform.scale * delta));

    // Zoom towards mouse position
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setTransform({
        x: mouseX - (mouseX - transform.x) * (newScale / transform.scale),
        y: mouseY - (mouseY - transform.y) * (newScale / transform.scale),
        scale: newScale,
      });
    }
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Create a new canvas with the reference dimensions
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = REFERENCE_WIDTH;
    outputCanvas.height = REFERENCE_HEIGHT;
    const ctx = outputCanvas.getContext('2d')!;

    // Calculate guide positioning (same as in the render)
    const canvasAspect = canvas.width / canvas.height;
    const refAspect = REFERENCE_WIDTH / REFERENCE_HEIGHT;

    let guideScale: number;
    let offsetX: number;
    let offsetY: number;

    if (canvasAspect > refAspect) {
      guideScale = canvas.height / REFERENCE_HEIGHT;
      offsetX = (canvas.width - REFERENCE_WIDTH * guideScale) / 2;
      offsetY = 0;
    } else {
      guideScale = canvas.width / REFERENCE_WIDTH;
      offsetX = 0;
      offsetY = (canvas.height - REFERENCE_HEIGHT * guideScale) / 2;
    }

    // The user has positioned the image so it aligns with the guide overlay
    // Guide overlay is at position (offsetX, offsetY) with scale guideScale
    // User's image is at position (transform.x, transform.y) with scale transform.scale

    // To extract the aligned region:
    // 1. Calculate where (0,0) of the reference frame is in the transformed image space
    const sourceX = (offsetX - transform.x) / transform.scale;
    const sourceY = (offsetY - transform.y) / transform.scale;

    // 2. Calculate the size we need to extract from the source image
    const sourceWidth = (REFERENCE_WIDTH * guideScale) / transform.scale;
    const sourceHeight = (REFERENCE_HEIGHT * guideScale) / transform.scale;

    // 3. Draw the extracted region scaled to reference dimensions
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,  // Source region from uploaded image
      0, 0, REFERENCE_WIDTH, REFERENCE_HEIGHT       // Destination: full output canvas
    );

    const alignedImageData = outputCanvas.toDataURL('image/png');
    onAlignmentComplete(alignedImageData, 1.0); // Scale is now normalized to 1.0
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg max-w-6xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Align Screenshot</h2>
        <p className="text-gray-300 mb-4">
          Drag to move, scroll to zoom. Align the character cards with the red overlay boxes.
        </p>

        <div ref={containerRef} className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
          <canvas
            ref={canvasRef}
            width={1200}
            height={750}
            className="cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
          >
            Confirm Alignment
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <p><strong>Tips:</strong></p>
          <ul className="list-disc list-inside mt-2">
            <li>Use mouse wheel to zoom in/out</li>
            <li>Click and drag to reposition</li>
            <li>Align the character info boxes with the red overlay guides</li>
            <li>The Job, HP, and stat numbers should fit within the labeled boxes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
