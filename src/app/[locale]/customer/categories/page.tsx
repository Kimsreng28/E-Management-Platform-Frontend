"use client";

import { API_BASE_URL } from "@/lib/config";
import { debounce } from "lodash";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  parent_id: number | null;
  parent_name: string | null;
  order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
  children_count?: number;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

interface FeaturedResponse {
  success: boolean;
  data: Category[];
}

interface CategoryDetail extends Category {
  children?: Category[];
  products?: any[];
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: ProductImage[];
  category_id: number;
  sku: string;
  stock: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  low_stock_threshold: number;
}

interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string | null;
  is_primary: boolean;
}

export default function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const [locale, setLocale] = useState<"en" | "kh">("en");
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState("order");
  const [sortDirection, setSortDirection] = useState("asc");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalBrands: 0,
    support: "24/7",
  });
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [showProductsModal, setShowProductsModal] = useState(false);

  useEffect(() => {
    const initializeParams = async () => {
      const { locale: resolvedLocale } = await params;
      setLocale(resolvedLocale);
    };
    initializeParams();
  }, [params]);

  useEffect(() => {
    fetchCategories();
    fetchFeaturedCategories();
    fetchStats();
  }, [searchTerm, sortField, sortDirection]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        sortField,
        sortDirection,
        perPage: "12",
      });

      const response = await fetch(`${API_BASE_URL}/api/categories?${params}`);
      const data: CategoriesResponse = await response.json();

      if (data.success) {
        setCategories(data.data);
      } else {
        setError("Failed to fetch categories");
      }
    } catch (err) {
      setError("An error occurred while fetching categories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/featured`);
      const data: FeaturedResponse = await response.json();

      if (data.success) {
        setFeaturedCategories(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch featured categories", err);
    }
  };

  const fetchCategoryDetails = async (slug: string) => {
    try {
      setModalLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/categories/${slug}`);
      const data = await response.json();

      if (data.success) {
        setSelectedCategory(data.data);
      } else {
        console.error("Failed to fetch category details");
      }
    } catch (err) {
      console.error("An error occurred while fetching category details", err);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchCategoryProducts = async (slug: string) => {
    try {
      setProductsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/categories/${slug}/products`
      );
      const data = await response.json();

      if (data.success) {
        setCategoryProducts(data.data);
      } else {
        console.error("Failed to fetch products by category");
      }
    } catch (err) {
      console.error("Error fetching category products", err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setSearchTerm(searchValue);
    }, 300),
    []
  );

  const handleViewDetails = async (category: Category) => {
    setShowModal(true);
    await fetchCategoryDetails(category.slug);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
  };

  const handleSortChange = () => {
    fetchCategories();
  };

  const DescriptionCell = ({ content }: { content: string }) => {
    const [expanded, setExpanded] = useState(false);
    const plainText = useMemo(() => {
      const div = document.createElement("div");
      div.innerHTML = content;
      return div.textContent || div.innerText || "";
    }, [content]);

    const displayText = expanded
      ? plainText
      : `${plainText.substring(0, 50)}...`;

    return (
      <div className="text-sm text-gray-500 dark:text-gray-300">
        {displayText}
        {plainText.length > 50 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            expanded
          </button>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 right-0 p-3"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Product Categories
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore our comprehensive range of electrical measurement and testing
          equipment for a wide variety of applications.
        </p>
      </div>

      {/* Featured Categories */}
      {featuredCategories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2 text-blue-600"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m19.3 8.9l3.2 3.2l-1.4 1.4l-3.2-3.2q-.525.3-1.125.5T15.5 11q-1.875 0-3.187-1.312T11 6.5t1.313-3.187T15.5 2t3.188 1.313T20 6.5q0 .675-.2 1.275T19.3 8.9m-3.8.1q1.05 0 1.775-.725T18 6.5t-.725-1.775T15.5 4t-1.775.725T13 6.5t.725 1.775T15.5 9M4 22q-.825 0-1.412-.587T2 20V6q0-.825.588-1.412T4 4h5.5q-.275.625-.375 1.288t-.1 1.312q0 2.725 1.925 4.55t4.575 1.825q.475 0 .95-.063t.975-.212L20 15.25V20q0 .825-.587 1.413T18 22z"
              />
            </svg>
            Featured Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-md overflow-hidden transition-transform duration-300  cursor-pointer"
                onClick={() => handleViewDetails(category)}
              >
                <div className="relative h-48">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-contain" // Changed to contain to maintain aspect ratio
                      sizes="96px" // Optimize for performance
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Featured
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">{category.name}</h3>
                  <DescriptionCell content={category.description} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(category);
                    }}
                    className="inline-flex cursor-pointer items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View details
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="flex flex-col py-2 sm:py-2 md:py-2 px-2 sm:px-6 lg:px-2">
        <h2 className="text-2xl text-center sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Why Choose Our Equipment?
        </h2>
        <p className="text-center sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
          Professional-grade instruments from trusted manufacturers
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transition-transform transform hover:shadow-xl">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8.422 20.618C10.178 21.54 11.056 22 12 22V12L2.638 7.073l-.04.067C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709z" />
                <path
                  d="m17.577 4.432l-2-1.05C13.822 2.461 12.944 2 12 2c-.945 0-1.822.46-3.578 1.382l-2 1.05C4.318 5.536 3.242 6.1 2.638 7.072L12 12l9.362-4.927c-.606-.973-1.68-1.537-3.785-2.641"
                  opacity="0.7"
                />
                <path
                  d="m21.403 7.14l-.041-.067L12 12v10c.944 0 1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.597-1.014.597-2.277.597-4.8v-.117c0-2.525 0-3.788-.597-4.802"
                  opacity="0.5"
                />
              </svg>
            </div>

            {/* Value */}
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
              {stats.totalProducts}+
            </div>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Products
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transition-transform transform hover:shadow-xl">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M7.425 9.475L11.15 3.4q.15-.25.375-.363T12 2.925t.475.113t.375.362l3.725 6.075q.15.25.15.525t-.125.5t-.35.363t-.525.137h-7.45q-.3 0-.525-.137T7.4 10.5t-.125-.5t.15-.525M17.5 22q-1.875 0-3.187-1.312T13 17.5t1.313-3.187T17.5 13t3.188 1.313T22 17.5t-1.312 3.188T17.5 22M3 20.5v-6q0-.425.288-.712T4 13.5h6q.425 0 .713.288T11 14.5v6q0 .425-.288.713T10 21.5H4q-.425 0-.712-.288T3 20.5m14.5-.5q1.05 0 1.775-.725T20 17.5t-.725-1.775T17.5 15t-1.775.725T15 17.5t.725 1.775T17.5 20M5 19.5h4v-4H5zM10.05 9h3.9L12 5.85zm7.45 8.5"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {stats.totalCategories}
            </div>
            <div className="text-gray-600">Categories</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transition-transform transform hover:shadow-xl">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M4.382 8.813v8.5c0 .845.344 1.656.957 2.253a3.3 3.3 0 0 0 2.308.934h8.706c.866 0 1.696-.336 2.308-.934a3.15 3.15 0 0 0 .957-2.253v-8.5m0-5.313H4.382c-.901 0-1.632.714-1.632 1.594v2.125c0 .88.73 1.593 1.632 1.593h15.236c.901 0 1.632-.713 1.632-1.593V5.094c0-.88-.73-1.594-1.632-1.594M8.735 15.188h6.53"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalBrands}
            </div>
            <div className="text-gray-600">Brands</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transition-transform transform hover:shadow-xl">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7"
                viewBox="0 0 14 14"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.465 3.172h-2.748a.215.215 0 0 1-.215-.216v0a.22.22 0 0 1 .053-.142l1.96-2.24a.2.2 0 0 1 .154-.07v0c.112 0 .204.092.204.204v3.353M8.851 4.06h-2.37v-.505a.89.89 0 0 1 .532-.814l1.32-.577a.866.866 0 0 0-.348-1.66H7.37a.89.89 0 0 0-.838.593M3.772 4.33c-.7-.607-1.727-.5-2.275.247c-.088.12-.195.261-.337.439a2.885 2.885 0 0 0 .004 3.591a28 28 0 0 0 4.26 4.26a2.886 2.886 0 0 0 3.59.004c.199-.159.351-.273.48-.366a1.486 1.486 0 0 0 .26-2.196c-.284-.33-.585-.648-.882-.96c-.384-.405-1.043-.45-1.466-.084c-.078.067-.178.158-.32.291c-1.193-.708-1.916-1.44-2.612-2.61c.136-.146.228-.248.295-.326a1.067 1.067 0 0 0-.086-1.46a34 34 0 0 0-.911-.83"
                  stroke-width="1"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {stats.support}
            </div>
            <div className="text-gray-600">Support</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search categories..."
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setViewMode("grid");
                }}
                className={`p-2 rounded-md cursor-pointer ${
                  viewMode === "grid" ? "bg-white shadow-sm" : ""
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  setViewMode("list");
                }}
                className={`p-2 rounded-md cursor-pointer ${
                  viewMode === "list" ? "bg-white shadow-sm" : ""
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            <div className="relative w-45">
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split("-");
                  setSortField(field);
                  setSortDirection(direction);
                }}
                className="
                  w-full
                  cursor-pointer
                  appearance-none
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-700
                  rounded-xl px-4 py-3
                  text-sm font-medium text-gray-700 dark:text-gray-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  shadow-sm
                  transition
                "
              >
                <option value="order-asc">Default Order</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
              </select>

              {/* dropdown arrow */}
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Categories */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center dark:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2 text-blue-600"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M7.425 9.475L11.15 3.4q.15-.25.375-.363T12 2.925t.475.113t.375.362l3.725 6.075q.15.25.15.525t-.125.5t-.35.363t-.525.137h-7.45q-.3 0-.525-.137T7.4 10.5t-.125-.5t.15-.525M17.5 22q-1.875 0-3.187-1.312T13 17.5t1.313-3.187T17.5 13t3.188 1.313T22 17.5t-1.312 3.188T17.5 22M3 20.5v-6q0-.425.288-.712T4 13.5h6q.425 0 .713.288T11 14.5v6q0 .425-.288.713T10 21.5H4q-.425 0-.712-.288T3 20.5m14.5-.5q1.05 0 1.775-.725T20 17.5t-.725-1.775T17.5 15t-1.775.725T15 17.5t.725 1.775T17.5 20M5 19.5h4v-4H5zM10.05 9h3.9L12 5.85zm7.45 8.5"
              />
            </svg>
            All Categories
          </h2>
          <div className="text-sm text-gray-500">
            Showing {categories.length} of {stats.totalCategories} categories
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400 text-lg">
            No categories found.
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => handleViewDetails(category)}
              >
                <div className="relative h-40 flex items-center justify-center bg-gray-100 p-4">
                  {category.image ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">
                    {category.name}
                  </h3>
                  {category.parent_name && (
                    <div className="text-xs text-gray-500 mb-2">
                      Parent: {category.parent_name}
                    </div>
                  )}
                  <DescriptionCell content={category.description} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(category);
                    }}
                    className="text-sm cursor-pointer hover:underline text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                  >
                    View details
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
                onClick={() => handleViewDetails(category)}
              >
                <div className="p-4 flex items-start">
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden mr-4 flex items-center justify-center">
                    {category.image ? (
                      <div className="relative w-16 h-16">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    {category.parent_name && (
                      <div className="text-xs text-gray-500 mb-1">
                        Parent: {category.parent_name}
                      </div>
                    )}
                    <DescriptionCell content={category.description} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(category);
                      }}
                      className="text-sm cursor-pointer hover:underline text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                    >
                      View details
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Category Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 cursor-pointer hover:text-gray-700"
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

              {modalLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
                </div>
              ) : selectedCategory ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                      <div className="relative h-48 w-full bg-gray-100 rounded-lg overflow-hidden">
                        {selectedCategory.image ? (
                          <Image
                            src={selectedCategory.image}
                            alt={selectedCategory.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-16 h-16 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:w-2/3">
                      <h3 className="text-2xl font-bold mb-2">
                        {selectedCategory.name}
                      </h3>
                      {selectedCategory.parent_name && (
                        <p className="text-gray-600 mb-2">
                          <span className="font-semibold">
                            Parent Category:
                          </span>{" "}
                          {selectedCategory.parent_name}
                        </p>
                      )}
                      <DescriptionCell content={selectedCategory.description} />
                      <div className="grid grid-cols-2 gap-4 mb-4 mt-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600">Products</div>
                          <div className="text-xl font-bold">
                            {selectedCategory.products?.length || 0}
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-600">
                            Subcategories
                          </div>
                          <div className="text-xl font-bold">
                            {selectedCategory.children?.length || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedCategory.children &&
                    selectedCategory.children.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">
                          Subcategories
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedCategory.children.map((child) => (
                            <div
                              key={child.id}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="font-medium">{child.name}</div>
                              <div className="text-sm text-gray-600 line-clamp-1">
                                {child.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedCategory.products &&
                    selectedCategory.products.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Products</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedCategory.products
                            .slice(0, 5)
                            .map((product) => (
                              <div
                                key={product.id}
                                className="bg-gray-50 p-3 rounded-lg"
                              >
                                <div className="font-medium">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  ${product.price}
                                </div>
                              </div>
                            ))}
                          {selectedCategory.products.length > 5 && (
                            <div className="text-center text-sm text-blue-600 mt-2">
                              +{selectedCategory.products.length - 5} more
                              products
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border cursor-pointer border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={async () => {
                        if (selectedCategory) {
                          await fetchCategoryProducts(selectedCategory.slug);
                          setShowProductsModal(true);
                        }
                      }}
                      className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View All Products
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load category details
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Products in {selectedCategory?.name}
              </h2>
              <button
                onClick={() => setShowProductsModal(false)}
                className="text-gray-600 cursor-pointer dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 relative">
              {productsLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-white/70 dark:bg-gray-900/70 z-50">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
                </div>
              )}

              {categoryProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col"
                    >
                      <div className="relative w-full h-48 rounded-lg overflow-hidden mb-3">
                        <Image
                          src={
                            product.images.length > 0
                              ? `${API_BASE_URL}/${
                                  product.images.find((img) => img.is_primary)
                                    ?.path
                                }`
                              : "/placeholder.png"
                          }
                          alt={product.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      </div>
                      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                        {product.description.replace(/<[^>]+>/g, "")}
                      </p>
                      <div className="mt-auto pt-2 flex flex-col gap-1">
                        <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                          ${product.price}
                        </p>

                        {product.stock > 0 ? (
                          <span
                            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                              product.stock <= product.low_stock_threshold
                                ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
                                : "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                            }`}
                          >
                            {product.stock <= product.low_stock_threshold
                              ? "Low Stock"
                              : "In Stock"}
                          </span>
                        ) : (
                          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !productsLoading && (
                  <p className="text-gray-500 dark:text-gray-400 text-center mt-10">
                    No products found in this category.
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
