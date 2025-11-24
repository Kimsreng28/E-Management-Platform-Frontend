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
import { FaRegStar, FaStar, FaUsers } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { MdDeliveryDining, MdOutlineReviews } from "react-icons/md";

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
  average_rating: number;
  total_ratings: number;
  reviews?: Review[];
}

interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  product?: {
    id: number;
    name: string;
    slug: string;
  };
}

interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string | null;
  is_primary: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface PlatformStats {
  total_users: number;
  total_products: number;
  total_reviews: number;
  total_orders: number;
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

  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);

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

  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews/recent?limit=6&include=product`);
        const data = await res.json();
        if (data.success) {
          setRecentReviews(data.data);
        }
      } catch (err) {
        console.error('Error fetching recent reviews:', err);
      }
    };

    fetchRecentReviews();
  }, []);

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/stats/platform`);
        const data = await res.json();
        if (data.success) {
          setPlatformStats(data.data);
        }
      } catch (err) {
        console.error('Error fetching platform stats:', err);
      }
    };

    fetchPlatformStats();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews/recent?limit=6`);
        const data = await res.json();
        if (data.success) {
          const fetchedUsers = data.data.map((review: Review) => review.user);
          setUsers(fetchedUsers);
        } else {
          // fallback mock users
          setUsers([
            { id: 1, name: "Kim", email: "kim@example.com", avatar: "" },
          ]);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ?
            <FaStar key={star} className="text-yellow-400" /> :
            <FaRegStar key={star} className="text-gray-300" />
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

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
                {t.homePage.categories}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.homePage.exploreOurComprehensive}
              </p>
            </div>

            <Link
              href={`/${language}/customer/categories`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              {t.homePage.viewAllCategories}
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
                {t.homePage.feature}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.homePage.handpickedProducts}
              </p>
            </div>

            <Link
              href={`/${language}/customer/products`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              {t.homePage.viewAllProducts}
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
                showRating={true}
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
                {t.homePage.newProducts}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.homePage.latestAdditions}
              </p>
            </div>

            <Link
              href={`/${language}/customer/products`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              {t.homePage.viewAllProducts}
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
                {t.homePage.popularProducts}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.homePage.ourBestSelling}
              </p>
            </div>
            <Link
              href={`/${language}/customer/products`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              {t.homePage.viewAllProducts}
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
                {t.homePage.recommendedForYou}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.homePage.productsYouMightLike}
              </p>
            </div>
            <Link
              href={`/${language}/customer/products`}
              className="flex items-center bg-gradient-to-r from-black to-gray-800 dark:from-gray-900 dark:to-gray-700 hover:from-gray-900 hover:to-gray-700 dark:hover:from-gray-800 dark:hover:to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-black/25 dark:shadow-gray-900/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 dark:hover:shadow-gray-800/60"
            >
              {t.homePage.viewAllProducts}
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
              {t.homePage.viewAllProducts}
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

      {/* Platform Statistics Section */}
      {platformStats && (
        <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">
              {t.homePage.ourCommunity}
            </h2>

            {/* User Avatars Row */}
            {users.length > 0 && (
              <div className="flex justify-center mb-8">
                <div className="flex -space-x-3">
                  {users.slice(0, 6).map((user, index) => (
                    <div
                      key={`${user.id ?? "no-id"}-${index}`}
                      className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white font-bold text-sm shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden"
                    >
                      {user.avatar ? (
                        <img
                          src={`${API_BASE_URL}/${user.avatar}`}
                          alt={user.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span>{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  ))}

                  {platformStats?.total_users && platformStats.total_users > 6 && (
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm shadow-lg">
                      +{platformStats.total_users - 6}
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                <FaUsers className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {platformStats.total_users.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t.homePage.happyCustomers}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg text-center border border-green-200 dark:border-green-800">
                <AiOutlineFileProtect className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {platformStats.total_products.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t.homePage.qualityProducts}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
                <MdOutlineReviews className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {platformStats.total_reviews.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t.homePage.customerReviews}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg text-center border border-purple-200 dark:border-purple-800">
                <MdDeliveryDining className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {platformStats.total_orders.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t.homePage.successfulOrders}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      {recentReviews.length > 0 && (
        <div className="w-full py-8 px-2 sm:px-6 lg:px-2 mt-6 bg-white dark:bg-gray-800">
          <div className="px-4 mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t.homePage.whatOurCustomersSay}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.homePage.realReviews}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {review.user.name}
                      </div>
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  {/* Product Name */}
                  {review.product && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Review for:
                      </span>
                      <div className="font-medium text-sm text-gray-800 dark:text-white mt-1">
                        {review.product.name}
                      </div>
                    </div>
                  )}

                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    "{review.comment}"
                  </p>
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
