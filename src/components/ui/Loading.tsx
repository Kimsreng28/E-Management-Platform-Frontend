// components/Loading.tsx
"use client";

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
    </div>
  );
}
