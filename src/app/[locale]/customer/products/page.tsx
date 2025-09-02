"use client";

import { useEffect, useState } from "react";

import ProductCard from "@/components/ui/customer/ProductCard";
import { API_BASE_URL } from "@/lib/config";

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

export default function ProductsPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [isGridView, setIsGridView] = useState(true);

  // Get the locale from params
  const locale = "en"; // You'll need to properly await the params if they're async

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, sortBy, sortOrder, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/products`);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.data || data); // Adjust based on your API response structure
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || data); // Adjust based on your API response structure
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const filterAndSortProducts = () => {
    let result = [...products];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(
        (product) => product.category.id.toString() === categoryFilter
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (product) =>
          product.stock_status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = a[sortBy as keyof Product];
          bValue = b[sortBy as keyof Product];
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    setFilteredProducts(result);
  };

  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === "grid" ? "list" : "grid"));
    setIsGridView((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Products
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Our Products
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover our wide range of high-quality products designed to meet your
          needs.
        </p>
      </div>

      {/* Controls Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6 mb-8 transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="w-full md:w-1/3">
            <div className="relative">
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
              <input
                type="text"
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filters and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-2/3">
            {/* Category Filter */}
            <div className="w-full sm:w-1/3">
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-1/3">
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">In Stock</option>
                <option value="inactive">Low Stock</option>
                <option value="out of stock">Out of Stock</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="w-full sm:w-1/3">
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Newest</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center">
              <button
                onClick={toggleViewMode}
                className={`p-2 rounded-lg border ${
                  isGridView
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                } transition-colors`}
                aria-label={
                  isGridView ? "Switch to list view" : "Switch to grid view"
                }
              >
                {isGridView ? (
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
                ) : (
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
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-300">
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {/* Sort Order Toggle */}
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {sortOrder === "asc" ? "Ascending" : "Descending"}
          <svg
            className={`ml-1 h-4 w-4 ${
              sortOrder === "asc" ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center transition-colors duration-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No products found
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-6"
          }
        >
          {filteredProducts.map((product) =>
            viewMode === "grid" ? (
              <ProductCard key={product.id} product={product} locale={locale} />
            ) : (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-colors duration-200"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <div className="relative h-48 md:h-full">
                      <img
                        src={
                          product.images.length > 0
                            ? `${API_BASE_URL}/${
                                product.images.find((img) => img.is_primary)
                                  ?.path || product.images[0].path
                              }`
                            : "/placeholder.png"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="p-6 md:w-3/4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                          {product.description.replace(/<[^>]+>/g, "")}
                        </p>
                      </div>
                      <div className="text-right">
                        {product.discount && product.discount > 0 ? (
                          <>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              $
                              {(
                                product.price -
                                (product.price * product.discount) / 100
                              ).toFixed(2)}
                            </span>
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              ${Number(product.price ?? 0).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${Number(product.price ?? 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.stock > 0
                              ? product.stock <= product.low_stock_threshold
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {product.stock > 0
                            ? product.stock <= product.low_stock_threshold
                              ? "Low Stock"
                              : "In Stock"
                            : "Out of Stock"}
                        </span>
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
                          {product.category.name}
                        </span>
                      </div>

                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Load More Button (for pagination) */}
      {filteredProducts.length > 0 &&
        filteredProducts.length < products.length && (
          <div className="mt-10 text-center">
            <button className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-lg shadow-sm transition-colors duration-200">
              Load More Products
            </button>
          </div>
        )}
    </div>
  );
}
