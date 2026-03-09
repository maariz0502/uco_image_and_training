// app/dataset/GalleryWrapper.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // <-- Add this
import { deleteImage } from "@/app/actions/image";
import ImageSidebar from "@/components/ui/ImageSidebar";
import ImageViewer from "@/components/ui/ImageViewer";
import { ImageMetadata } from "../generated/prisma/client";

interface GalleryWrapperProps {
  initialImages: ImageMetadata[];
}

export default function GalleryWrapper({ initialImages }: GalleryWrapperProps) {
  const router = useRouter();
  const [images, setImages] = useState<ImageMetadata[]>(initialImages);
  const [selectedId, setSelectedId] = useState<string | null>(initialImages[0]?.id || null);

  const selectedImage = images.find((img) => img.id === selectedId) || null;

  // --- Handlers ---

  // NEW: Redirect to the mass upload page instead of handling it here
  const handleUploadRedirect = () => {
    router.push("/dataset/upload");
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Permanently delete this image?")) return;
    
    const result = await deleteImage(id);
    
    if (result.success) {
      const remaining = images.filter((img) => img.id !== id);
      setImages(remaining);
      if (selectedId === id) {
        setSelectedId(remaining[0]?.id || null);
      }
    } else {
      alert("Failed to delete");
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]"> 
      <ImageSidebar 
        images={images} 
        selectedId={selectedId} 
        onSelect={setSelectedId} 
        onUploadClick={handleUploadRedirect} 
      />
      
      <ImageViewer 
        image={selectedImage} 
        onDelete={handleDelete} 
      />
    </div>
  );
}