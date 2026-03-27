"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, CheckCircle2 } from "lucide-react"; // Added a couple icons for the modal
import { deleteImage } from "@/app/actions/image";
import ImageSidebar from "@/components/ui/ImageSidebar";
import ImageViewer from "@/components/ui/ImageViewer";
import { ImageMetadata } from "../generated/prisma/client";
import { compileCocoAction } from "@/app/actions/training";

interface GalleryWrapperProps {
  initialImages: ImageMetadata[];
}

export default function GalleryWrapper({ initialImages }: GalleryWrapperProps) {
  const router = useRouter();
  const [images, setImages] = useState<ImageMetadata[]>(initialImages);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialImages[0]?.id || null,
  );

  // Training Selection State
  const [trainingIds, setTrainingIds] = useState<string[]>([]);

  // NEW: State to control the Review screen
  const [showReview, setShowReview] = useState(false);

  // Search State
  const [inputValue, setInputValue] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const filteredImages = images.filter((img) => {
    if (!activeSearch) return true;
    const searchLower = activeSearch.toLowerCase();
    const categories = (img.categories as string[]) || [];
    const tags = (img.tags as string[]) || [];
    const allSearchableTerms = [...categories, ...tags, img.filename];

    return allSearchableTerms.some((term) =>
      term.toLowerCase().includes(searchLower),
    );
  });

  const selectedImage = images.find((img) => img.id === selectedId) || null;

  // --- Handlers ---
  const handleUploadRedirect = () => router.push("/dataset/upload");

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this image?")) return;
    const result = await deleteImage(id);
    if (result.success) {
      const remaining = images.filter((img) => img.id !== id);
      setImages(remaining);
      setTrainingIds((prev) => prev.filter((tId) => tId !== id));
      if (selectedId === id) setSelectedId(remaining[0]?.id || null);
    } else {
      alert("Failed to delete");
    }
  };

  const toggleTrainingId = (id: string) => {
    setTrainingIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id],
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredImages.map((img) => img.id);
    const combined = Array.from(new Set([...trainingIds, ...filteredIds]));
    setTrainingIds(combined);
  };

  const deselectAllFiltered = () => {
    const filteredIds = filteredImages.map((img) => img.id);
    setTrainingIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
  };

  const handleConfirmAndTrain = async () => {
    // TODOD: You'll need to get the actual logged-in user's ID from your auth session
    const currentUserId = "e6ff2d18-0d9e-4daf-9af5-dd467c556d7e"; // <-- REPLACE THIS WITH REAL USER ID

    const result = await compileCocoAction(trainingIds, currentUserId);

    if (result.success) {
      alert("Success! Training job queued.");
      setShowReview(false);
      setTrainingIds([]);
      router.push("/training");
    } else {
      alert("Error: " + result.error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] relative">
      {/* --- NEW: Full Screen Review Overlay --- */}
      {showReview && (
        <div className="absolute inset-0 z-50 bg-gray-50 flex flex-col">
          {/* Review Header */}
          <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center shrink-0 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Review Training Dataset
              </h2>
              <p className="text-gray-500 mt-1">
                You have selected {trainingIds.length} images for this YOLOv8
                training run.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowReview(false)}
                className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition"
              >
                Back to Gallery
              </button>
              <button
                onClick={handleConfirmAndTrain}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-md flex items-center gap-2"
              >
                <CheckCircle2 size={20} />
                Confirm & Start Training
              </button>
            </div>
          </div>

          {/* Review Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images
                .filter((img) => trainingIds.includes(img.id))
                .map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-white shadow-sm"
                  >
                    <img
                      src={img.s3Path}
                      alt={img.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Hover overlay to easily remove an image if they spot a mistake */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => toggleTrainingId(img.id)}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-600 flex items-center gap-1"
                      >
                        <X size={16} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {/* --- END REVIEW OVERLAY --- */}

      {/* Top Bar with Search AND Training Controls */}
      <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-md">
          <input
            type="text"
            placeholder="Filter by tags, categories, or filename..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setActiveSearch(inputValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => setActiveSearch(inputValue)}
            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
          >
            <Search size={20} />
          </button>
          {activeSearch && (
            <button
              onClick={() => {
                setInputValue("");
                setActiveSearch("");
              }}
              className="text-sm text-gray-500 hover:text-gray-800 underline ml-2 whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>

        {/* Training Right Side */}
        <div className="flex items-center gap-3">
          <button
            onClick={selectAllFiltered}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 transition"
          >
            Select All Filtered
          </button>
          <button
            onClick={deselectAllFiltered}
            className="text-sm text-gray-500 hover:text-gray-800 font-medium px-2 transition"
          >
            Deselect Filtered
          </button>

          <button
            onClick={() =>
              setShowReview(true)
            } /* <-- CHANGED THIS TO OPEN MODAL */
            disabled={trainingIds.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition text-sm font-bold shadow-sm flex items-center gap-2"
          >
            <span className="bg-white/20 px-2 py-0.5 rounded-md">
              {trainingIds.length}
            </span>
            Review & Train
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <ImageSidebar
          images={filteredImages}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUploadClick={handleUploadRedirect}
          trainingIds={trainingIds}
          onToggleTraining={toggleTrainingId}
        />
        <ImageViewer image={selectedImage} onDelete={handleDelete} />
      </div>
    </div>
  );
}
