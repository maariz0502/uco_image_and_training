"use client";
import { useState } from "react";
import { ImageMetadata } from "@/app/generated/prisma/client";
import CocoImageViewer, { CocoAnnotation } from "./CocoImageViewer";

interface ViewerProps {
  image: ImageMetadata | null;
  onDelete: (id: string) => void;
}

export default function ImageViewer({ image, onDelete }: ViewerProps) {
  // State to toggle the annotations side panel
  const [panelState, setPanelState] = useState<"idle" | "open" | "closing">(
    "idle",
  );

  if (!image) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
        Select an image to view details
      </div>
    );
  }

  const annotations = (image.cocoData as unknown as CocoAnnotation[]) || [];
  const categories = (image.categories as string[]) || [];

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

          {annotations.length > 0 && (
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
              {annotations.length} Annotations
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(image.id)}
            className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition text-sm font-medium"
          >
            Delete Image
          </button>

          {/* Hamburger Menu Button */}
          <button
            onClick={() =>
              setPanelState(panelState === "open" ? "closing" : "open")
            }
            className={`p-1.5 rounded transition flex items-center justify-center ${
              panelState === "open"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Toggle Raw JSON"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area - This container is now relative */}
      <div className="flex-1 p-8 flex items-center justify-center overflow-auto bg-gray-50 relative">
        {/* Canvas / Image Area */}
        <div className="relative shadow-lg rounded-lg bg-white max-h-full max-w-full flex z-10">
          <CocoImageViewer
            imageUrl={image.s3Path}
            annotations={annotations}
            categories={categories}
          />
        </div>

        {/* Sliding Raw JSON Data Panel - This container is now absolute */}
        {panelState !== "idle" && (
          <div
            onAnimationEnd={() => {
              // Completely remove the panel from the DOM ONLY when the closing animation finishes
              if (panelState === "closing") setPanelState("idle");
            }}
            className={`absolute top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col z-20 custom-scrollbar ${
              panelState === "open" ? "menu-open" : "menu-closing"
            }`}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
              <h3 className="font-bold text-gray-800 text-sm">
                Raw Annotation JSON
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {annotations.length} items
                </span>
                {/* Tiny Close Button for easier mobile navigation */}
                <button
                  onClick={() => setPanelState("closing")}
                  className="text-red-400 hover:text-red-600"
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
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-1 bg-gray-50">
              {annotations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-10">
                  No annotations found.
                </p>
              ) : (
                <pre className="bg-gray-900 text-white p-4 rounded-lg text-xs font-mono overflow-auto h-full shadow-inner custom-scrollbar">
                  {JSON.stringify(annotations, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
