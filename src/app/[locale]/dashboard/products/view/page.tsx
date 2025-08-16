"use client";

import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { renderToString } from "react-dom/server";
import { GrStatusGood } from "react-icons/gr";
import {
  IoIosArrowBack,
  IoIosArrowDown,
  IoIosArrowUp,
  IoIosSearch,
} from "react-icons/io";
import {
  MdAdd,
  MdOutlineCancel,
  MdOutlineDelete,
  MdOutlineEdit,
} from "react-icons/md";
import Swal from "sweetalert2";

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

export default function ViewCategoriesPage({
  params,
}: {
  params: { locale: "en" | "kh" };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split("/")[1] || "en";
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "order", direction: "asc" });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });
  const [isMobile, setIsMobile] = useState(false);

  const language = params.locale || "en";
  const t = useTranslations(language);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        perPage: pagination.perPage.toString(),
        search: searchTerm,
        sortField: sortConfig.key,
        sortDirection: sortConfig.direction,
      });

      const res = await fetch(`${API_BASE_URL}/api/categories?${params}`);
      const data = await res.json();

      if (data.success) {
        setCategories(data.data);
        setPagination({
          currentPage: data.pagination.currentPage,
          perPage: data.pagination.perPage,
          total: data.pagination.total,
          lastPage: data.pagination.lastPage,
        });
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [searchTerm, sortConfig, pagination.currentPage, pagination.perPage]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePerPageChange = (perPage: number) => {
    setPagination((prev) => ({ ...prev, perPage, currentPage: 1 }));
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
            {expanded ? t.viewCategory.showLess : t.viewCategory.showMore}
          </button>
        )}
      </div>
    );
  };

  const handleDelete = async (slug: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `
            <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
            ${renderToString(<GrStatusGood />)} 
            <span>Yes, delete it!</span>
            </div>
        `,
      cancelButtonText: `
            <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
            ${renderToString(<MdOutlineCancel />)} 
            <span>Cancel</span>
            </div>
        `,
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/categories/${slug}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!res.ok) throw new Error("Failed to delete category");
        fetchCategories();

        Swal.fire({
          position: isMobile ? "center" : "top-end",
          icon: "success",
          title: "Category deleted successfully!",
          showConfirmButton: false,
          timer: 2000,
          toast: !isMobile,
        });
      } catch (err) {
        console.error(err);
        Swal.fire({
          position: isMobile ? "center" : "top-end",
          icon: "error",
          title: "Failed to delete category",
          showConfirmButton: false,
          timer: 2000,
          toast: !isMobile,
        });
      }
    }
  };

  const renderSortIcon = (key: string) => {
    return (
      <span className="inline-flex flex-col ml-1">
        <IoIosArrowUp
          className={`w-3 h-3 ${
            sortConfig.key === key && sortConfig.direction === "asc"
              ? "text-gray-700 dark:text-gray-200"
              : "text-gray-300 dark:text-gray-600"
          }`}
        />
        <IoIosArrowDown
          className={`w-3 h-3 ${
            sortConfig.key === key && sortConfig.direction === "desc"
              ? "text-gray-700 dark:text-gray-200"
              : "text-gray-300 dark:text-gray-600"
          }`}
        />
      </span>
    );
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="flex space-x-2">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6 px-2 sm:px-4 lg:px-6 py-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <button
          onClick={() =>
            router.push(`/${currentLocale}/dashboard/products/new/category`)
          }
          className="bg-gray-100 border border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow p-2 transition flex-shrink-0"
        >
          <IoIosArrowBack className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold dark:text-white truncate">
            {t.viewCategory.categories}
          </h1>
          <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-xs sm:text-sm md:text-base truncate">
            {t.viewCategory.manageCategories}
          </p>
        </div>

        <div className="relative w-full sm:w-48 md:w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <IoIosSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder={t.viewCategory.search}
            className="w-full text-xs sm:text-sm md:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg pl-8 sm:pl-10 py-1.5 sm:py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={() =>
              router.push(`/${currentLocale}/dashboard/products/new/category`)
            }
            className="flex items-center justify-center shadow-md border border-gray-300 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all duration-200 rounded-lg py-1.5 px-2 sm:py-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base w-full sm:w-auto"
          >
            <MdAdd className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">{t.productDashboard.addCategory}</span>
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {isMobile ? (
            <div className="space-y-2 p-2">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 animate-pulse"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="flex gap-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : categories.length === 0 ? (
                <div className="text-center p-4">
                  {searchTerm
                    ? "No matching categories found"
                    : "No categories found"}
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-start space-x-3">
                      {category.image && (
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={category.image}
                            alt={category.name}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {category.name}
                          </h3>
                          <div className="flex space-x-1 ml-2">
                            <button
                              onClick={() =>
                                router.push(
                                  `/${currentLocale}/dashboard/products/${category.slug}/edit`
                                )
                              }
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-500"
                            >
                              <MdOutlineEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.slug)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-500"
                            >
                              <MdOutlineDelete className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <DescriptionCell content={category.description} />
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span className="text-gray-500 dark:text-gray-300">
                            Parent: {category.parent_name || "None"}
                          </span>
                          <span className="text-gray-500 dark:text-gray-300">
                            Order: {category.order}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              category.is_featured
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            {category.is_featured ? "Featured" : "Not Featured"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200">
                <tr>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm uppercase tracking-wider cursor-pointer w-2/5"
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>{t.createCategory.name}</span>
                      {renderSortIcon("name")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm uppercase tracking-wider cursor-pointer w-1/5"
                    onClick={() => requestSort("parent_name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>{t.createCategory.parentCategory}</span>
                      {renderSortIcon("parent_name")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm uppercase tracking-wider cursor-pointer w-[15%]"
                    onClick={() => requestSort("order")}
                  >
                    <div className="flex items-center gap-1">
                      <span>{t.createCategory.order}</span>
                      {renderSortIcon("order")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm uppercase tracking-wider cursor-pointer w-[15%]"
                    onClick={() => requestSort("is_featured")}
                  >
                    <div className="flex items-center gap-1">
                      <span>{t.createCategory.featured}</span>
                      {renderSortIcon("is_featured")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm uppercase tracking-wider w-[15%]"
                  >
                    {t.viewCategory.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 min-h-[200px]">
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      {searchTerm
                        ? "No matching categories found"
                        : "No categories found"}
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {category.image && (
                            <div className="flex-shrink-0 h-10 w-10 mr-3">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={category.image}
                                alt={category.name}
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm sm:text-md font-semibold text-gray-900 dark:text-white truncate">
                              {category.name}
                            </div>
                            <DescriptionCell content={category.description} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm sm:text-md text-gray-500 dark:text-gray-300 truncate">
                        {category.parent_name || "None"}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm sm:text-md text-gray-500 dark:text-gray-300">
                        {category.order}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-md ${
                            category.is_featured
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {category.is_featured ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/${currentLocale}/dashboard/products/${category.slug}/edit`
                              )
                            }
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-500"
                          >
                            <MdOutlineEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.slug)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-500"
                          >
                            <MdOutlineDelete className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-3 sm:px-5 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mr-2">
                {t.viewCategory.rowsPerPage}:
              </span>
              <select
                value={pagination.perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1 sm:px-2 py-1"
              >
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                {t.viewCategory.first}
              </button>
              <button
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.currentPage - 1))
                }
                disabled={pagination.currentPage === 1}
                className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                {t.viewCategory.previous}
              </button>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 px-1 sm:px-2">
                {t.viewCategory.page} {pagination.currentPage}{" "}
                {t.viewCategory.of} {pagination.lastPage}
              </span>
              <button
                onClick={() =>
                  handlePageChange(
                    Math.min(pagination.lastPage, pagination.currentPage + 1)
                  )
                }
                disabled={pagination.currentPage === pagination.lastPage}
                className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                {t.viewCategory.next}
              </button>
              <button
                onClick={() => handlePageChange(pagination.lastPage)}
                disabled={pagination.currentPage === pagination.lastPage}
                className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                {t.viewCategory.last}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
