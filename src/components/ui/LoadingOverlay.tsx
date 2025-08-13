"use client";

export default function LoadingOverlay({ show }: { show: boolean }) {
  return (
    <div
      className={`fixed inset-0 bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center z-50 transition-opacity duration-300 ${
        show
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
        Loading...
      </p>
    </div>
  );
}
