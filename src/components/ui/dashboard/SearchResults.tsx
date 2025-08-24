"use client";

import { API_BASE_URL } from "@/lib/config";
import { SearchResult } from "@/types/search";
import { useTranslations } from "@/utils/useTranslations";
import { ExternalLink, Package, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SearchResultsProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "kh";
}

export default function SearchResults({
  query,
  isOpen,
  onClose,
  language,
}: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const t = useTranslations(language);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim() && isOpen) {
      performSearch(debouncedQuery);
    } else {
      setResults(null);
    }
  }, [debouncedQuery, isOpen]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/api/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getItemLink = (item: any) => {
    switch (item.type) {
      case "product":
        return `/${language}/dashboard/products/${item.id}`;
      case "order":
        return `/${language}/dashboard/orders/${item.id}`;
      case "customer":
        return `/${language}/dashboard/customers/${item.id}`;
      default:
        return "#";
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package size={16} className="text-blue-500" />;
      case "order":
        return <ShoppingCart size={16} className="text-green-500" />;
      case "customer":
        return <User size={16} className="text-purple-500" />;
      default:
        return <ExternalLink size={16} />;
    }
  };

  if (!isOpen || !query.trim()) return null;

  const totalResults =
    (results?.products?.length || 0) +
    (results?.orders?.length || 0) +
    (results?.customers?.length || 0);

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {language === "en" ? "Search Results" : "លទ្ធផលស្វែងរក"}
          </span>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          {language === "en" ? "Searching..." : "កំពុងស្វែងរក..."}
        </div>
      ) : totalResults === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          {language === "en" ? "No results found" : "មិនមានលទ្ធផលត្រូវបានរកឃើញ"}
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {/* Products */}
          {results?.products && results.products.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-750 text-xs font-medium text-gray-500 dark:text-gray-400">
                {language === "en" ? "Products" : "ផលិតផល"}
              </div>
              {results.products.map((product) => (
                <Link
                  key={`product-${product.id}`}
                  href={getItemLink(product)}
                  onClick={onClose}
                  className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getItemIcon("product")}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SKU: {product.sku} • ${product.price} • Stock:{" "}
                        {product.stock}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Orders */}
          {results?.orders && results.orders.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-750 text-xs font-medium text-gray-500 dark:text-gray-400">
                {language === "en" ? "Orders" : "ការកម្មង់"}
              </div>
              {results.orders.map((order) => (
                <Link
                  key={`order-${order.id}`}
                  href={getItemLink(order)}
                  onClick={onClose}
                  className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getItemIcon("order")}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        #{order.order_number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.customer_name} • ${order.total} • {order.status}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Customers */}
          {results?.customers && results.customers.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-750 text-xs font-medium text-gray-500 dark:text-gray-400">
                {language === "en" ? "Customers" : "អតិថិជន"}
              </div>
              {results.customers.map((customer) => (
                <Link
                  key={`customer-${customer.id}`}
                  href={getItemLink(customer)}
                  onClick={onClose}
                  className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getItemIcon("customer")}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {customer.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {customer.email} • {customer.phone} •{" "}
                        {customer.orders_count} orders
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {totalResults > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          {language === "en"
            ? `Found ${totalResults} results`
            : `រកឃើញ ${totalResults} លទ្ធផល`}
        </div>
      )}
    </div>
  );
}
