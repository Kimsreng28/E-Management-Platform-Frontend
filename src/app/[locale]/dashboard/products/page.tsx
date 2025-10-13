"use client";

import QrCodeDisplay from "@/components/ui/dashboard/products/QrCodeDisplay";
import StatCard from "@/components/ui/dashboard/StatCard";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { IoIosArrowDown, IoIosArrowUp, IoIosSearch } from "react-icons/io";
import { IoQrCodeOutline } from "react-icons/io5";
import { MdAdd, MdClose, MdDelete, MdFileUpload, MdMoreVert, MdVisibility } from "react-icons/md";
import { RiEditLine } from "react-icons/ri";
import Swal from "sweetalert2";
import EditProductPage from "./[slug]/edit/product/page";
import CreateBrandPage from "./new/brand/page";
import CreateCategoryPage from "./new/category/page";
import CreateProductPage from "./new/product/page";

interface ProductStats {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
}

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

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  parent_id: number | null;
  parent_name?: string | null;
  order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// Import Preview Types
interface ImportPreviewData {
  imported: number;
  skipped: number;
  errors: string[];
  previewData?: Array<{
    name: string;
    model_code: string;
    category: string;
    brand: string;
    price: number;
    stock: number;
    status: string;
  }>;
  totalRows?: number;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProductsPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const unwrappedParams = use(params);
  const language = unwrappedParams.locale || "en";
  const currentLocale = pathname.split("/")[1] || "en";
  const t = useTranslations(language);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const [priceRange, setPriceRange] = useState<[number, number] | null>([1, 300]);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [brands, setBrands] = useState<any[]>([]);

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);

  // Import Preview State
  const [showImportPreviewModal, setShowImportPreviewModal] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<ImportPreviewData | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Status options
  const statusOptions = [
    { value: null, label: t.createProduct.allStatuses },
    { value: "Active", label: t.createProduct.active },
    { value: "Inactive", label: t.createProduct.inactive },
    { value: "Out of Stock", label: t.createProduct.outOfStock },
  ];

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();

        // Handle different response structures
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data.data && Array.isArray(data.data)) {
          setCategories(data.data);
        } else if (data.items && Array.isArray(data.items)) {
          setCategories(data.items);
        } else {
          console.error("Unexpected categories response structure:", data);
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch brand from API
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/companies`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch brands");
        const data = await res.json();

        // Handle different response structures
        if (Array.isArray(data)) {
          setBrands(data);
        } else if (data.data && Array.isArray(data.data)) {
          setBrands(data.data);
        } else if (data.items && Array.isArray(data.items)) {
          setBrands(data.items);
        } else {
          console.error("Unexpected brands response structure:", data);
          setBrands([]);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
        setBrands([]);
      }
    };
    fetchBrands();
  }, []);

  // Fetch products from API
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
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedCategory && { category_id: selectedCategory.toString() }),
        ...(selectedBrand && { brand_id: selectedBrand.toString() }),
        ...(stockFilter && { stock: stockFilter }),
        ...(priceRange && {
          min_price: priceRange[0].toString(),
          max_price: priceRange[1].toString()
        }),
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

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    sortField,
    sortOrder,
    selectedStatus,
    selectedCategory,
    selectedBrand,
    stockFilter,
    priceRange
  ]);



  // Handle delete product
  const handleDelete = async (productId: number, productSlug: string, productName: string) => {
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
        const res = await fetch(`${API_BASE_URL}/api/products/${productSlug}`, {
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
    return (
      <span className="inline-flex flex-col ml-1">
        <IoIosArrowUp
          className={`w-3 h-3 ${sortField === field && sortOrder === "asc"
            ? "text-gray-900 dark:text-gray-200"
            : "text-gray-400 dark:text-gray-200"
            }`}
        />
        <IoIosArrowDown
          className={`w-3 h-3 ${sortField === field && sortOrder === "desc"
            ? "text-gray-900 dark:text-gray-200"
            : "text-gray-400 dark:text-gray-200"
            }`}
        />
      </span>
    );
  };

  const DROPDOWN_WIDTH = 160;
  const DROPDOWN_EST_HEIGHT = 160;
  const PADDING = 8;

  const toggleDropdown = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (dropdownOpen === id) {
      setDropdownOpen(null);
      setDropdownPosition(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    let left = rect.right - DROPDOWN_WIDTH;
    if (left < PADDING) left = PADDING;
    if (left + DROPDOWN_WIDTH + PADDING > window.innerWidth) {
      left = Math.max(window.innerWidth - DROPDOWN_WIDTH - PADDING, PADDING);
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    let top =
      spaceBelow >= DROPDOWN_EST_HEIGHT
        ? rect.bottom
        : Math.max(rect.top - DROPDOWN_EST_HEIGHT, PADDING);

    setDropdownOpen(id);
    setDropdownPosition({ top, left });
  };

  // Close on outside click, scroll, or resize
  useEffect(() => {
    if (dropdownOpen === null) return;
    const close = () => {
      setDropdownOpen(null);
      setDropdownPosition(null);
    };
    document.addEventListener("click", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [dropdownOpen]);

  // Pagination controls
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationButtons = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationButtons.push(
      <button
        key={i}
        onClick={() => setCurrentPage(i)}
        className={`px-3 py-1 rounded ${currentPage === i
          ? "bg-indigo-600 text-white"
          : "bg-gray-200 hover:bg-gray-300"
          }`}
      >
        {i}
      </button>
    );
  }

  // Fetch product statistics from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(`${API_BASE_URL}/api/products/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch statistics");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching product stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleExportProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      const queryParams = new URLSearchParams();
      if (selectedStatus) queryParams.append('status', selectedStatus);
      if (selectedCategory) queryParams.append('category_id', selectedCategory.toString());
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await fetch(
        `${API_BASE_URL}/api/products/export/csv?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to export products");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Products exported successfully!",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } catch (error) {
      console.error("Error exporting products:", error);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Failed to export products",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    }
  };

  // Preview CSV file before import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      // Read CSV file for preview
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length <= 1) {
        throw new Error('CSV file is empty or has only headers');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      // Parse ALL rows (skip header)
      const previewData = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.toLowerCase()] = values[index] || '';
        });

        return {
          name: row.name || 'N/A',
          model_code: row.model_code || row['model code'] || 'N/A',
          category: row.category || 'N/A',
          brand: row.brand || 'N/A',
          price: parseFloat(row.price) || 0,
          stock: parseInt(row.stock) || 0,
          status: row.status || 'Active'
        };
      }).filter(row => row.name !== 'N/A'); // Filter out empty rows

      setImportPreviewData({
        imported: 0,
        skipped: 0,
        errors: [],
        previewData,
        totalRows: previewData.length
      });
      setShowImportPreviewModal(true);

    } catch (error) {
      console.error("Error reading CSV file:", error);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Failed to read CSV file",
        text: error instanceof Error ? error.message : 'Invalid CSV format',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    }
  };

  // Confirm and execute import
  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    try {
      setImportLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('csv_file', selectedFile);

      const res = await fetch(`${API_BASE_URL}/api/products/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to import products");

      const result = await res.json();

      // Update preview data with actual results
      setImportPreviewData(result);

      if (result.errors && result.errors.length > 0) {
        // Show detailed results in modal
        setImportPreviewData(result);
      } else {
        // Close modal and show success
        setShowImportPreviewModal(false);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `Successfully imported ${result.imported} products!`,
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });

        // Refresh the page data
        await fetchProducts();

        // Also refresh stats
        const token = localStorage.getItem("token");
        const statsResponse = await fetch(`${API_BASE_URL}/api/products/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Reset file input
        const fileInput = document.getElementById('import-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Error importing products:", error);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Failed to import products",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleAddCategory = () => {
    setShowAddCategoryModal(true);
  };

  const handleAddBrand = () => {
    setShowAddBrandModal(true);
  };

  const handleAddProduct = () => {
    setShowAddProductModal(true);
  };

  const handleEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setShowEditProductModal(true);
  };

  const handleGenerateQrCode = (prod: Product) => {
    setSelectedProduct(prod);
    setShowQrCodeModal(true);
  };

  const handleModalClose = () => {
    setShowAddCategoryModal(false);
    setShowAddBrandModal(false);
    setShowAddProductModal(false);
    setShowEditProductModal(false);
    setShowQrCodeModal(false);
    setShowImportPreviewModal(false);
    setImportPreviewData(null);
    setSelectedFile(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    window.location.reload();
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const stockOptions = [
    { value: t.createProduct.allStock, label: t.createProduct.allStock },
    { value: "in_stock", label: t.createProduct.inStock },
    { value: "low_stock", label: t.createProduct.lowStock },
    { value: "out_of_stock", label: t.createProduct.outOfStock },
  ];

  return (
    <div className="space-y-3 px-2 sm:px-2 lg:px-2 lg:py-2 py-2 sm:space-y-3 md:px-2 sm:py-2">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 dark:text-white">
            {t.productDashboard.products}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300">
            {t.productDashboard.manageYourProducts}
          </p>
        </div>

        {/* Buttons Section */}
        <div className="flex xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Import Button */}
          <button
            onClick={() => document.getElementById('import-file')?.click()}
            className="flex items-center justify-center cursor-pointer shadow-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition-all duration-200 rounded-lg py-2 px-3 sm:py-2 sm:px-4 text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M11 16V7.85l-2.6 2.6L7 9l5-5l5 5l-1.4 1.45l-2.6-2.6V16h-2Zm-7 4v-5h2v3h12v-3h2v5H4Z" />
            </svg>
            <span className="whitespace-nowrap">{t.productDashboard.import}</span>
          </button>
          <input
            type="file"
            id="import-file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Export Button */}
          <button
            onClick={handleExportProducts}
            className="flex items-center justify-center cursor-pointer shadow-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition-all duration-200 rounded-lg py-2 px-3 sm:py-2 sm:px-4 text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M6 20q-.825 0-1.413-.588T4 18v-3h2v3h12v-3h2v3q0 .825-.588 1.413T18 20H6Zm6-4l-5-5l1.4-1.45l2.6 2.6V4h2v8.15l2.6-2.6L17 11l-5 5Z" />
            </svg>
            <span className="whitespace-nowrap">{t.productDashboard.export}</span>
          </button>

          {/* Add Category Button (secondary) */}
          <button
            onClick={handleAddCategory}
            className="flex items-center justify-center cursor-pointer shadow-md border border-gray-300 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all duration-200 rounded-lg py-2 px-3 sm:py-2 sm:px-4 text-sm sm:text-base"
          >
            <MdAdd className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">
              {t.productDashboard.addCategory}
            </span>
          </button>

          {/* Add Brand Button (outline/tertiary) */}
          <button
            onClick={handleAddBrand}
            className="flex items-center justify-center cursor-pointer shadow-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition-all duration-200 rounded-lg py-2 px-3 sm:py-2 sm:px-4 text-sm sm:text-base"
          >
            <MdAdd className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">
              {t.createProduct.addBrand}
            </span>
          </button>

          {/* Add Product Button (primary) */}
          <button
            onClick={handleAddProduct}
            className="flex items-center justify-center cursor-pointer shadow-md bg-black text-white hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-gray-300 transition-all duration-200 rounded-lg py-2 px-3 sm:py-2 sm:px-4 text-sm sm:text-base"
          >
            <MdAdd className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">
              {t.productDashboard.addProduct}
            </span>
          </button>
        </div>
      </div>

      {/* Import Preview Modal */}
      {showImportPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t.productDashboard.importPreview}
                  </h3>
                  {importPreviewData?.totalRows && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t.productDashboard.totalProductsToImport}: {importPreviewData.totalRows}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {importPreviewData?.previewData ? (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t.productDashboard.allProductsInCSV} ({importPreviewData.previewData.length} {t.productDashboard.items}):
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t.productDashboard.scrollToSeeAllProducts}
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-96 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t.productDashboard.name}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t.productDashboard.modelCode}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t.productDashboard.category}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t.productDashboard.brand}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t.productDashboard.price}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t.productDashboard.stock}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t.productDashboard.status}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {importPreviewData.previewData.map((row, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                {row.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">
                                {row.model_code}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {row.category}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {row.brand}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                ${row.price.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {row.stock}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'Active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {t.productDashboard.importInformation}
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                          <p>• {t.productDashboard.all} {importPreviewData.previewData.length} {t.productDashboard.productsWillBeProcessed}</p>
                          <p>• {t.productDashboard.productsWithExisting}</p>
                          <p>• {t.productDashboard.missingCategoriesOrBrands}</p>
                          <p>• {t.productDashboard.reviewTheData}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={handleModalClose}
                      className="flex items-center cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <MdClose className="w-4 h-4 mr-2" />
                      {t.productDashboard.cancel}
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={importLoading}
                      className="flex items-center cursor-pointer px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                      {importLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t.productDashboard.importing}
                        </span>
                      ) : (
                        <>
                          <MdFileUpload className="w-4 h-4 mr-2" />
                          {t.productDashboard.importAll} {importPreviewData?.previewData?.length} {t.productDashboard.products}
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : importPreviewData?.errors && importPreviewData.errors.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.productDashboard.importResults}:
                    </h4>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            {t.productDashboard.importCompletedWith} {importPreviewData.errors.length} {t.productDashboard.error}
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                            <p><strong>{t.productDashboard.imported}:</strong> {importPreviewData.imported} {t.productDashboard.product}</p>
                            <p><strong>{t.productDashboard.skipped}:</strong> {importPreviewData.skipped} {t.productDashboard.product}</p>
                            <div className="mt-3">
                              <p className="font-medium">{t.productDashboard.errors}:</p>
                              <div className="mt-2 max-h-40 overflow-y-auto">
                                <ul className="list-disc list-inside space-y-1">
                                  {importPreviewData.errors.map((error, index) => (
                                    <li key={index} className="text-xs font-mono">{error}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={handleModalClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {t.productDashboard.close}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title={t.createProduct.totalProducts}
          value={stats?.total_products?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.5"
                d="M21.984 10c-.037-1.311-.161-2.147-.581-2.86c-.598-1.015-1.674-1.58-3.825-2.708l-2-1.05C13.822 2.461 12.944 2 12 2s-1.822.46-3.578 1.382l-2 1.05C4.271 5.56 3.195 6.125 2.597 7.14C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709l2 1.049C10.178 21.539 11.056 22 12 22s1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.42-.713.544-1.549.581-2.86M21 7.5l-4 2M12 12L3 7.5m9 4.5v9.5m0-9.5l4.5-2.25l.5-.25m0 0V13m0-3.5l-9.5-5"
              />
            </svg>
          }
          gradientFrom="from-[#5d30b6]"
          gradientTo="to-[#5752cf]"
        />
        <StatCard
          title={t.createProduct.activeProducts}
          value={stats?.active_products?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.5"
                d="M21.984 10c-.037-1.311-.161-2.147-.581-2.86c-.598-1.015-1.674-1.58-3.825-2.708l-2-1.05C13.822 2.461 12.944 2 12 2s-1.822.46-3.578 1.382l-2 1.05C4.271 5.56 3.195 6.125 2.597 7.14C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709l2 1.049C10.178 21.539 11.056 22 12 22s1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.42-.713.544-1.549.581-2.86M21 7.5l-4 2M12 12L3 7.5m9 4.5v9.5m0-9.5l4.5-2.25l.5-.25m0 0V13m0-3.5l-9.5-5"
              />
            </svg>
          }
          gradientFrom="from-[#2563eb]"
          gradientTo="to-[#06b6d4]"
        />
        <StatCard
          title={t.createProduct.lowStock}
          value={stats?.low_stock_products?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 24 24"
            >
              <g fill="none">
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.5"
                  d="M6.31 9C8.594 5 9.967 3 12 3c2.31 0 3.77 2.587 6.688 7.762l.364.644c2.425 4.3 3.638 6.45 2.542 8.022S17.786 21 12.364 21h-.728c-5.422 0-8.134 0-9.23-1.572c-.951-1.364-.163-3.165 1.648-6.428M12 8v5"
                />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </g>
            </svg>
          }
          gradientFrom="from-[#ec4899]"
          gradientTo="to-[#f97316]"
        />
        <StatCard
          title={t.createProduct.outOfStock}
          value={stats?.out_of_stock_products?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 24 24"
            >
              <g fill="none">
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.5"
                  d="M6.31 9C8.594 5 9.967 3 12 3c2.31 0 3.77 2.587 6.688 7.762l.364.644c2.425 4.3 3.638 6.45 2.542 8.022S17.786 21 12.364 21h-.728c-5.422 0-8.134 0-9.23-1.572c-.951-1.364-.163-3.165 1.648-6.428M12 8v5"
                />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </g>
            </svg>
          }
          gradientFrom="from-[#22c55e]"
          gradientTo="to-[#0d9488]"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Search, filter by status and categories, and manage your products */}
        <div className=" p-2 m-2 ">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t.createProduct.manageYourProducts}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.createProduct.searchFilterManage}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 flex justify-center items-center pl-2 pointer-events-none">
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

              {/* Filter by Status (Dropdown) */}
              <div className="relative w-full md:w-48">
                <select
                  id="status"
                  value={selectedStatus || ""}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-600 appearance-none"
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option.value || "all"}
                      value={option.value || ""}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
              </div>

              {/* Filter by Categories (Dropdown) */}
              <div className="relative w-full md:w-52">
                <select
                  id="category"
                  value={selectedCategory || ""}
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-2 py-2 pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-600 appearance-none"
                >
                  <option value="">{t.createProduct.allCategories}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
              </div>

              {/* Filter by Brand */}
              <div className="relative w-full md:w-48">
                <select
                  value={selectedBrand || ""}
                  onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : null)}
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-600 appearance-none"
                >
                  <option value="">{t.productDashboard.allBrands}</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
              </div>

              {/* Filter by Stock */}
              <div className="relative w-full md:w-48">
                <select
                  value={stockFilter || ""}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-600 appearance-none"
                >
                  {stockOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value || ""}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
              </div>

              {/* Filter by Price Range */}
              <div className="relative w-full md:w-64">
                <div className="flex space-x-2">
                  {/* Min Price */}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full text-sm sm:text-base border shadow 
                      focus:border-transparent transition-all duration-200 ease-in-out 
                      focus:outline-none focus:ring-1 focus:ring-gray-300 
                    border-gray-300 rounded-lg pl-6 pr-3 py-2 
                    dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      value={priceRange?.[0] || ""}
                      onChange={(e) => setPriceRange([
                        e.target.value ? Number(e.target.value) : 0,
                        priceRange?.[1] || 1000
                      ])}
                    />
                  </div>

                  {/* Max Price */}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full text-sm sm:text-base border shadow 
                      focus:border-transparent transition-all duration-200 ease-in-out 
                      focus:outline-none focus:ring-1 focus:ring-gray-300 
                    border-gray-300 rounded-lg pl-6 pr-3 py-2 
                    dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      value={priceRange?.[1] || ""}
                      onChange={(e) => setPriceRange([
                        priceRange?.[0] || 0,
                        e.target.value ? Number(e.target.value) : 1000
                      ])}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

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
                    {t.createProduct.modelCode} {getSortIndicator("model_code")}
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-black animate-bounce dark:bg-white"></div>
                      <div className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-.2s] dark:bg-white"></div>
                      <div className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-.4s] dark:bg-white"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t.createProduct.noProductFound}
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
                        <div className="flex-shrink-0 h-15 w-15 rounded-md overflow-hidden shadow shadow-gray-400 dark:shadow-gray-200 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                          {product.images.length > 0 ? (
                            <img
                              className="w-full h-full object-cover"
                              src={`${API_BASE_URL}/${product.images[0].path}`}
                              alt={product.name}
                            />
                          ) : (
                            <img
                              className="w-3/6 h-3/6 object-contain"
                              src="/images/placeholder.png"
                              alt="Placeholder"
                            />
                          )}
                        </div>

                        <div className="ml-4">
                          <div className="text-sm font-medium text-black dark:text-white">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-400">
                      {product.model_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-400">
                      {product.category?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-400">
                      {product.brand?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black dark:text-gray-400">
                      $
                      {typeof product.price === "string"
                        ? parseFloat(product.price).toFixed(2)
                        : product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black dark:text-gray-400">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${product.stock_status === "Active"
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
                        {/* Trigger button */}
                        <button
                          type="button"
                          className="inline-flex cursor-pointer justify-center w-8 h-8 rounded-full items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                          onClick={(e) => toggleDropdown(product.id, e)}
                        >
                          <MdMoreVert className="w-5 h-5" />
                        </button>

                        {dropdownOpen === product.id && dropdownPosition && (
                          <div
                            className="fixed z-20 w-40 rounded-md shadow-lg bg-white dark:bg-gray-700 
               border border-gray-200 dark:border-gray-600"
                            style={{
                              top: dropdownPosition.top,
                              left: dropdownPosition.left,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <button
                                className="flex items-center cursor-pointer px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                role="menuitem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/${currentLocale}/dashboard/products/view/product/${product.slug}`
                                  );
                                  setDropdownOpen(null);
                                }}
                              >
                                <MdVisibility className="mr-2" />
                                {t.createProduct.viewDetail}
                              </button>
                              <button
                                className="flex items-center cursor-pointer px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                role="menuitem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProduct(product);
                                  setDropdownOpen(null);
                                }}
                              >
                                <RiEditLine className="mr-2" />
                                {t.createProduct.edit}
                              </button>
                              <button
                                className="flex items-center cursor-pointer px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                role="menuitem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateQrCode(product);
                                  setDropdownOpen(null);
                                }}
                              >
                                <IoQrCodeOutline className="mr-2" />
                                QRCode
                              </button>
                              <button
                                className="flex items-center cursor-pointer px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                role="menuitem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(product.id, product.slug, product.name);
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

      {/* Add New Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-2">
              <CreateCategoryPage
                params={params}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add New Brand Modal */}
      {showAddBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-2">
              <CreateBrandPage
                params={params}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-2">
              <CreateProductPage
                params={params}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-2">
              <EditProductPage
                params={{
                  locale: currentLocale as "en" | "kh",
                  slug: selectedProduct.slug,
                }}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrCodeModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[95vh] overflow-y-auto">
            <QrCodeDisplay
              params={params}
              productSlug={selectedProduct.slug}
              productName={selectedProduct.name}
              onClose={handleModalClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}
