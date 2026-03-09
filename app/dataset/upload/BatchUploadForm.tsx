"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadBatch } from "@/app/actions/image";

interface PreppedImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface ParsedCocoFile {
  id: string;
  file: File;
  stats?: {
    imagesCount: number;
    annotationsCount: number;
    categories: string[];
  };
  error?: string;
}

export default function BatchUploadForm() {
  const router = useRouter();

  const [images, setImages] = useState<PreppedImage[]>([]);
  const [cocoFiles, setCocoFiles] = useState<ParsedCocoFile[]>([]);
  const [isParsingCoco, setIsParsingCoco] = useState(false);

  const [manualTags, setManualTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // New states for drag and drop styling
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingCoco, setIsDraggingCoco] = useState(false);

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  // --- Reusable File Processing Logic ---
  const processImageFiles = (files: File[]) => {
    // Only accept image files
    const validImages = files.filter((file) => file.type.startsWith("image/"));

    const newPreppedImages = validImages.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newPreppedImages]);
  };

  const processCocoFiles = async (files: File[]) => {
    // Only accept JSON files
    const validJsons = files.filter(
      (file) => file.type === "application/json" || file.name.endsWith(".json"),
    );

    if (validJsons.length === 0) return;

    setIsParsingCoco(true);
    const newParsedFiles: ParsedCocoFile[] = [];

    for (const file of validJsons) {
      const id = Math.random().toString(36).substring(7);
      try {
        const text = await file.text();
        const json = JSON.parse(text);

        if (!json.images || !json.categories || !json.annotations) {
          throw new Error("Missing images, categories, or annotations arrays.");
        }

        const categoryNames = Array.from(
          new Set(json.categories.map((c: any) => c.name)),
        );

        newParsedFiles.push({
          id,
          file,
          stats: {
            imagesCount: json.images.length,
            annotationsCount: json.annotations.length,
            categories: categoryNames as string[],
          },
        });
      } catch (err: any) {
        newParsedFiles.push({
          id,
          file,
          error: err.message || "Invalid JSON format.",
        });
      }
    }

    setCocoFiles((prev) => [...prev, ...newParsedFiles]);
    setIsParsingCoco(false);
  };

  // --- Input Handlers ---
  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processImageFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleCocoSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processCocoFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  // --- Drag and Drop Handlers ---
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImages(false);
    if (e.dataTransfer.files)
      processImageFiles(Array.from(e.dataTransfer.files));
  };

  const handleCocoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingCoco(false);
    if (e.dataTransfer.files)
      processCocoFiles(Array.from(e.dataTransfer.files));
  };

  const removeImage = (idToRemove: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== idToRemove);
      const removedImg = prev.find((img) => img.id === idToRemove);
      if (removedImg) URL.revokeObjectURL(removedImg.previewUrl);
      return filtered;
    });
  };

  const removeCocoFile = (idToRemove: string) => {
    setCocoFiles((prev) => prev.filter((c) => c.id !== idToRemove));
  };

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) return alert("Please select at least one image.");

    const hasCocoErrors = cocoFiles.some((c) => c.error);
    if (hasCocoErrors)
      return alert("Please remove invalid COCO files before uploading.");

    setIsUploading(true);

    const formData = new FormData();
    images.forEach((img) => formData.append("images", img.file));

    cocoFiles.forEach((coco) => {
      if (!coco.error) formData.append("cocoJsons", coco.file);
    });

    const tagsArray = manualTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    formData.append("manualTags", JSON.stringify(tagsArray));

    try {
      const result = await uploadBatch(formData);
      if (result.success) {
        router.push("/dataset");
      } else {
        alert("Upload failed: " + result.error);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 flex flex-col h-full">
      {/* Image Staging Area */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Selected Images{" "}
            <span className="text-gray-500 text-base font-normal">
              ({images.length})
            </span>
          </h2>

          <label className="button px-4 py-2 font-semibold rounded-lg cursor-pointer shadow-sm">
            + Add More Images
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelection}
              className="hidden"
            />
          </label>
        </div>

        {/* --- Image Dropzone --- */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingImages(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingImages(false);
          }}
          onDrop={handleImageDrop}
          className={`flex-1 border-2 border-dashed rounded-xl overflow-y-scroll flex flex-col items-center justify-center max-width-100 max-h-100 p-6 transition-colors duration-200 ${
            isDraggingImages
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-gray-50/50"
          }`}
        >
          {images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 pointer-events-none">
              <svg
                className={`w-16 h-16 mb-4 ${isDraggingImages ? "text-blue-400" : "text-gray-300"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-medium">
                {isDraggingImages
                  ? "Drop images here"
                  : "Drag & drop images here or select files"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-square rounded-lg border bg-white shadow-sm overflow-hidden"
                >
                  <img
                    src={img.previewUrl}
                    alt={img.file.name}
                    className="w-full h-full object-cover transition duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition duration-200">
                    <p className="text-white text-xs truncate font-medium">
                      {img.file.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 bg-red-500/90 text-white w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600 shadow-md"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COCO Upload Area */}
      <div className="space-y-2 flex flex-col min-h-[250px]">
        <div className="flex items-center justify-between">
          <label className="block font-semibold text-gray-800">
            COCO Annotations (Optional)
          </label>
          <label className="button px-4 py-2 font-semibold rounded-lg cursor-pointer shadow-sm">
            + Add JSON
            <input
              type="file"
              multiple
              accept=".json,application/json"
              onChange={handleCocoSelection}
              className="hidden"
            />
          </label>
        </div>

        {/* --- COCO Dropzone --- */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingCoco(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingCoco(false);
          }}
          onDrop={handleCocoDrop}
          className={`flex-1 border-2 border-dashed rounded-lg p-4 min-h-[120px] max-h-[400px] overflow-y-auto flex flex-col justify-center items-center transition-colors duration-200 ${
            isDraggingCoco
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white"
          }`}
        >
          {cocoFiles.length === 0 && !isParsingCoco && (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm pointer-events-none">
              {isDraggingCoco
                ? "Drop JSON files here"
                : "Drag & drop JSON files here"}
            </div>
          )}

          {isParsingCoco && (
            <div className="text-sm text-blue-600 animate-pulse text-center mt-4">
              Parsing files...
            </div>
          )}

          {cocoFiles.length > 0 && (
            <div className="space-y-2 w-full">
              {cocoFiles.map((coco) => (
                <div
                  key={coco.id}
                  className={`p-3 rounded border text-sm relative ${
                    coco.error
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold truncate pr-6">
                      📄 {coco.file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCocoFile(coco.id)}
                      className="text-red-500 hover:text-red-700 font-bold absolute top-3 right-3"
                    >
                      ✕
                    </button>
                  </div>

                  {coco.error ? (
                    <p className="text-xs text-red-600 font-medium">
                      ⚠️ {coco.error}
                    </p>
                  ) : coco.stats ? (
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold text-blue-700">
                        {coco.stats.imagesCount}
                      </span>{" "}
                      imgs,{" "}
                      <span className="font-semibold text-green-700">
                        {coco.stats.annotationsCount}
                      </span>{" "}
                      anns
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Tags */}
      <div className="space-y-2 flex flex-col">
        <label className="block font-semibold text-gray-800">
          Global Tags (Optional)
        </label>
        <div className="flex-1 flex flex-col justify-center">
          <input
            type="text"
            value={manualTags}
            onChange={(e) => setManualTags(e.target.value)}
            placeholder="e.g., night view, cloudy, highway"
            className="w-full border-gray-300 shadow-sm border p-3 rounded-lg text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          <p className="text-xs text-gray-500 mt-2">
            Separated by commas. Applied to all staged images.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={
          isUploading || images.length === 0 || cocoFiles.some((c) => c.error)
        }
        className="button w-full md:w-auto md:float-right px-8 py-4 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 text-lg"
      >
        {isUploading
          ? "Uploading & Processing..."
          : `Upload ${images.length} File${images.length !== 1 ? "s" : ""}`}
      </button>
    </form>
  );
}
