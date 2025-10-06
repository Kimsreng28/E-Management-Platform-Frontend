// components/CartPage.tsx
"use client";

import { useCart } from "@/contexts/CartContext";
import { API_BASE_URL } from "@/lib/config";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { VscDebugContinue } from "react-icons/vsc";

// Skeleton Loader Components
const CartItemSkeleton = () => (
  <div className="p-6 flex items-center animate-pulse">
    <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
    <div className="ml-6 flex-grow">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    </div>
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
    </div>
    <div className="ml-6">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
    </div>
  </div>
);

const OrderSummarySkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-6 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-center">
          <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="ml-3 flex-grow">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
        </div>
      ))}
    </div>
    <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-2">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="flex justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function CartPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const unwrappedParams = use(params);
  const language = unwrappedParams.locale || "en";
  const [imageLoaded, setImageLoaded] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<number[]>([]);
  const [removingItems, setRemovingItems] = useState<number[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const router = useRouter();

  const { cart, loading, updateCartItem, removeFromCart, clearCart } =
    useCart();

  useEffect(() => {
    console.log("Cart loading state:", loading);
    console.log("Cart data:", cart);
  }, [loading, cart]);

  // Handle image loading
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Make sure product data is preserved when updating
    const itemToUpdate = cart?.items.find((i) => i.id === itemId);
    if (!itemToUpdate) return;

    setUpdatingItems((prev) => [...prev, itemId]);
    await updateCartItem(itemId, newQuantity, itemToUpdate.product);
    setUpdatingItems((prev) => prev.filter((id) => id !== itemId));
  };

  const handleInputQuantityChange = async (itemId: number, value: string) => {
    const newQuantity = parseInt(value, 10);

    if (isNaN(newQuantity) || newQuantity < 1) return;

    // Make sure product data is preserved when updating
    const itemToUpdate = cart?.items.find((i) => i.id === itemId);
    if (!itemToUpdate) return;

    // Update without showing loading state
    await updateCartItem(itemId, newQuantity, itemToUpdate.product);
  };

  const handleRemoveItem = async (itemId: number) => {
    setRemovingItems((prev) => [...prev, itemId]);
    await removeFromCart(itemId);
    setRemovingItems((prev) => prev.filter((id) => id !== itemId));
  };

  const handleClearCart = async () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      await clearCart();
    }
  };

  const handleCheckout = () => {
    setIsNavigating(true);
    router.push(`/${language}/customer/checkout`);
  };

  if (loading && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[1, 2, 3].map((item) => (
                    <CartItemSkeleton key={item} />
                  ))}
                </div>
              </div>
            </div>
            <OrderSummarySkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24">
              <path fill="currentColor" fillRule="evenodd" d="M3.04 2.292a.75.75 0 0 0-.497 1.416l.261.091c.668.235 1.107.39 1.43.549c.303.149.436.27.524.398c.09.132.16.314.2.677c.04.38.042.875.042 1.615V9.64c0 2.942.063 3.912.93 4.826c.866.914 2.26.914 5.05.914h5.302c1.561 0 2.342 0 2.893-.45c.552-.45.71-1.214 1.025-2.742l.5-2.425c.347-1.74.52-2.609.076-3.186S18.816 6 17.131 6H6.492a9 9 0 0 0-.043-.738c-.054-.497-.17-.95-.452-1.362c-.284-.416-.662-.682-1.103-.899c-.412-.202-.936-.386-1.552-.603zM13 8.25a.75.75 0 0 1 .75.75v1.25H15a.75.75 0 0 1 0 1.5h-1.25V13a.75.75 0 0 1-1.5 0v-1.25H11a.75.75 0 0 1 0-1.5h1.25V9a.75.75 0 0 1 .75-.75" clipRule="evenodd" />
              <path fill="currentColor" d="M7.5 18a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3m9 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your cart is empty
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            href={`/${language}/customer/products`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" fillRule="evenodd" d="M3.04 2.292a.75.75 0 0 0-.497 1.416l.261.091c.668.235 1.107.39 1.43.549c.303.149.436.27.524.398c.09.132.16.314.2.677c.04.38.042.875.042 1.615V9.64c0 2.942.063 3.912.93 4.826c.866.914 2.26.914 5.05.914h5.302c1.561 0 2.342 0 2.893-.45c.552-.45.71-1.214 1.025-2.742l.5-2.425c.347-1.74.52-2.609.076-3.186S18.816 6 17.131 6H6.492a9 9 0 0 0-.043-.738c-.054-.497-.17-.95-.452-1.362c-.284-.416-.662-.682-1.103-.899c-.412-.202-.936-.386-1.552-.603zM13 8.25a.75.75 0 0 1 .75.75v1.25H15a.75.75 0 0 1 0 1.5h-1.25V13a.75.75 0 0 1-1.5 0v-1.25H11a.75.75 0 0 1 0-1.5h1.25V9a.75.75 0 0 1 .75-.75" clipRule="evenodd" />
              <path fill="currentColor" d="M7.5 18a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3m9 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3" />
            </svg>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart.items.reduce(
    (total, item) => total + Number(item.product?.price ?? 0) * item.quantity,
    0
  );

  const total = subtotal;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">

      {isNavigating && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 bg-opacity-50 dark:bg-black dark:bg-opacity-70">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center min-w-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Shopping Cart
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Cart Items
                </h2>
                <button
                  onClick={handleClearCart}
                  className="text-red-500 cursor-pointer hover:text-red-700 text-sm font-medium flex items-center transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {cart.items.map((item) => {
                  const imageSrc = item.product?.images?.find(
                    (img) => img.is_primary
                  )?.path
                    ? `${API_BASE_URL}/${item.product.images.find((img) => img.is_primary)?.path
                    }`
                    : "/images/placeholder.png";

                  const isUpdating = updatingItems.includes(item.id);
                  const isRemoving = removingItems.includes(item.id);

                  return (
                    <div key={item.id} className="p-6 flex items-center transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <div className="flex-shrink-0 w-24 h-24 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={imageSrc}
                          alt={item.product?.name ?? "Product Image"}
                          fill
                          className="object-cover transition-opacity duration-300"
                          onLoadingComplete={handleImageLoad}
                        />
                      </div>

                      <div className="ml-6 flex-grow">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                          {item.product?.name ?? "Unknown Product"}
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-semibold">
                          ${Number(item.product?.price ?? 0).toFixed(2)}
                        </p>
                        {item.product?.stock && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {item.product.stock > 0 ? (
                              <span className="inline-flex items-center text-green-600 dark:text-green-400">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                In Stock
                              </span>
                            ) : (
                              <span className="text-red-500 dark:text-red-400">
                                Out of Stock
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 flex cursor-pointer items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 12H4"
                            />
                          </svg>
                        </button>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleInputQuantityChange(item.id, e.target.value)}
                          className="w-12 h-8 text-center border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        />

                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex cursor-pointer items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="ml-6 text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          $
                          {(
                            Number(item.product?.price ?? 0) * item.quantity
                          ).toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isRemoving}
                          className="text-red-500 hover:text-red-700 cursor-pointer text-sm flex items-center justify-end w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {isRemoving ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-1 h-3 w-3 text-red-500"
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
                              Removing...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove
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

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-6 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal
                  </span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isNavigating}
                className="w-full flex items-center justify-center bg-gradient-to-r cursor-pointer from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {isNavigating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-white border-blue-300 mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M9.53 2.47a.75.75 0 0 0-1.06 1.06l.72.72H9a7.75 7.75 0 1 0 0 15.5h.5a.75.75 0 0 0 0-1.5H9a6.25 6.25 0 0 1 0-12.5h2a.75.75 0 0 0 .53-1.28z" clip-rule="evenodd" /><path fill="currentColor" d="M14.5 4.25a.75.75 0 0 0 0 1.5h.5a6.25 6.25 0 1 1 0 12.5h-2a.75.75 0 0 0-.53 1.28l2 2a.75.75 0 0 0 1.06-1.06l-.72-.72H15a7.75 7.75 0 0 0 0-15.5z" opacity="0.5" /></svg>
                    Proceed to Checkout
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                <Link
                  href={`/${language}/customer/products`}
                  className="inline-flex items-center cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                >
                  Continue Shopping
                  <VscDebugContinue className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}