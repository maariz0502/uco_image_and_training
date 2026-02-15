"use client";
import { GalleryImage, ImageStatus } from "@/app/types";

interface SidebarProps {
  images: GalleryImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

export default function ImageSidebar({ images, selectedId, onSelect, onUpload, isUploading }: SidebarProps) {

  // Helper to determine badge color based on your new Enum
  const getStatusBadgeStyles = (status: ImageStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "review":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "todo":
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  // Helper to make "in_progress" look like "In Progress"
  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-full flex-shrink-0">
      {/* Upload Header */}
      <div className="p-4 border-b border-gray-100 shrink-0">
        <label className={`flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition shadow-sm font-medium ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? "Uploading..." : "+ Upload Image"}
          <input type="file" className="hidden" accept="image/*" onChange={onUpload} disabled={isUploading} />
        </label>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto">
        {images.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No images found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => onSelect(img.id)}
                className={`p-3 cursor-pointer flex items-center gap-3 transition hover:bg-gray-50 group ${
                  selectedId === img.id ? "bg-blue-50/60 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                }`}
              >
                {/* Thumbnail */}
                <div className="h-12 w-12 bg-gray-200 rounded-md object-cover flex-shrink-0 overflow-hidden border border-gray-100">
                  <img src={img.s3Path} alt={img.filename} className="w-full h-full object-cover" />
                </div>
                
                {/* Metadata */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate mb-1 ${selectedId === img.id ? 'text-blue-900' : 'text-gray-700'}`}>
                    {img.filename}
                  </p>
                  
                  {/* Status Badge */}
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold ${getStatusBadgeStyles(img.status)}`}>
                    {formatStatusLabel(img.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}