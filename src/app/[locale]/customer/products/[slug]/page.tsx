"use client";

import ProductCard from "@/components/ui/customer/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AiFillProduct } from "react-icons/ai";
import { BiCopy } from "react-icons/bi";
import { BsStars } from "react-icons/bs";
import { CgDanger } from "react-icons/cg";
import { CiBarcode } from "react-icons/ci";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiHome,
  FiMessageSquare,
  FiMinus,
  FiPlus,
  FiSend,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import { IoStar, IoStarHalf, IoStarOutline } from "react-icons/io5";
import { PiShareNetworkDuotone } from "react-icons/pi";
import Swal from "sweetalert2";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: ProductImage[];
  videos: ProductVideo[];
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
  model_code: string;
  warranty_months: number | null;
  brand: {
    id: number;
    name: string;
    logo: string;
  };
  specifications: Record<string, string>;
  orders: {
    id: number;
    shipping_cost: number;
  }[];
}

interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string | null;
  is_primary: boolean;
}

interface ProductVideo {
  id: number;
  product_id: number;
  url: string;
  thumbnail?: string | null;
  is_primary: boolean;
}

interface ReviewReply {
  id: number;
  user: {
    name: string;
    avatar?: string;
  };
  comment: string;
  created_at: string;
  is_vendor_reply: boolean;
}

interface Review {
  id: number;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  created_at: string;
  replies: ReviewReply[];
}

