// app/dataset/upload/page.tsx
import BatchUploadForm from "./BatchUploadForm";
import Link from "next/link";

export const metadata = {
  title: "Upload Dataset",
};

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Batch Upload Images
        </h1>
        <Link
          href="/dataset"
          className="text-sm text-gray-500 hover:text-gray-800 underline"
        >
          &larr; Back to Gallery
        </Link>
      </header>

      <BatchUploadForm />
    </main>
  );
}
