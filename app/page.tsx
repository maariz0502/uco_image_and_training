import Image from "next/image";

export default function Home() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Welcome to title go here</h2>
      <p className="mb-8">Manage your datasets and train your YOLO models.</p>

      <div className="flex justify-center gap-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          Upload Images
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded">
          Start Training
        </button>
      </div>
    </div>
  );
}
