"use client";

import { useEffect, useRef } from "react";

// Define the shape of your COCO annotation
export interface CocoAnnotation {
  id: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  category_id: number;
  attributes?: {
    occluded?: boolean;
    rotation?: number;
  };
}

interface CocoImageViewerProps {
  imageUrl: string;
  annotations: CocoAnnotation[];
  categories: String[];
}

export default function CocoImageViewer({
  imageUrl,
  annotations,
  categories,
}: CocoImageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Create a native Image object
    const img = new Image();

    // TODO:  may need to set crossOrigin to avoid CORS issues when drawing on canvas.
    //  Uncomment the line below if needed.
    // To avoid Cross-Origin Canvas tainting if images are hosted on S3/CloudFront
    // img.crossOrigin = "anonymous";

    img.src = imageUrl;

    // 2. Wait for the image to load before drawing
    img.onload = () => {
      // Set the canvas to the exact intrinsic dimensions of the image
      // This prevents the bounding boxes from warping or shifting!
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw the base image onto the canvas
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

      // 3. Loop through and draw each COCO bounding box
      annotations.forEach((ann) => {
        // Destructure the COCO array: [x_min, y_min, width, height]
        const [x, y, width, height] = ann.bbox;

        // Box styling
        ctx.strokeStyle = "#00FF00"; // Bright green
        ctx.lineWidth = Math.max(2, img.naturalWidth * 0.003); // Scale line thickness based on image size
        ctx.lineJoin = "round";

        // Draw the rectangle
        ctx.strokeRect(x, y, width, height);

        // Optional: Draw a background for the label text so it's readable
        const label = `${categories[ann.category_id - 1]}`;
        console.log("Category ID:", ann.category_id, "Label:", label); // Debug log to verify category mapping
        ctx.font = `bold ${Math.max(14, img.naturalWidth * 0.015)}px Arial`;
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = "#00FF00";
        ctx.fillRect(x, y - 24, textWidth + 8, 24); // Draw label background above the box

        // Draw the label text
        ctx.fillStyle = "#000000"; // Black text
        ctx.fillText(label, x + 4, y - 6);
      });
    };
  }, [imageUrl, annotations]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
      {/* The canvas will automatically scale to fit the container while maintaining aspect ratio */}
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto object-contain shadow-sm"
      />
    </div>
  );
}
