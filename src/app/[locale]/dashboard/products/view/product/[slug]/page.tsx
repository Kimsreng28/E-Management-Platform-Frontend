"use client";

import QrCodeDisplay from "@/components/ui/dashboard/products/QrCodeDisplay";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { MdDelete, MdEdit } from "react-icons/md";
import Swal from "sweetalert2";

interface Product {
  id: number;
  name: string;
  slug: string;
  model_code: string;
  price: number | string;
  stock: number;
  cost_price: number | null;
  short_description: string;
  description: string;
  stock_status: string;
  is_active: boolean;
  is_featured: boolean;
  warranty_months: number | null;
  low_stock_threshold: number;
  specifications: Record<string, string> | string;
  category: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
  images: {
    id: number;
    path: string;
    is_primary: boolean;
  }[];
  videos: {
    id: number;
    url: string;
    title: string;
  }[];
  created_at: string;
  updated_at: string;
}

export default function ProductViewPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh"; slug: string }>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const unwrappedParams = use(params);
  const { slug, locale } = unwrappedParams;

  const language = locale || "en";
  const currentLocale = pathname.split("/")[1] || "en";
  const t = useTranslations(language);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [secondaryImages, setSecondaryImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [specs, setSpecs] = useState<Record<string, string>>({});

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE_URL}/api/products/${slug}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch product");

        const data = await res.json();
        const productData = data.data || data;
        setProduct(productData);

        // Process images
        if (productData.images?.length > 0) {
          const primary = productData.images.find((img: any) => img.is_primary);
          const secondary = productData.images.filter(
            (img: any) => !img.is_primary
          );

          if (primary) {
            setPrimaryImage(
              primary.path.startsWith("http")
                ? primary.path
                : `${API_BASE_URL}/${primary.path}`
            );
          }

          setSecondaryImages(
            secondary.map((img: any) =>
              img.path.startsWith("http")
                ? img.path
                : `${API_BASE_URL}/${img.path}`
            )
          );
        }

        // Process videos
        if (productData.videos?.length > 0) {
          setVideos(
            productData.videos.map((vid: any) =>
              vid.url.startsWith("http") ? vid.url : `${API_BASE_URL}${vid.url}`
            )
          );
        }

        // Process specifications
        if (productData.specifications) {
          try {
            const specs =
              typeof productData.specifications === "string"
                ? JSON.parse(productData.specifications)
                : productData.specifications;
            setSpecs(specs);
          } catch (e) {
            console.error("Error parsing specifications:", e);
            setSpecs({});
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "Failed to load product",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Handle delete product
  const handleDelete = async () => {
    if (!product) return;

    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You are about to delete "${product.name}". This action cannot be undone!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to delete product");

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Product deleted successfully!",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });

        router.push(`/${currentLocale}/dashboard/products`);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Failed to delete product",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 dark:text-gray-300">Product not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-1 lg:py-1 py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${currentLocale}/dashboard/products`)}
          className="bg-gray-100 border cursor-pointer border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow px-2 py-2 transition flex-shrink-0"
        >
          <IoIosArrowBack className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">
            {product.name}
          </h1>
          <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
            {product.model_code}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              router.push(
                `/${currentLocale}/dashboard/products/${product.slug}/edit/product`
              )
            }
            className="flex items-center justify-center shadow-md border border-gray-300 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all duration-200 rounded-lg py-1.5 px-2 sm:py-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base w-full sm:w-auto"
          >
            <MdEdit className="mr-2 w-4 h-4" />
            {t.createProduct.editProduct}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center shadow-md border border-gray-300 bg-red-100 text-red-500 hover:bg-red-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 rounded-lg py-1.5 px-2 sm:py-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base w-full sm:w-auto"
          >
            <MdDelete className="mr-2 w-4 h-4" />
            {t.createProduct.deleteProduct}
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Media */}
        <div className="lg:col-span-1 space-y-4">
          {/* Primary Image */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 p-4">
              {t.createProduct.primaryImage}
            </h3>
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full h-64 sm:h-80 object-contain p-4"
              />
            ) : (
              <div className="w-full h-64 sm:h-80 flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                <span className="text-gray-500 dark:text-gray-300">
                  No Image
                </span>
              </div>
            )}
          </div>

          {/* Secondary Images */}
          {secondaryImages.length > 0 && (
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.createProduct.additionalImages}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {secondaryImages.map((img, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={img}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover rounded border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.createProduct.videos}
              </h3>
              <div className="space-y-4">
                {videos.map((video, index) => (
                  <div key={index} className="aspect-video">
                    <video
                      src={video}
                      controls
                      className="w-full h-full object-cover rounded border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <QrCodeDisplay
            params={params}
            productSlug={product.slug}
            productName={product.name}
            onClose={function (): void {
              throw new Error("Function not implemented.");
            }}
          />
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold dark:text-white mb-4">
              {t.createProduct.basicInformation}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.price}
                </p>
                <p className="text-lg font-medium dark:text-white">
                  $
                  {typeof product.price === "string"
                    ? parseFloat(product.price).toFixed(2)
                    : product.price.toFixed(2)}
                </p>
              </div>

              {/* Cost Price */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.costPrice}
                </p>
                <p className="text-lg font-medium dark:text-white">
                  {product.cost_price
                    ? `$${
                        typeof product.cost_price === "string"
                          ? parseFloat(product.cost_price).toFixed(2)
                          : product.cost_price.toFixed(2)
                      }`
                    : "-"}
                </p>
              </div>

              {/* Stock */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.stock}
                </p>
                <p className="text-lg font-medium dark:text-white">
                  {product.stock}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.stockStatus}
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.stock_status === "Active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : product.stock_status === "Inactive"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {product.stock_status === "Active"
                    ? t.createProduct.active
                    : t.createProduct.inactive}
                </span>
              </div>

              {/* Category */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.category}
                </p>
                <p className="text-lg font-medium dark:text-white">
                  {product.category?.name || "-"}
                </p>
              </div>

              {/* Brand */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.brand}
                </p>
                <p className="text-lg font-medium dark:text-white">
                  {product.brand?.name || "-"}
                </p>
              </div>

              {/* Warranty */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.warranty}
                </p>
                <p className="text-lg font-medium dark:text-white">
                  {product.warranty_months
                    ? `${product.warranty_months} ${t.createProduct.months}`
                    : "-"}
                </p>
              </div>

              {/* Featured */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.featured}
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.is_featured
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {product.is_featured ? "Yes" : "No"}
                </span>
              </div>

              {/* Active */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.active}
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.is_featured
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {product.is_active ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold dark:text-white mb-4">
              {t.createProduct.description}
            </h2>

            {/* Short Description */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.createProduct.shortDescription}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {product.short_description || "No short description available"}
              </p>
            </div>

            {/* Detailed Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.createProduct.detailedDescription}
              </h3>
              <div
                className="prose max-w-none text-gray-600 dark:text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: product.description || "No description available",
                }}
              />
            </div>
          </div>

          {/* Specifications Card */}
          {Object.keys(specs).length > 0 && (
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold dark:text-white mb-4">
                {t.createProduct.specifications}
              </h2>

              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="py-2 grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {key}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold dark:text-white mb-4">
              {t.createProduct.metaInfo}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.createAt}
                </p>
                <p className="text-sm font-medium dark:text-white">
                  {new Date(product.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.createProduct.updateAt}
                </p>
                <p className="text-sm font-medium dark:text-white">
                  {new Date(product.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
