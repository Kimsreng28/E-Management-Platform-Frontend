"use client";

import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoIosArrowBack, IoIosSearch } from "react-icons/io";
import { MdAdd, MdDelete, MdMoreVert, MdVisibility } from "react-icons/md";
import { RiEditLine } from "react-icons/ri";
import Swal from "sweetalert2";

interface Product {
  id: number;
  name: string;
  slug: string;
  model_code: string;
  price: number | string;
  stock: number;
  stock_status: string;
  is_active: boolean;
  is_featured: boolean;
  category: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
  images: {
    path: string;
    is_primary: boolean;
  }[];
}

export default function ProductListPage({
  params,
}: {
  params: { locale: "en" | "kh" };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split("/")[1] || "en";
  const language = params.locale || "en";
  const t = useTranslations(language);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          per_page: itemsPerPage.toString(),
          sort_by: sortField,
          sort_order: sortOrder,
          ...(searchTerm && { search: searchTerm }),
        });

        const res = await fetch(
          `${API_BASE_URL}/api/products?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        setProducts(data.data || data.items || []);
        setTotalItems(data.total || data.meta?.total || 0);
      } catch (error) {
        console.error("Error fetching products:", error);
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "Failed to load products",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, itemsPerPage, searchTerm, sortField, sortOrder]);

  // Handle delete product
  const handleDelete = async (productId: number, productName: string) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You are about to delete "${productName}". This action cannot be undone!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
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

        // Refresh the product list
        setProducts(products.filter((product) => product.id !== productId));
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

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // Toggle dropdown
  const toggleDropdown = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling up to document
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownOpen !== null) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  // Pagination controls
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationButtons = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationButtons.push(
      <button
        key={i}
        onClick={() => setCurrentPage(i)}
        className={`px-3 py-1 rounded ${
          currentPage === i
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-1 lg:py-1 py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${currentLocale}/dashboard/products`)}
          className="bg-gray-100 border border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow px-2 py-2 transition flex-shrink-0"
        >
          <IoIosArrowBack className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">
            {t.createProduct.manageProducts}
          </h1>
          <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
            {t.createProduct.viewAndManageProducts}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-48 md:w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <IoIosSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="w-full text-xs sm:text-sm md:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg pl-8 sm:pl-10 py-1.5 sm:py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              router.push(`/${currentLocale}/dashboard/products/new/product`)
            }
            className="flex items-center justify-center shadow-md border border-gray-300 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all duration-200 rounded-lg py-1.5 px-2 sm:py-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base w-full sm:w-auto"
          >
            <MdAdd className="mr-2 w-5 h-5" />
            {t.createProduct.addNewProduct}
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-5 flex-row gap-1">
            <div className="w-2 h-2 rounded-full bg-black animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-.5s]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      {t.createProduct.name} {getSortIndicator("name")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("model_code")}
                  >
                    <div className="flex items-center">
                      {t.createProduct.modelCode}{" "}
                      {getSortIndicator("model_code")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t.createProduct.category}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t.createProduct.brand}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center">
                      {t.createProduct.price} {getSortIndicator("price")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("stock")}
                  >
                    <div className="flex items-center">
                      {t.createProduct.stock} {getSortIndicator("stock")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t.createProduct.stockStatus}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t.createProduct.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.images.length > 0 ? (
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={`${API_BASE_URL}/${product.images[0].path}`}
                                alt={product.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-xs text-gray-500 dark:text-gray-300">
                                  No Image
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.is_featured && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                  {t.createProduct.featured}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.model_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.category?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.brand?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        $
                        {typeof product.price === "string"
                          ? parseFloat(product.price).toFixed(2)
                          : product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            className="inline-flex justify-center w-8 h-8 rounded-full items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(product.id, e);
                            }}
                          >
                            <MdMoreVert className="w-5 h-5" />
                          </button>

                          {dropdownOpen === product.id && (
                            <div
                              className="origin-top-right absolute right-0 mt-2 w-35 rounded-md shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 z-50"
                              style={{ position: "fixed" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                className="py-1"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="options-menu"
                              >
                                <button
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/${currentLocale}/dashboard/products/view/product/${product.slug}/detail`
                                    );
                                    setDropdownOpen(null);
                                  }}
                                >
                                  <MdVisibility className="mr-2" />
                                  {t.createProduct.viewDetail}
                                </button>
                                <button
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/${currentLocale}/dashboard/products/${product.slug}/edit/product`
                                    );
                                    setDropdownOpen(null);
                                  }}
                                >
                                  <RiEditLine className="mr-2" />
                                  {t.createProduct.edit}
                                </button>
                                <button
                                  className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(product.id, product.name);
                                    setDropdownOpen(null);
                                  }}
                                >
                                  <MdDelete className="mr-2" />
                                  {t.createProduct.delete}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {products.length > 0 && (
          <div className="px-3 sm:px-5 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
              {/* Rows per page selector */}
              <div className="flex items-center">
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mr-2">
                  {t.viewCategory.rowsPerPage}:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1 sm:px-2 py-1"
                >
                  {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  {t.viewCategory.first}
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  {t.viewCategory.previous}
                </button>

                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 px-1 sm:px-2">
                  {t.viewCategory.page} {currentPage} {t.viewCategory.of}{" "}
                  {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  {t.viewCategory.next}
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  {t.viewCategory.last}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
