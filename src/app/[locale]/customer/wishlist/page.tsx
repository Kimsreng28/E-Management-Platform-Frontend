// components/WishlistPage.tsx
"use client";

import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import Image from "next/image";
import Link from "next/link";
import { use, useState } from "react";

export default function WishlistPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const unwrappedParams = use(params);
  const language = unwrappedParams.locale || "en";
  const t = useTranslations(language);
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [movingToCart, setMovingToCart] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter out items with missing products
  const validWishlist = wishlist.filter((item) => item.product);

  if (validWishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-6">
            <svg
              className="w-12 h-12 text-blue-500 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t.wishlistPage.yourWishlistIsEmpty}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {t.wishlistPage.saveYourFavorites}
          </p>
          <Link
            href={`/${language}/customer/products`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M9 11.5h2.5m0 0H14m-2.5 0V14m0-2.5V9M20 20l2 2M6.75 3.27a9.5 9.5 0 1 1-3.48 3.48" /></svg>
            {t.wishlistPage.browseProducts}
          </Link>
        </div>
      </div>
    );
  }

  const handleMoveToCart = async (productId: number) => {
    setMovingToCart(productId);
    try {
      await addToCart(productId, 1);
      await removeFromWishlist(productId);
    } catch (error) {
      console.error("Error moving to cart:", error);
    } finally {
      setMovingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.wishlistPage.myWishlist}
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {validWishlist.length}{" "}
            {validWishlist.length === 1 ? t.wishlistPage.item : t.wishlistPage.items}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {validWishlist.map((item) => {
            const product = item.product!;
            const imageSrc = product.images?.find((img) => img.is_primary)?.path
              ? `${API_BASE_URL}/${product.images.find((img) => img.is_primary)?.path
              }`
              : "";
            const isOutOfStock = (product?.stock ?? 0) <= 0;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden group relative transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-800/30"
              >
                <div className="relative h-60 w-full">
                  <Image
                    src={imageSrc}
                    alt={product?.name ?? "Product Image"}
                    fill
                    className="object-contain transition-all duration-300 "
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/placeholder.png";
                    }}
                  />

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                      <span className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm font-medium">
                        {t.createProduct.outOfStock}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => removeFromWishlist(item.product_id)}
                    className="absolute cursor-pointer top-3 right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-all duration-200 transform hover:scale-110"
                    aria-label="Remove from wishlist"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[56px]">
                    {product?.name ?? "Unknown Product"}
                  </h3>

                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      ${Number(product?.price ?? 0).toFixed(2)}
                    </p>

                    {product.stock > 0 && (
                      <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                        {t.createProduct.inStock}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleMoveToCart(item.product_id)}
                    disabled={isOutOfStock || movingToCart === item.product_id}
                    className={`w-full cursor-pointer py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${isOutOfStock
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg"
                      }`}
                  >
                    {movingToCart === item.product_id ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Moving...
                      </>
                    ) : isOutOfStock ? (
                      t.createProduct.outOfStock
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {t.wishlistPage.moveToCart}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
