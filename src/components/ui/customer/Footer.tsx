"use client";

import { useTranslations } from "@/utils/useTranslations";
import Link from "next/link";
import { FaAddressCard } from "react-icons/fa";
import { IoMdCall, IoMdMail } from "react-icons/io";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

interface FooterProps {
  language: "en" | "kh";
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  parent_id: number | null;
  order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

export default function Footer({ language }: FooterProps) {
  const t = useTranslations(language);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories?perPage=4`);
        if (!response.ok) {
          console.error("Server returned", response.status);
          setCategories([]);
          return;
        }
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch categories for footer:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);


  return (
    <footer className="bg-black text-white dark:bg-gray-100 dark:text-gray-900 py-8 sm:py-10 lg:py-12 mt-12 sm:mt-16 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid layout - responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          {/* Logo & Description */}
          <div className="text-center sm:text-left">
            <Link
              href={`/${language}/customer`}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2 font-bold text-xl"
            >
              <img
                src="/images/logoPlus.png"
                alt="EMP Logo"
                className="h-14 w-14 rounded-2xl mx-auto sm:mx-0"
              />
              <span className="mt-2 sm:mt-0">EMP</span>
            </Link>
            <p className="mt-3 text-sm text-white dark:text-black max-w-xs mx-auto sm:mx-0">
              {t.footer.description}
            </p>
          </div>

          {/* Products Category */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-3 sm:mb-4">{t.footer.products}</h3>
            {loading ? (
              <div className="space-y-2 text-sm">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-700 dark:bg-gray-300 rounded animate-pulse mx-auto sm:mx-0"
                    style={{ width: i % 2 === 0 ? "80%" : "70%" }}
                  ></div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/${language}/customer/categories/${category.slug}`}
                      className="hover:text-primary transition-colors block py-1"
                    >
                      {category.name}
                      <span className="text-xs text-gray-400 dark:text-gray-600 ml-1">
                        ({category.products_count !== undefined ? category.products_count : 0})
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600">
                No categories available
              </p>
            )}
          </div>

          {/* Support */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-3 sm:mb-4">{t.footer.support}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${language}/customer/contact`}
                  className="hover:text-primary transition-colors block py-1"
                >
                  {t.footer.contactUs}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${language}/customer/warranty`}
                  className="hover:text-primary transition-colors block py-1"
                >
                  {t.footer.warranty}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${language}/customer/shipping`}
                  className="hover:text-primary transition-colors block py-1"
                >
                  {t.footer.shipping}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${language}/customer/returns`}
                  className="hover:text-primary transition-colors block py-1"
                >
                  {t.footer.returns}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-3 sm:mb-4">{t.footer.contact}</h3>
            <div className="space-y-2 text-sm text-white dark:text-black">
              <p className="flex items-center justify-center sm:justify-start gap-2">
                <IoMdCall className="flex-shrink-0" /> +855 12 345 678
              </p>
              <p className="flex items-center justify-center sm:justify-start gap-2">
                <IoMdMail className="flex-shrink-0" />
                info@emp-platform.com
              </p>
              <p className="flex items-center justify-center sm:justify-start gap-2">
                <FaAddressCard className="flex-shrink-0" />
                Phnom Penh, Cambodia
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-gray-300 dark:border-gray-700 mt-8 pt-6 text-center text-xs sm:text-sm text-white dark:text-black">
          <p>&copy; 2025 EMP Platform. {t.footer.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  );
}