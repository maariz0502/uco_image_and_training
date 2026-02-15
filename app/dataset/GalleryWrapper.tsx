"use client";

import { useState } from "react";
import { GalleryImage } from "@/app/types";
import { uploadImage, deleteImage } from "@/app/actions/image";
import ImageSidebar from "@/components/ui/ImageSidebar";
import ImageViewer from "@/components/ui/ImageViewer";

interface GalleryWrapperProps {
  initialImages: GalleryImage[];
}

export default function GalleryWrapper({ initialImages }: GalleryWrapperProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [selectedId, setSelectedId] = useState<string | null>(initialImages[0]?.id || null);
  const [isUploading, setIsUploading] = useState(false);

  const selectedImage = images.find((img) => img.id === selectedId) || null;

  // --- Handlers ---

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    // Call Server Action
    const result = await uploadImage(formData);

    if (result.success && result.image) {
      // Add new image to top of list and select it
      // We manually cast because the result is from Prisma, but fits our type
      const newImg = { ...result.image, url: result.image.s3Path, createdAt: result.image.createdAt.toISOString() } as unknown as GalleryImage;
      
      setImages([newImg, ...images]);
      setSelectedId(newImg.id);
    } else {
      alert("Upload failed");
    }
    setIsUploading(false);
    // Reset input
    e.target.value = ""; 
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Permanently delete this image?")) return;
    
    const result = await deleteImage(id);
    
    if (result.success) {
      const remaining = images.filter((img) => img.id !== id);
      setImages(remaining);
      // If we deleted the selected image, pick the first one available
      if (selectedId === id) {
        setSelectedId(remaining[0]?.id || null);
      }
    } else {
      alert("Failed to delete");
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]"> 
      {/* Assuming you have a 64px Nav bar, otherwise use h-screen */}
      
      <ImageSidebar 
        images={images} 
        selectedId={selectedId} 
        onSelect={setSelectedId} 
        onUpload={handleUpload}
        isUploading={isUploading}
      />
      
      <ImageViewer 
        image={selectedImage} 
        onDelete={handleDelete} 
      />
    </div>
  );
}