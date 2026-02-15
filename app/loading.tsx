export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-9999">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-blue-400 opacity-20"></div>
        
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <h2 className="text-lg font-semibold text-gray-800 animate-pulse">
          Loading...
        </h2>
        <p className="text-sm text-gray-500">
          Preparing your workspace
        </p>
      </div>
    </div>
  );
}