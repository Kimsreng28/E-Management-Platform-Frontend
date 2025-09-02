"use client";

import { API_BASE_URL } from "@/lib/config";
import Link from "next/link";

interface SearchProduct {
  id: number;
  name: string;
  image?: string;
  price: string;
  sku?: string;
  slug?: string;
  stock?: number;
  type?: string;
}

interface SearchResultsProps {
  results: SearchProduct[];
  language: "en" | "kh";
  onClose: () => void;
}

export function SearchResults({
  results,
  language,
  onClose,
}: SearchResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-2xl shadow-xl z-50 mt-2 max-h-[70vh] overflow-y-auto">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {results.map((product) => {
          const imageUrl = product.image
            ? `${API_BASE_URL}/${product.image}`
            : "/placeholder.png";

          return (
            <Link
              key={product.id}
              href={`/${language}/customer/products/${
                product.slug ?? product.id
              }`}
              onClick={onClose}
              prefetch={true} // Next.js handles route prefetch automatically
              className="flex items-center gap-4 px-4 py-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              {/* Image */}
              <div className="flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate">
                  {product.name}
                </p>
                <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-medium">
                  ${product.price}
                </p>

                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {product.sku && <span>Code: {product.sku}</span>}
                  {typeof product.stock !== "undefined" && (
                    <span>Stock: {product.stock}</span>
                  )}
                  {product.type && <span>Type: {product.type}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
