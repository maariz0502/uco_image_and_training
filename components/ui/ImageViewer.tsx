"use client";
import { ImageMetadata } from "@/app/generated/prisma/client";
import CocoImageViewer, { CocoAnnotation } from "./CocoImageViewer"; // Make sure the path is correct for your app!

interface ViewerProps {
  image: ImageMetadata | null;
  onDelete: (id: string) => void;
}

export default function ImageViewer({ image, onDelete }: ViewerProps) {
  if (!image) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
        Select an image to view details
      </div>
    );
  }

  // Safely cast the Prisma JsonValue to our expected CocoAnnotation array
  const annotations = (image.cocoData as unknown as CocoAnnotation[]) || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Toolbar */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="font-bold text-gray-800">{image.filename}</h2>
            <p className="text-xs text-gray-500">
              Uploaded {new Date(image.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          {/* Helpful Badge showing annotation count */}
          {annotations.length > 0 && (
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
              {annotations.length} Annotations
            </span>
          )}
        </div>
        
        <button
          onClick={() => onDelete(image.id)}
          className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition text-sm font-medium"
        >
          Delete Image
        </button>
      </div>

      {/* Canvas / Image Area */}
      <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
        <div className="relative shadow-lg rounded-lg bg-white max-h-full max-w-full flex">
          {/* Replace the raw <img> tag with our intelligent Canvas Viewer */}
          <CocoImageViewer 
            imageUrl={image.s3Path} 
            annotations={annotations} 
            categories={image.categories}
          />
        </div>
      </div>
    </div>
  );
}