interface ProductDetailPageProps {
  params: Promise<{ locale: "en" | "kh"; slug: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  // Unwrap the params promise
  const { locale, slug } = React.use(params);
  const pathname = usePathname();
  const currentLocale = pathname.split("/")[1] || "en";
  const language = locale || "en";
  const t = useTranslations(language);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [token, setToken] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [userReview, setUserReview] = useState({
    rating: 0,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const [isNavigating, setIsNavigating] = useState(false);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const [barcodeImage, setBarcodeImage] = useState(null);
  const [barcodeText, setBarcodeText] = useState("");
  const [showBarcode, setShowBarcode] = useState(false);

  const handleShareProduct = (product: Product) => {
    const productUrl = `${window.location.origin}/${currentLocale}/customer/products/${product.slug}`;

    // Use native share API if supported
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: productUrl,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard
        .writeText(productUrl)
        .then(() => alert("Product link copied to clipboard!"))
        .catch((err) => console.error("Failed to copy:", err));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);

      // Check for dark mode preference
      const isDarkMode =
        localStorage.getItem("darkMode") === "true" ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(isDarkMode);

      // Apply dark mode class to document
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        // Fetch product details
        const productResponse = await fetch(
          `${API_BASE_URL}/api/products/${slug}`
        );

        if (!productResponse.ok) {
          if (productResponse.status === 404) {
            setProduct(null);
            return;
          }
          throw new Error(`HTTP error! status: ${productResponse.status}`);
        }

        const productData = await productResponse.json();
        setProduct(productData);

        // Check if product is in wishlist
        setIsWishlisted(isInWishlist(productData.id));

        // Fetch related products (by category)
        try {
          const relatedResponse = await fetch(
            `${API_BASE_URL}/api/products?category_id=${productData.category.id}&exclude=${productData.id}&limit=4`
          );
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            setRelatedProducts(relatedData.data.slice(0, 4) || []);
          }
        } catch (error) {
          console.error("Error fetching related products:", error);
        }

        // Fetch reviews
        try {
          const reviewsResponse = await fetch(
            `${API_BASE_URL}/api/reviews?product_id=${productData.id}`
          );
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            setReviews(reviewsData.data || []);
          }
        } catch (error) {
          console.error("Error fetching reviews:", error);
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [slug, locale, router, isInWishlist, token]);


  useEffect(() => {
    const fetchBarcode = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/products/${slug}/barcode`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch product");

        const data = await res.json();
        setBarcodeImage(data.image);
        setBarcodeText(data.barcode);
      }
      catch (error) {
        console.error("Error fetching product:", error);
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "Failed to load product",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
      }
    };

    fetchBarcode();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!token) {
      router.push(`/${locale}/auth/login`);
      Swal.fire({
        icon: "info",
        title: "Please login first",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: darkMode ? "#374151" : "#fff",
        color: darkMode ? "#fff" : "#000",
      });
      return;
    }

    try {
      await addToCart(product.id, quantity);
      Swal.fire({
        icon: "success",
        title: "Product added to cart",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: darkMode ? "#374151" : "#fff",
        color: darkMode ? "#fff" : "#000",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    if (!token) {
      router.push(`/${currentLocale}/auth/login`);
      Swal.fire({
        icon: "info",
        title: "Please login first",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: darkMode ? "#374151" : "#fff",
        color: darkMode ? "#fff" : "#000",
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
          background: darkMode ? "#374151" : "#fff",
          color: darkMode ? "#fff" : "#000",
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
          background: darkMode ? "#374151" : "#fff",
          color: darkMode ? "#fff" : "#000",
        });
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (!product || !token) return;

    if (userReview.rating === 0) {
      Swal.fire({
        icon: "warning",
        title: "Please select a rating",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        background: darkMode ? "#374151" : "#fff",
        color: darkMode ? "#fff" : "#000",
      });
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          rating: userReview.rating,
          comment: userReview.comment,
        }),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Review submitted for approval",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          background: darkMode ? "#374151" : "#fff",
          color: darkMode ? "#fff" : "#000",
        });

        setUserReview({ rating: 0, comment: "" });

        // Refresh reviews
        const reviewsResponse = await fetch(
          `${API_BASE_URL}/api/reviews?product_id=${product.id}&is_approved=true`
        );
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.data || []);
        }
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to submit review",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        background: darkMode ? "#374151" : "#fff",
        color: darkMode ? "#fff" : "#000",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<IoStar key={i} className="text-yellow-400 w-5 h-5" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<IoStarHalf key={i} className="text-yellow-400 w-5 h-5" />);
      } else {
        stars.push(
          <IoStarOutline key={i} className="text-yellow-400 w-5 h-5" />
        );
      }
    }

    return stars;
  };

  const nextMedia = () => {
    if (product) {
      const allMedia = [...(product.images || []), ...(product.videos || [])];
      setSelectedMedia((prev) => (prev + 1) % allMedia.length);
    }
  };

  const prevMedia = () => {
    if (product) {
      const allMedia = [...(product.images || []), ...(product.videos || [])];
      setSelectedMedia(
        (prev) => (prev - 1 + allMedia.length) % allMedia.length
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2 h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="md:w-1/2 space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold dark:text-white">
          Product not found
        </h1>
        <button
          onClick={() => router.push(`/${currentLocale}/customer/products`)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center mx-auto"
        >
          <FiArrowLeft className="mr-2" />
          Back to Products
        </button>
      </div>
    );
  }

  const originalPrice = Number(product.price);
  const discountedPrice = product.discount
    ? originalPrice - originalPrice * (Number(product.discount) / 100)
    : originalPrice;

  const buildMediaUrl = (path: string) => {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  // Combine images and videos for media gallery
  const allMedia = [
    ...(product.images || []).map((img) => ({
      ...img,
      type: "image",
      src: buildMediaUrl(img.path),
    })),
    ...(product.videos || []).map((vid) => ({
      ...vid,
      type: "video",
      src: buildMediaUrl(vid.url), // Use url for videos
    })),
  ];

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900 min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm" aria-label="Breadcrumb">
        {/* Loading Overlay */}
        {isNavigating && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700 mx-auto mb-4"></div>
            </div>
          </div>
        )}

        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          {/* Home */}
          <li className="inline-flex items-center">
            <button
              onClick={() => {
                setIsNavigating(true);
                router.push(`/${locale}`);
              }}
              className="inline-flex cursor-pointer items-center text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              <FiHome className="mr-2" />
              {t.Home}
            </button>
          </li>

          {/* Products */}
          <li>
            <div className="flex items-center">
              <FiChevronRight className="mx-1 text-gray-400" />
              <button
                onClick={() => {
                  setIsNavigating(true);
                  router.push(`/${locale}/customer/products`);
                }}
                className="text-gray-700 cursor-pointer hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                {t.Products}
              </button>
            </div>
          </li>

          {/* Current product */}
          <li aria-current="page">
            <div className="flex items-center">
              <FiChevronRight className="mx-1 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400 truncate max-w-xs md:max-w-md">
                {product.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Media */}
        <div className="space-y-4">
          <div className="relative h-96 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden group">
            {allMedia.length > 0 ? (
              <>
                {allMedia[selectedMedia].type === "image" ? (
                  <Image
                    src={allMedia[selectedMedia].src}
                    alt={product.name}
                    fill
                    className={`object-contain transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"
                      }`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                ) : (
                  <video
                    src={allMedia[selectedMedia].src}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                    onError={(e) => {
                      console.error("Video failed to load:", e);
                      console.log("Video URL:", allMedia[selectedMedia].src);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}

                {/* Navigation arrows */}
                {allMedia.length > 1 && (
                  <>
                    <button
                      onClick={prevMedia}
                      className="absolute cursor-pointer left-2 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <FiChevronLeft className="w-5 h-5 text-gray-800 dark:text-white" />
                    </button>
                    <button
                      onClick={nextMedia}
                      className="absolute cursor-pointer right-2 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <FiChevronRight className="w-5 h-5 text-gray-800 dark:text-white" />
                    </button>
                  </>
                )}

                {/* Media counter */}
                {allMedia.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
                    {selectedMedia + 1} / {allMedia.length}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <span className="text-gray-500 dark:text-gray-400">
                  No media available
                </span>
              </div>
            )}

            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {allMedia.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allMedia.map((media, index) => (
                <button
                  key={media.id}
                  onClick={() => setSelectedMedia(index)}
                  className={`h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden transition-all ${selectedMedia === index
                    ? "ring-2 ring-blue-500 dark:ring-blue-400 scale-105"
                    : "hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600"
                    }`}
                >
                  {media.type === "image" ? (
                    <Image
                      src={media.src}
                      alt={product.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>
              <div>
                <div className="relative inline-block">
                  {/* Barcode Button */}
                  <button
                    title="Show Barcode"
                    onClick={() => setShowBarcode((prev) => !prev)}
                    className="p-2 cursor-pointer text-gray-800 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                  >
                    <CiBarcode className="w-5 h-5" />
                  </button>

                  {/* Popup */}
                  {showBarcode && (
                    <div className="absolute z-50 top-full mt-2 right-0 w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Barcode
                      </h3>

                      {barcodeImage ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={barcodeImage}
                            alt="Product Barcode"
                            className="h-20 w-full object-contain rounded-md"
                          />
                          <p className="mt-3 text-sm font-mono text-gray-700 dark:text-gray-300 tracking-wide">
                            {barcodeText}
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(barcodeText);
                              Swal.fire({
                                position: "top-end",
                                icon: "success",
                                title: "Barcode copied to clipboard!",
                                showConfirmButton: false,
                                timer: 1500,
                                toast: true,
                              });
                            }}
                            className="mt-3 flex items-center cursor-pointer px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/60 transition"
                          >
                            <BiCopy className="w-4 h-4 mr-1" />
                            Copy Barcode
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No barcode available
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  title="Share Product"
                  onClick={() => handleShareProduct(product)}
                  className="p-2 cursor-pointer text-gray-800 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  <PiShareNetworkDuotone className="w-5 h-5" />
                </button>

              </div>

            </div>
            <p className="text-lg text-gray-700 dark:text-gray-400 mt-1">
              {t.ordersDetail.model}: {product.model_code} | {t.productDashboard.brand}: {product.brand.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5  sm:w-6 sm:h-6  ${i < Math.round(product.average_rating || 0)
                    ? "text-yellow-400"
                    : "text-gray-300"
                    }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.967c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.285-3.967a1 1 0 00-.364-1.118L2.049 9.394c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.967z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ({product.total_ratings} reviews)
            </span>
          </div>

          <div className="flex items-center gap-4">
            {product.discount && product.discount > 0 ? (
              <>
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
                <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-red-900/30 dark:text-red-300">
                  Save {product.discount}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 py-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <FiTruck className="w-5 h-5 mr-1 text-green-500" />
              {product.orders.length > 0 ? (
                <span>{product.orders[0].shipping_cost} USD</span>
              ) : (
                <span>Free Shipping</span>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <FiShield className="w-5 h-5 mr-1 text-blue-500" />
              {product.warranty_months} month(s)
            </div>
          </div>

          <div className="prose max-w-none dark:prose-invert prose-gray">
            <div
              dangerouslySetInnerHTML={{ __html: product.description }}
              className="text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Specifications */}
          {product.specifications &&
            Object.keys(product.specifications).length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <h3 className="text-lg font-semibold mb-3 dark:text-white flex items-center">
                  <FiCheck className="mr-2 text-blue-500" />
                  {t.createProduct.specifications}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between py-2 border-b dark:border-gray-700"
                      >
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {key}:
                        </span>
                        <span className="text-gray-900 dark:text-white text-right">
                          {value}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Stock Status */}
          <div className="flex items-center gap-3">
            {product.stock > 0 ? (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${product.stock <= product.low_stock_threshold
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  }`}
              >
                {product.stock <= product.low_stock_threshold
                  ? t.createProduct.lowStock
                  : t.createProduct.inStock}
                {product.stock <= product.low_stock_threshold && (
                  <span className="ml-1">
                    <CgDanger className="w-4 h-4" />
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                {t.createProduct.outOfStock}
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {product.stock} {t.productDetail.unitsAvailable}
            </span>
          </div>

          {/* Add to Cart */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Quantity Control */}
            <div className="flex items-center border rounded-lg dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 cursor-pointer py-3 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                disabled={quantity <= 1}
              >
                <FiMinus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 dark:text-white font-medium w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 cursor-pointer  py-3 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                disabled={product.stock <= 0 || quantity >= product.stock}
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart + Wishlist */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`flex-1 cursor-pointer py-3 px-4 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 text-base ${product.stock <= 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : "bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white shadow-md transform hover:shadow-lg dark:from-gray-800 dark:to-gray-900 dark:hover:from-gray-900 dark:hover:to-gray-800"
                  }`}
              >
                <FiShoppingCart className="w-5 h-5" />
                {product.stock > 0 ? t.productCard.addToCart : t.createProduct.outOfStock}
              </button>

              {/* Wishlist */}
              <button
                onClick={handleWishlistToggle}
                className={`flex-1 cursor-pointer py-3 px-4 rounded-lg sm:rounded-xl border font-medium transition-all duration-300 flex items-center justify-center gap-2 text-base ${isWishlisted
                  ? "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
              >
                <FiHeart
                  className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`}
                />
                {isWishlisted ? t.productDetail.wishlisted : t.productDetail.addToWishlist}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center">
          <BsStars className="mr-2 text-yellow-400" />
          {t.productDetail.customerReviews}
        </h2>

        {/* Add Review Form */}
        {token && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-sm dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {t.productDetail.writeAReview}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {t.productDetail.yourRating}
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setUserReview({ ...userReview, rating: star })
                    }
                    className="text-2xl focus:outline-none transition-transform hover:scale-110"
                  >
                    {star <= userReview.rating ? (
                      <IoStar className="text-yellow-400" />
                    ) : (
                      <IoStarOutline className="text-gray-300 dark:text-gray-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label
                htmlFor="comment"
                className="block text-sm font-medium mb-2 dark:text-gray-300"
              >
                {t.productDetail.yourReview}
              </label>
              <textarea
                id="comment"
                rows={4}
                value={userReview.comment}
                onChange={(e) =>
                  setUserReview({ ...userReview, comment: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                placeholder={t.productDetail.shareYourExperience}
              />
            </div>
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className={`w-fit cursor-pointer py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${submittingReview
                ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                : "bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white shadow-md transform hover:shadow-lg dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
            >
              {submittingReview ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend className="w-5 h-5" />
                  {t.productDetail.submitReview}
                </>
              )}
            </button>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <FiStar className="w-12 h-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">No reviews yet.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {review.user.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {new Date(review.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Review Comment */}
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {review.comment}
                </p>

                {/* Vendor Replies */}
                {review.replies && review.replies.length > 0 && (
                  <div className="ml-6 pl-4 border-l-2 border-blue-200 dark:border-blue-700 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                      <FiMessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                      Vendor Replies
                    </h4>
                    {review.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              {reply.user?.name || 'Vendor'}
                            </span>
                            {reply.is_vendor_reply && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                                Vendor
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(reply.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {reply.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center dark:text-white">
            <AiFillProduct className="w-6 h-6 mr-2 text-blue-700" />
            {t.productDetail.relatedProducts}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
