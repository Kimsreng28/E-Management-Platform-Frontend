"use client";

import { API_BASE_URL } from "@/lib/config";
import { Product } from "@/types/product";
import { useTranslations } from "@/utils/useTranslations";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiChevronRight, FiHome } from "react-icons/fi";

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

interface CategoryDetail extends Category {
    children?: Category[];
}

export default function CategoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = params.locale as "en" | "kh";
    const slug = params.slug as string;

    const [category, setCategory] = useState<CategoryDetail | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    const [isNavigating, setIsNavigating] = useState(false);

    const t = useTranslations(locale);

    useEffect(() => {
        fetchCategoryDetails();
        fetchCategoryProducts();
    }, [slug, sortBy, sortOrder]);

    const fetchCategoryDetails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/categories/${slug}`);
            const data = await response.json();

            if (data.success) {
                setCategory(data.data);
            } else {
                setError("Failed to fetch category details");
            }
        } catch (err) {
            setError("An error occurred while fetching category details");
            console.error(err);
        }
    };

    const fetchCategoryProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/api/categories/${slug}/products?sortBy=${sortBy}&sortOrder=${sortOrder}`
            );
            const data = await response.json();

            if (data.success) {
                setProducts(data.data);
            } else {
                setError("Failed to fetch products");
            }
        } catch (err) {
            setError("An error occurred while fetching products");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSortChange = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            </div>
        );
    }

    if (!category && !loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Category not found</h1>
                    <p className="mt-4">The category you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <nav className="flex mb-6" aria-label="Breadcrumb">

                {/* Loading Overlay */}
                {isNavigating && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700 mx-auto mb-4"></div>
                        </div>
                    </div>
                )}

                <ol className="inline-flex items-center space-x-1 md:space-x-3">
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

                    {/* Category */}
                    <li>
                        <div className="flex items-center">
                            <FiChevronRight className="mx-1 text-gray-400" />
                            <button
                                onClick={() => {
                                    setIsNavigating(true);
                                    router.push(`/${locale}/customer/categories`);
                                }}
                                className="text-gray-700 cursor-pointer hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                            >
                                {t.categoryPage.categories}
                            </button>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <FiChevronRight className="mx-1 text-gray-400" />
                            <span className="text-gray-500 dark:text-gray-400 truncate max-w-xs md:max-w-md">
                                {category?.name}
                            </span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Category Header */}
            {category && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center">
                        {category.image && (
                            <div className="relative w-32 h-32 md:mr-6 mb-4 md:mb-0">
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-contain rounded-lg"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
                            {category.parent_name && (
                                <p className="text-gray-600 dark:text-gray-300 mb-2">
                                    Parent Category: {category.parent_name}
                                </p>
                            )}
                            <div
                                className="text-gray-700 dark:text-gray-300 mb-4"
                                dangerouslySetInnerHTML={{ __html: category.description }}
                            />
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full text-sm">
                                    {products.length} {t.categoryPage.products}
                                </div>
                                {category.children_count && category.children_count > 0 && (
                                    <div className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full text-sm">
                                        {category.children_count} Subcategories
                                    </div>
                                )}
                                {category.is_featured && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900 px-3 py-1 rounded-full text-sm">
                                        {t.categoryPage.featured}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subcategories */}
            {category?.children && category.children.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Subcategories</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.children.map((subcategory) => (
                            <Link
                                key={subcategory.id}
                                href={`/${locale}/customer/categories/${subcategory.slug}`}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                            >
                                <h3 className="font-semibold text-lg mb-2">{subcategory.name}</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                                    {subcategory.description.replace(/<[^>]+>/g, "")}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Products Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t.categoryPage.products}</h2>

                    {/* Sort Options */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{t.categoryPage.sortBy}:</span>
                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split("-");
                                setSortBy(field);
                                setSortOrder(order);
                            }}
                            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="price-asc">Price (Low to High)</option>
                            <option value="price-desc">Price (High to Low)</option>
                            <option value="created_at-desc">Newest First</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            There are no products in this category yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <Link href={`/${locale}/customer/products/${product.slug}`}>
                                    <div className="relative h-48 w-full">
                                        {product.images && product.images.length > 0 ? (
                                            <Image
                                                src={`${API_BASE_URL}/${product.images[0].path}`}
                                                alt={product.name}
                                                fill
                                                className="object-contain p-4"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
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
                                </Link>

                                <div className="p-4">
                                    <Link href={`/${locale}/customer/products/${product.slug}`}>
                                        <h3 className="font-semibold text-lg mb-1 hover:text-blue-600 dark:hover:text-blue-400">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                                        {product.description.replace(/<[^>]+>/g, "")}
                                    </p>

                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            ${product.price}
                                        </span>

                                        {product.stock > 0 ? (
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${product.stock <= product.low_stock_threshold
                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    }`}
                                            >
                                                {product.stock <= product.low_stock_threshold
                                                    ? t.createProduct.lowStock
                                                    : t.createProduct.inStock}
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                {t.createProduct.outOfStock}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}