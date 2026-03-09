import { getImages } from "@/app/actions/image";
import GalleryWrapper from "@/app/dataset/GalleryWrapper";

export const metadata = {
  title: "Dataset Gallery",
};

export default async function GalleryPage() {
  const result = await getImages();
  const initialImages = result.success ? result.images || [] : [];

  return (
    <main className="h-screen flex flex-col">
      {/* Optional Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Dataset Gallery</h1>
      </header>

      {/* The Gallery Content */}
      <div className="flex-1 overflow-hidden">
        <GalleryWrapper initialImages={initialImages as any} />
      </div>
    </main>
  );
}