"use client";
import { GalleryImage } from "@/app/types";

interface ViewerProps {
  image: GalleryImage | null;
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

  console.log("SERVER IMAGES:", JSON.stringify(image, null, 2));

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Toolbar */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shadow-sm z-10">
        <div>
           <h2 className="font-bold text-gray-800">{image.filename}</h2>
           <p className="text-xs text-gray-500">Uploaded {new Date(image.createdAt).toLocaleDateString()}</p>
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
        <div className="relative shadow-lg rounded-lg overflow-hidden bg-white max-h-full max-w-full">
           <img 
             src={image.s3Path} 
             alt={image.filename} 
             className="max-w-full max-h-[80vh] object-contain"
           />
        </div>
      </div>
    </div>
  );
}