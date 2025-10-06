"use client";

import CategoryList from "@/components/ui/customer/CategoryList";
import Features from "@/components/ui/customer/Features";
import ProductCard from "@/components/ui/customer/ProductCard";
import ShowCase from "@/components/ui/customer/ShowCase";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AiOutlineFileProtect } from "react-icons/ai";
import { BiSupport } from "react-icons/bi";
import { IoIosArrowForward } from "react-icons/io";
import { MdDeliveryDining } from "react-icons/md";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  products_count?: number;
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
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  low_stock_threshold: number;
  stock_status: string;
  discount?: number;
}

interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string | null;
  is_primary: boolean;
}

export default function CustomerHomePage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const unwrappedParams = use(params);
  const language = unwrappedParams.locale || "en";
  const t = useTranslations(language);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [highlyRatedProducts, setHighlyRatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        const data = await res.json();
        if (data.success) {
          setCategories(data.data.slice(0, 6));
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

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/products?is_featured=1`);

        const resNew = await fetch(`${API_BASE_URL}/api/products?is_new=1`);

        const data = await res.json();

        const dataNew = await resNew.json();

        if (dataNew.data) {
          setNewProducts(dataNew.data.slice(0, 5));
        }

        if (data.data) {
          setProducts(data.data.slice(0, 5));
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

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/popular?limit=5`);
        const data = await res.json();
        if (data) {
          setPopularProducts(data);
        }
      } catch (err) {
        console.error('Error fetching popular products:', err);
      }
    };

    fetchPopularProducts();
  }, []);

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/recommended?limit=5`);
        const data = await res.json();
        if (data) {
          setRecommendedProducts(data);
        }
      } catch (err) {
        console.error('Error fetching recommended products:', err);
      }
    };

    fetchRecommendedProducts();
  }, []);

  useEffect(() => {
    const fetchHighlyRatedProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/highly-rated?limit=5`);
        const data = await res.json();
        if (data) {
          setHighlyRatedProducts(data);
        }
      } catch (err) {
        console.error('Error fetching highly rated products:', err);
      }
    };

    fetchHighlyRatedProducts();
  }, []);

  const featureItems = [
    {
      title: t.feature.qualityGuarantee,
      description: t.feature.authenticProducts,
      icon: <AiOutlineFileProtect className="h-8 w-8 text-primary" />,
    },
    {
      title: t.feature.fastDelivery,
      description: t.feature.delivery24h,
      icon: <MdDeliveryDining className="h-8 w-8 text-primary" />,
    },
    {
      title: t.feature.technicalSupport,
      description: t.feature.expertAssistance,
      icon: <BiSupport className="h-8 w-8 text-primary" />,
    },
  ];

  return (
    <main className="bg-gray-50 dark:bg-gray-900">
      <ShowCase language={language} />
      <Features features={featureItems} />

      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="w-full py-2 px-2 sm:px-6 lg:px-2 mt-6">
          <div className="px-4 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Categories
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Explore our comprehensive range of electrical equipment
              </p>
            </div>

            <Link
              href={`/${language}/customer/categories`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              View All Categories
              <IoIosArrowForward className="ml-2 text-xl" />
            </Link>
          </div>

          <CategoryList
            categories={categories}
            loading={loading}
            error={error}
          />
        </div>
      )}

      {/* Featured Products Section */}
      {products.length > 0 && (
        <div className="w-full py-2 px-2 sm:px-6 lg:px-2 mt-6">
          <div className="px-4 mb-4 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Feature
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Handpicked products from our premium collection
              </p>
            </div>

            <Link
              href={`/${language}/customer/products`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              View All Product
              <IoIosArrowForward className="ml-2 text-xl" />
            </Link>
          </div>

          {/* Products Card List */}
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                locale={language}
                product={product}
              />
            ))}
          </div>
        </div>
      )}

      {/* New Products Section */}
      {newProducts.length > 0 && (
        <div className="w-full py-2 px-2 sm:px-6 lg:px-2 mt-6">
          <div className="px-4 mb-4 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                New Products
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Latest additions to our collection
              </p>
            </div>

            <Link
              href={`/${language}/customer/products`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              View All Product
              <IoIosArrowForward className="ml-2 text-xl" />
            </Link>
          </div>

          {/* Products Card List */}
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {newProducts.map((product) => (
              <ProductCard
                key={product.id}
                locale={language}
                product={product}
              />
            ))}
          </div>
        </div>
      )}

      {/* Popular Products Section */}
      {popularProducts.length > 0 && (
        <div className="w-full py-2 px-2 sm:px-6 lg:px-2 mt-6">
          <div className="px-4 mb-4 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Popular Products
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Our best-selling items
              </p>
            </div>
            <Link
              href={`/${language}/customer/products`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              View All Products
              <IoIosArrowForward className="ml-2 text-xl" />
            </Link>
          </div>
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                locale={language}
                product={product}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Products Section */}
      {recommendedProducts.length > 0 && (
        <div className="w-full py-2 px-2 sm:px-6 lg:px-2 mt-6">
          <div className="px-4 mb-4 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Recommended For You
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Products you might like
              </p>
            </div>
            <Link
              href={`/${language}/customer/products`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              View All Products
              <IoIosArrowForward className="ml-2 text-xl" />
            </Link>
          </div>
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {recommendedProducts.map((product) => (
              <ProductCard
                key={product.id}
                locale={language}
                product={product}
              />
            ))}
          </div>
        </div>
      )}

      {/* Highly Rated Products Section */}
      {highlyRatedProducts.length > 0 && (
        <div className="w-full py-2 px-2 sm:px-6 lg:px-2 mt-6">
          <div className="px-4 mb-4 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Highly Rated
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Customer favorites with top ratings
              </p>
            </div>
            <Link
              href={`/${language}/customer/products`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              View All Products
              <IoIosArrowForward className="ml-2 text-xl" />
            </Link>
          </div>
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {highlyRatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                locale={language}
                product={product}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
