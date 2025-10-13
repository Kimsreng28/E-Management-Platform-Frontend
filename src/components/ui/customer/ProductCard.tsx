"use client";

import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { LuQrCode } from "react-icons/lu";
import {
  MdAddShoppingCart,
  MdOutlineCancel,
  MdOutlineViewInAr,
  MdRemoveShoppingCart,
} from "react-icons/md";
import Swal from "sweetalert2";

interface ProductCardProps {
  product: Product;
  locale: "en" | "kh";
  showRating?: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: ProductImage[];
  category: {
    id: number;
    name: string;
  };
  stock: number;
  is_featured?: boolean;
  is_new?: boolean;
  created_at: string;
  updated_at: string;
  low_stock_threshold: number;
  stock_status: string;
  discount?: number;
  average_rating?: number;
  total_ratings?: number;
}

interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string | null;
  is_primary: boolean;
}

export default function ProductCard({ product, locale, showRating = false }: ProductCardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split("/")[1] || "en";
  const language = locale || "en";
  const t = useTranslations(language);

  const [token, setToken] = useState<string | null>(null);

  const mainImage =
    product.images.find((img) => img.is_primary)?.path ||
    product.images[0]?.path ||
    "/images/placeholder.png";

  const [imageLoaded, setImageLoaded] = useState(false);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist(product.id));
  const [showQuickView, setShowQuickView] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const [isNavigating, setIsNavigating] = useState(false);

  // Calculate discounted price if applicable
  const originalPrice = Number(product.price);
  const discountedPrice = product.discount
    ? originalPrice - originalPrice * (Number(product.discount) / 100)
    : originalPrice;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
    }
  }, []);

  // Fetch QR code when modal is opened
  useEffect(() => {
    if (!showQr) return;

    const fetchQrCode = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products/${product.slug}/qr-code/${currentLocale}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setQrCodeUrl(url);
        }
      } catch (error) {
        console.error("Error fetching QR code:", error);
      }
    };

    fetchQrCode();
  }, [showQr, product.slug, currentLocale, token]);

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${product.name.replace(/\s+/g, "_")}_qrcode.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle image loading
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Handle image error
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = "";
  };

  // Handle quick view
  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQuickView(true);
  };

  // Close quick view
  const handleCloseQuickView = () => {
    setShowQuickView(false);
  };

  // Navigate to product detail page
  const handleProductClick = () => {
    setIsNavigating(true);
    router.push(`/${currentLocale}/customer/products/${product.slug}`);
  };

  // Handle add to wishlist
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!token) {
      router.push(`/${currentLocale}/auth/login`); // redirect if no token
      Swal.fire({
        icon: "info",
        title: "Please login first",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        setIsWishlisted(false);
        Swal.fire({
          icon: "success",
          title: "Product removed from wishlist",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
          },
        });
      } else {
        await addToWishlist(product.id);
        setIsWishlisted(true);

        Swal.fire({
          icon: "success",
          title: "Product added to wishlist",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
          },
        });
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  // Handle add to cart
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!token) {
      router.push(`/${currentLocale}/auth/login`); // redirect if no token
      Swal.fire({
        icon: "info",
        title: "Please login first",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });
      return;
    }

    try {
      await addToCart(product.id, 1);
      Swal.fire({
        icon: "success",
        title: "Product added to cart",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ?
            <FaStar key={star} className="text-yellow-400 text-sm" /> :
            <FaRegStar key={star} className="text-gray-300 text-sm" />
        ))}
        <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
          ({product.total_ratings || 0})
        </span>
      </div>
    );
  };

  return (
    <div className="group bg-white dark:bg-gray-700 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-4 flex flex-col relative overflow-hidden border border-gray-100 dark:border-gray-700 h-full">

      {/* Image Container */}
      <div className="relative w-full h-40 xs:h-48 sm:h-52 md:h-56 lg:h-60 overflow-hidden rounded-lg sm:rounded-xl mb-3 sm:mb-4">
        {/* Main Product Image */}
        <Image
          src={
            product.images.length > 0
              ? `${API_BASE_URL}/${mainImage}`
              : "/images/placeholder.png"
          }
          alt={product.name}
          fill
          className={`object-contain transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          sizes="(max-width: 320px) 280px, (max-width: 425px) 380px, (max-width: 640px) 580px, (max-width: 768px) 340px, (max-width: 1024px) 300px, (max-width: 1280px) 340px, 380px"
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={false}
        />

        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg sm:rounded-xl"></div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlistToggle}
            className={`w-8 h-8 cursor-pointer sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full shadow-md transition-colors ${isWishlisted
              ? "bg-red-50 dark:bg-red-900/20 text-red-500"
              : "bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
              }`}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <svg
              className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5"
              fill={isWishlisted ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          <button
            onClick={handleQuickView}
            className="w-8 h-8 cursor-pointer sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-colors"
            aria-label="Quick view"
          >
            <svg
              className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>

          <button
            onClick={() => setShowQr(true)}
            className="w-8 h-8 cursor-pointer sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-colors"
            aria-label="Quick view"
          >
            <LuQrCode className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>

          {/* QR Code Modal */}
          {showQr && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center relative">
                {/* Close Button */}
                <button
                  onClick={() => setShowQr(false)}
                  className="absolute cursor-pointer top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  <MdOutlineCancel className="w-5 h-5 text-red-500 dark:text-red-500" />
                </button>

                {/* QR Code Content */}
                {qrCodeUrl ? (
                  <div className="flex flex-col items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                      {t.productCard.qrCodeFor} {product.name}
                    </h3>

                    <img
                      src={qrCodeUrl}
                      alt={`QR Code for ${product.name}`}
                      className="w-56 h-56 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md"
                    />

                    <button
                      onClick={handleDownloadQr}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition"
                    >
                      <FiDownload className="w-5 h-5" /> {t.productCard.downloadQrCode}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-gray-300"></div>
                    <p className="text-gray-600 dark:text-gray-300 text-center">
                      {t.productCard.generateQrCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Labels */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
          {Number(product.discount) > 0 && (
            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-bold rounded-full shadow-md">
              {Number(product.discount)}% OFF
            </span>
          )}
          {product.is_featured && (
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-bold rounded-full shadow-md">
              {t.productCard.featured}
            </span>
          )}
          {product.is_new && (
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-bold rounded-full shadow-md">
              {t.productCard.new}
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
          {product.stock > 0 ? (
            <span
              className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${product.stock <= product.low_stock_threshold
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                }`}
            >
              {product.stock <= product.low_stock_threshold ? (
                <>
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full mr-1"></span>
                  {t.createProduct.lowStock}
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1"></span>
                  {t.createProduct.inStock}
                </>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full mr-1"></span>
              {t.createProduct.outOfStock}
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-grow">
        <p className="text-xs w-fit bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-800 dark:to-amber-900 rounded-full px-2 py-0.5 sm:px-3 sm:py-1 font-semibold text-white dark:text-gray-200 uppercase tracking-wide shadow-sm mb-2 inline-block">
          {product.category.name}
        </p>

        <div className="flex items-center gap-1 ">
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${i < Math.round(product.average_rating || 0)
                ? "text-yellow-400"
                : "text-gray-300"
                }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.967c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.285-3.967a1 1 0 00-.364-1.118L2.049 9.394c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.967z" />
            </svg>
          ))}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ({product.total_ratings})
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 sm:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {product.name}
        </h3>

        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 sm:mb-4 flex-grow">
          {product.description.replace(/<[^>]+>/g, "")}
        </p>

        {/* Price Section */}
        <div className="flex items-center mb-3 sm:mb-4 flex-wrap gap-1">
          {product.discount && product.discount > 0 ? (
            <>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                ${discountedPrice.toFixed(2)}
              </span>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
              <span className="ml-auto text-xs sm:text-sm font-medium text-red-500 dark:text-red-400">
                Save {product.discount}%
              </span>
            </>
          ) : (
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className={`w-full cursor-pointer py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${product.stock <= 0
            ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
            : "bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white shadow-md transform hover:-translate-y-0.5"
            }`}
        >
          {product.stock > 0 ? (
            <>
              <MdAddShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {t.productCard.addToCart}
            </>
          ) : (
            `${t.createProduct.outOfStock}`
          )}
        </button>
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          {/* Loading Overlay */}
          {isNavigating && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700 mx-auto mb-4"></div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {product.name}
                </h2>
                <button
                  onClick={handleCloseQuickView}
                  className="p-2 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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

              {/* Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="relative h-72 md:h-96 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
                  <Image
                    src={
                      product.images.length > 0
                        ? `${API_BASE_URL}/${mainImage}`
                        : "/images/placeholder.png"
                    }
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Product Info */}
                <div className="space-y-5">
                  {/* Ratings */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(product.average_rating || 0)
                          ? "text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                          }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.967c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.285-3.967a1 1 0 00-.364-1.118L2.049 9.394c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.967z" />
                      </svg>
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({product.total_ratings} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3">
                    {product.discount && product.discount > 0 ? (
                      <>
                        <span className="text-3xl font-bold text-primary">
                          ${discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          ${originalPrice.toFixed(2)}
                        </span>
                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm font-medium px-2 py-1 rounded-lg">
                          Save {product.discount}%
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">
                    {product.description.replace(/<[^>]+>/g, "")}
                  </p>

                  {/* Stock Status */}
                  <div>
                    {product.stock > 0 ? (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${product.stock <= product.low_stock_threshold
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                      >
                        {product.stock <= product.low_stock_threshold
                          ? t.createProduct.lowStock
                          : t.createProduct.inStock}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {t.createProduct.outOfStock}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock <= 0}
                      className={`w-full cursor-pointer py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${product.stock <= 0
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                        : "bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white shadow-md transform hover:shadow-lg dark:bg-gray-800 dark:hover:bg-gray-700"
                        }`}
                    >
                      {product.stock > 0 ? (
                        <MdAddShoppingCart className="text-lg" />
                      ) : (
                        <MdRemoveShoppingCart className="text-lg" />
                      )}
                      {product.stock > 0 ? t.productCard.addToCart : t.createProduct.outOfStock}
                    </button>

                    <button
                      onClick={handleWishlistToggle}
                      className={`p-3 rounded-lg cursor-pointer border transition ${isWishlisted
                        ? "bg-red-100 text-red-500 border-red-200 dark:bg-red-900 dark:border-red-800 dark:text-red-300"
                        : "bg-white dark:bg-gray-800 text-gray-600 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                    >
                      <svg
                        className="w-6 h-6"
                        fill={isWishlisted ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* View Details */}
                  <button
                    onClick={handleProductClick}
                    disabled={isNavigating}
                    className="w-full mt-4 cursor-pointer py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base
             bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white shadow-md transform hover:shadow-lg 
             dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <MdOutlineViewInAr className="text-lg" />
                    {t.productCard.viewFullDetails}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRating && (product.average_rating ?? 0) > 0 && (
        <div className="px-4 pb-3">
          {renderStars(product.average_rating ?? 0)}
        </div>
      )}

    </div>
  );
}
