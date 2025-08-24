"use client";

import { API_BASE_URL } from "@/lib/config";
import { useEffect, useState } from "react";
import { AiTwotoneEdit } from "react-icons/ai";
import { IoIosRefresh } from "react-icons/io";
import Swal from "sweetalert2";

// Define interfaces for the data structures
interface Product {
  id: number;
  name: string;
  sku?: string;
  stock: number;
  low_stock_threshold: number;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export default function StocksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [lowStockAlert, setLowStockAlert] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [editStock, setEditStock] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  useEffect(() => {
    fetchProducts();
    fetchLowStockAlert();
  }, [currentPage, itemsPerPage]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchProducts = async (): Promise<void> => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/stock?page=${currentPage}&per_page=${itemsPerPage}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data: ApiResponse<PaginatedResponse<Product>> =
        await response.json();

      if (data.success) {
        setProducts(data.data.data);
        setTotalPages(data.data.last_page);
        setTotalItems(data.data.total);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockAlert = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/low-stock`, {
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<Product[] | PaginatedResponse<Product>> =
        await response.json();

      if (data.success) {
        if (Array.isArray(data.data)) {
          setLowStockAlert(data.data);
        } else {
          setLowStockAlert(data.data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching low stock alerts:", error);
    }
  };

  const handleUpdateStock = async (): Promise<void> => {
    if (!editingProduct) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/stock/${editingProduct.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            stock: editStock,
            low_stock_threshold: editThreshold,
          }),
        }
      );

      const data: ApiResponse<Product> = await response.json();
      if (data.success) {
        fetchProducts();
        fetchLowStockAlert();
        setEditingProduct(null);

        Swal.fire({
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
          icon: "success",
          title: "Stock updated successfully",
        });
      } else {
        Swal.fire({
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
          icon: "error",
          title: data.message || "Failed to update stock",
        });
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      Swal.fire({
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        icon: "error",
        title: "Failed to update stock",
      });
    }
  };

  const handleRestock = async (): Promise<void> => {
    if (!restockProduct || restockQuantity <= 0) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/stock/${restockProduct.id}/restock`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            quantity: parseInt(restockQuantity.toString()),
          }),
        }
      );

      const data: ApiResponse<Product> = await response.json();
      if (data.success) {
        fetchProducts();
        fetchLowStockAlert();
        setRestockProduct(null);
        setRestockQuantity(0);

        Swal.fire({
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
          icon: "success",
          title: "Product restocked successfully",
        });
      } else {
        Swal.fire({
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
          icon: "error",
          title: data.message || "Failed to restock product",
        });
      }
    } catch (error) {
      console.error("Error restocking:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to restock product",
      });
    }
  };

  interface StockStatus {
    status: "out-of-stock" | "low" | "in-stock";
    label: string;
    color: string;
  }

  const getStockStatus = (stock: number, threshold: number): StockStatus => {
    if (stock === 0)
      return {
        status: "out-of-stock",
        label: "Out of Stock",
        color: "bg-red-100 text-red-800",
      };
    if (stock <= threshold)
      return {
        status: "low",
        label: "Low Stock",
        color: "bg-yellow-100 text-yellow-800",
      };
    return {
      status: "in-stock",
      label: "In Stock",
      color: "bg-green-100 text-green-800",
    };
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku &&
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "low")
      return (
        matchesSearch &&
        getStockStatus(product.stock, product.low_stock_threshold).status ===
          "low"
      );
    if (activeTab === "out")
      return (
        matchesSearch &&
        getStockStatus(product.stock, product.low_stock_threshold).status ===
          "out-of-stock"
      );

    return matchesSearch;
  });

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-1 lg:py-1 py-6 sm:space-y-6 md:px-6 sm:py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 dark:text-white">
            Stock Management
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300">
            Manage your stocks and inventory.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>

          <select
            value={activeTab}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setActiveTab(e.target.value)
            }
            className="w-full sm:w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="all">All Products</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockAlert.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-red-800 font-medium dark:text-red-200">
              Low Stock Alert
            </h3>
          </div>
          <p className="text-red-700 mt-1 dark:text-red-300">
            {lowStockAlert.length} product(s) are running low on stock
          </p>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Inventory
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Manage your product inventory and stock levels
          </p>

          {loading ? (
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-black animate-bounce dark:bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-.2s] dark:bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-.4s] dark:bg-white"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500 dark:text-gray-300">
                No products found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider dark:text-gray-300"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-800  uppercase tracking-wider dark:text-gray-300"
                    >
                      Current Stock
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-800  uppercase tracking-wider dark:text-gray-300"
                    >
                      Threshold
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-800  uppercase tracking-wider dark:text-gray-300"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-800  uppercase tracking-wider dark:text-gray-300"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {filteredProducts.map((product: Product) => {
                    const stockStatus = getStockStatus(
                      product.stock,
                      product.low_stock_threshold
                    );
                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {product.low_stock_threshold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.color}`}
                          >
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setEditStock(product.stock);
                                setEditThreshold(product.low_stock_threshold);
                              }}
                              title="Edit Stock"
                              className="text-blue-600 cursor-pointer hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <AiTwotoneEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setRestockProduct(product);
                                setRestockQuantity(0);
                              }}
                              title="Restock"
                              className="text-green-600 cursor-pointer hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <IoIosRefresh className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {products.length > 0 && (
          <div className="px-3 sm:px-5 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
              {/* Rows per page selector */}
              <div className="flex items-center">
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mr-2">
                  Rows per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
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
                  First
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 px-1 sm:px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Stock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6 dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Edit Stock
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
              Update stock levels for {editingProduct.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditStock(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={editThreshold}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditThreshold(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6 dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Restock Product
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
              Add stock to {restockProduct.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity to Add
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRestockQuantity(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Total
                </label>
                <p className="text-lg font-medium">
                  {(restockProduct.stock || 0) + (restockQuantity || 0)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setRestockProduct(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
