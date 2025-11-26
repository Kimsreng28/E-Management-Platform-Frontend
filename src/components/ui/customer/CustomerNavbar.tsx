"use client";

import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { navLinks } from "@/data/navLinks";
import { API_BASE_URL } from "@/lib/config";
import { Category, Product } from "@/types/product";
import { useTranslations } from "@/utils/useTranslations";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LanguageDropdown } from "./LanguageDropdown";
import { SearchResults } from "./SearchResults";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { MessageSquare } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import Swal from "sweetalert2";

export function CustomerNavbar({
  language,
  onLanguageChange,
}: {
  language: "en" | "kh";
  onLanguageChange: (lang: "en" | "kh") => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigationStartTime = useRef<number>(0);

  const { wishlist } = useWishlist();
  const { cart } = useCart();

  const { conversations } = useChat();

  const t = useTranslations(language);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Handle route changes
  useEffect(() => {
    if (!hydrated) return;

    navigationStartTime.current = Date.now();
    setIsNavigating(true);

    const elapsed = Date.now() - navigationStartTime.current;
    const remainingTime = Math.max(500 - elapsed, 0);

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [pathname, hydrated]);

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories?perPage=50`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoriesDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search.trim().length > 0) {
        performSearch(search);
      } else {
        setSearchResults([]);
        setShowResults(search.trim().length > 0);
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  async function performSearch(query: string) {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search-products?q=${encodeURIComponent(query)}&type=products`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Search API response:', data);
        setSearchResults(data.data?.products || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSearchBlur() {
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  }

  function toggleDarkMode() {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("darkMode", String(newMode));
      document.documentElement.classList.toggle("dark", newMode);
      return newMode;
    });
  }

  function toggleLanguage() {
    const nextLang = language === "en" ? "kh" : "en";
    onLanguageChange(nextLang);
  }

  const getLocalizedHref = (href: string) => {
    const cleanHref = href.replace(/^\/(en|kh)/, "");
    return `/${language}${cleanHref.startsWith("/") ? cleanHref : `/${cleanHref}`
      }`;
  };

  const handleMouseEnterDropdown = () => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setShowCategoriesDropdown(true);
  };

  const handleMouseLeaveDropdown = () => {
    const timeout = setTimeout(() => {
      setShowCategoriesDropdown(false);
    }, 200);
    setDropdownTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeout) {
        clearTimeout(dropdownTimeout);
      }
    };
  }, [dropdownTimeout]);

  const handleLinkClick = (href?: string) => {
    if (href && href === pathname) return;

    setIsNavigating(true);
    navigationStartTime.current = Date.now();
  };

  const handleProtectedLinkClick = (e: React.MouseEvent, href: string) => {
    // Let the token from the local storage
    const token = localStorage.getItem("token");

    if (!token) {
      e.preventDefault();
      e.stopPropagation();

      Swal.fire({
        icon: "info",
        title: language === "en" ? "Please login first" : "សូមចូលគណនីជាមុន",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      }).then(() => {
        router.push(`/${language}/auth/login`);
      });
      return true;
    }

    handleLinkClick(href);

    return false;
  }

  const totalUnreadCount = conversations.reduce((total, conv) => {
    return total + (conv.unread_count || 0);
  }, 0);

  const isProductDetailPage = pathname.includes('/customer/products/') && pathname.split('/').length > 4;

  return (
    <>
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap relative">
        {/* Logo & Hamburger */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link
            prefetch={true}
            href={getLocalizedHref("/customer")}
            className="flex items-center space-x-2 font-bold text-xl text-gray-900 dark:text-white transition-colors duration-200"
            onClick={() => handleLinkClick(getLocalizedHref("/customer"))}
          >
            <img src="/images/logo.png" alt="EMP Logo" className="h-10 w-10 md:h-12 md:w-12" />
            <span className="hidden sm:block">EMP</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div
          className={`${menuOpen ? "block" : "hidden"} w-full md:flex md:items-center md:w-auto mt-4 md:mt-0`}
        >
          <div className="flex flex-col md:flex-row md:space-x-6">
            {navLinks.map(({ href, label }) => {
              if (label === "Categories") {
                const localizedHref = getLocalizedHref("/customer/categories");
                const isActive = hydrated && pathname.startsWith(localizedHref);

                return (
                  <div
                    key="categories-dropdown"
                    className="relative group"
                    ref={dropdownRef}
                    onMouseEnter={handleMouseEnterDropdown}
                    onMouseLeave={handleMouseLeaveDropdown}
                  >
                    <Link
                      href={localizedHref}
                      className={`py-3 md:py-2 font-semibold hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors duration-200 ${isActive
                        ? "text-blue-600 underline dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                        }`}
                      onClick={() => handleLinkClick(localizedHref)}
                    >
                      {t[label] ?? label}
                      <svg
                        className={`w-4 h-4 ml-1 transition-transform duration-200 ${showCategoriesDropdown ? "rotate-180" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Link>

                    {showCategoriesDropdown && categories.length > 0 && (
                      <div
                        className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in fade-in-80 slide-in-from-top-2"
                        onMouseEnter={handleMouseEnterDropdown}
                        onMouseLeave={handleMouseLeaveDropdown}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categories.slice(0, 10).map((category) => (
                            <Link
                              key={category.id}
                              href={`/${language}/customer/categories/${category.slug}`}
                              className="group/category flex items-center p-3 rounded-lg hover:shadow-md dark:hover:shadow-gray-700/50 transition-shadow duration-200"
                              onClick={() => {
                                setShowCategoriesDropdown(false);
                                setMenuOpen(false);
                                handleLinkClick();
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white group-hover/category:text-blue-600 dark:group-hover/category:text-blue-400 transition-colors duration-200 truncate">
                                  {category.name}
                                </p>
                                {category.products_count && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {category.products_count} {t.categoryPage.products}
                                  </p>
                                )}
                              </div>
                              <svg
                                className="w-4 h-4 text-gray-400 group-hover/category:text-blue-600 dark:group-hover/category:text-blue-400 ml-2 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>

                          ))}
                        </div>

                        {categories.length > 10 && (
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Link
                              href={localizedHref}
                              className="flex items-center justify-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                              onClick={() => {
                                setShowCategoriesDropdown(false);
                                handleLinkClick();
                              }}
                            >
                              View all categories
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              const localizedHref = getLocalizedHref(href);
              const isActive = hydrated && pathname === localizedHref || (label === "Products" && isProductDetailPage);

              return (
                <Link
                  key={href}
                  prefetch={true}
                  href={localizedHref}
                  className={`py-3 md:py-2 font-semibold transition-colors duration-200 ${isActive
                    ? "text-blue-600 dark:text-blue-400 underline"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                  onClick={() => handleLinkClick(localizedHref)}
                >
                  {t[label] ?? label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search & Controls */}
        <div className="flex-1 md:max-w-lg mx-0 md:mx-8 relative mt-4 md:mt-0 hidden md:block">
          <svg
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314" />
          </svg>

          <input
            type="search"
            placeholder={language === "en" ? "Search products..." : "ស្វែងរកផលិតផល..."}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              if (search.length > 0 || searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            onBlur={handleSearchBlur}
          />

          {showResults && (
            <SearchResults
              results={searchResults}
              language={language}
              query={search}
              loading={searchLoading}
              onClose={() => setShowResults(false)}
              onNavigate={() => {
                setShowResults(false);
                setSearch("");
                handleLinkClick();
              }}
            />
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <LanguageDropdown language={language} onLanguageChange={toggleLanguage} />

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m8.485-8.485h1M3.515 12h1m12.02 4.95l.707.707M6.343 6.343l.707.707M16.95 7.05l.707-.707M7.05 16.95l.707-.707M12 7a5 5 0 100 10a5 5 0 000-10z" />
              </svg>
            )}
          </button>

          {/* Wishlist */}
          <Link
            href={`/${language}/customer/wishlist`}
            className="relative p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-label="Wishlist"
            prefetch={true}
            onClick={(e) => {
              if (handleProtectedLinkClick(e, `/${language}/customer/wishlist`)) {
                return;
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m8.962 18.91l.464-.588zM12 5.5l-.54.52a.75.75 0 0 0 1.08 0zm3.038 13.41l.465.59zm-8.037-2.49a.75.75 0 0 0-.954 1.16zm-4.659-3.009a.75.75 0 1 0 1.316-.72zm.408-4.274c0-2.15 1.215-3.954 2.874-4.713c1.612-.737 3.778-.541 5.836 1.597l1.08-1.04C10.1 2.444 7.264 2.025 5 3.06C2.786 4.073 1.25 6.425 1.25 9.137zM8.497 19.5c.513.404 1.063.834 1.62 1.16s1.193.59 1.883.59v-1.5c-.31 0-.674-.12-1.126-.385c-.453-.264-.922-.628-1.448-1.043zm7.006 0c1.426-1.125 3.25-2.413 4.68-4.024c1.457-1.64 2.567-3.673 2.567-6.339h-1.5c0 2.198-.9 3.891-2.188 5.343c-1.315 1.48-2.972 2.647-4.488 3.842zM22.75 9.137c0-2.712-1.535-5.064-3.75-6.077c-2.264-1.035-5.098-.616-7.54 1.92l1.08 1.04c2.058-2.137 4.224-2.333 5.836-1.596c1.659.759 2.874 2.562 2.874 4.713zm-8.176 9.185c-.526.415-.995.779-1.448 1.043s-.816.385-1.126.385v1.5c.69 0 1.326-.265 1.883-.59c.558-.326 1.107-.756 1.62-1.16zm-5.148 0c-.796-.627-1.605-1.226-2.425-1.901l-.954 1.158c.83.683 1.708 1.335 2.45 1.92zm-5.768-5.63a7.25 7.25 0 0 1-.908-3.555h-1.5c0 1.638.42 3.046 1.092 4.275z" /></svg>
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            href={`/${language}/customer/cart`}
            className="relative p-2.5 rounded-lg text-gray-600 hover:text-blue-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-label="Shopping cart"
            prefetch={true}
            onClick={(e) => {
              if (handleProtectedLinkClick(e, `/${language}/customer/cart`)) {
                return;
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="m19.5 9.5l-.71-2.605c-.274-1.005-.411-1.507-.692-1.886A2.5 2.5 0 0 0 17 4.172C16.56 4 16.04 4 15 4M4.5 9.5l.71-2.605c.274-1.005.411-1.507.692-1.886A2.5 2.5 0 0 1 7 4.172C7.44 4 7.96 4 9 4" /><path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M8 13v4m8-4v4m-4-4v4" /><path stroke-linecap="round" d="M3.864 16.455c.546 2.183.819 3.274 1.632 3.91C6.31 21 7.435 21 9.685 21h4.63c2.25 0 3.375 0 4.19-.635c.813-.636 1.086-1.727 1.631-3.91c.858-3.432 1.287-5.147.387-6.301C19.622 9 17.853 9 14.316 9H9.685c-3.538 0-5.306 0-6.207 1.154c-.529.677-.6 1.548-.394 2.846" /></g></svg>
            {cart && cart.items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {cart.items.length}
              </span>
            )}
          </Link>

          {/* Chat */}
          <Link
            href={`/${language}/customer/chat`}
            className="relative p-2.5 rounded-lg text-gray-600 hover:text-green-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            onClick={(e) => {
              if (handleProtectedLinkClick(e, `/${language}/customer/chat`)) {
                return;
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M8 9h8m-8 3.5h5.5" /><path fill="currentColor" d="m13.087 21.388l.645.382zm.542-.916l-.646-.382zm-3.258 0l-.645.382zm.542.916l.646-.382zM1.25 10.5a.75.75 0 0 0 1.5 0zm1.824 5.126a.75.75 0 0 0-1.386.574zm4.716 3.365l-.013.75zm-2.703-.372l-.287.693zm16.532-2.706l.693.287zm-5.409 3.078l-.012-.75zm2.703-.372l.287.693zm.7-15.882l-.392.64zm1.65 1.65l.64-.391zM4.388 2.738l-.392-.64zm-1.651 1.65l-.64-.391zM9.403 19.21l.377-.649zm4.33 2.56l.541-.916l-1.29-.764l-.543.916zm-4.007-.916l.542.916l1.29-.764l-.541-.916zm2.715.152a.52.52 0 0 1-.882 0l-1.291.764c.773 1.307 2.69 1.307 3.464 0zM10.5 2.75h3v-1.5h-3zm10.75 7.75v1h1.5v-1zM7.803 18.242c-1.256-.022-1.914-.102-2.43-.316L4.8 19.313c.805.334 1.721.408 2.977.43zM1.688 16.2A5.75 5.75 0 0 0 4.8 19.312l.574-1.386a4.25 4.25 0 0 1-2.3-2.3zm19.562-4.7c0 1.175 0 2.019-.046 2.685c-.045.659-.131 1.089-.277 1.441l1.385.574c.235-.566.338-1.178.389-1.913c.05-.729.049-1.632.049-2.787zm-5.027 8.241c1.256-.021 2.172-.095 2.977-.429l-.574-1.386c-.515.214-1.173.294-2.428.316zm4.704-4.115a4.25 4.25 0 0 1-2.3 2.3l.573 1.386a5.75 5.75 0 0 0 3.112-3.112zM13.5 2.75c1.651 0 2.837 0 3.762.089c.914.087 1.495.253 1.959.537l.783-1.279c-.739-.452-1.577-.654-2.6-.752c-1.012-.096-2.282-.095-3.904-.095zm9.25 7.75c0-1.622 0-2.891-.096-3.904c-.097-1.023-.299-1.862-.751-2.6l-1.280.783c.285.464.451 1.045.538 1.96c.088.924.089 2.11.089 3.761zm-3.53-7.124a4.25 4.25 0 0 1 1.404 1.403l1.279-.783a5.75 5.75 0 0 0-1.899-1.899zM10.5 1.25c-1.622 0-2.891 0-3.904.095c-1.023.098-1.862.3-2.6.752l.783 1.28c.464-.285 1.045-.451 1.96-.538c.924-.088 2.11-.089 3.761-.089zM2.75 10.5c0-1.651 0-2.837.089-3.762c.087-.914.253-1.495.537-1.959l-1.279-.783c-.452.738-.654 1.577-.752 2.6C1.25 7.61 1.25 8.878 1.25 10.5zm1.246-8.403a5.75 5.75 0 0 0-1.899 1.899l1.28.783a4.25 4.25 0 0 1 1.402-1.403zm7.02 17.993c-.202-.343-.38-.646-.554-.884a2.2 2.2 0 0 0-.682-.645l-.754 1.297c.047.028.112.078.224.232c.121.166.258.396.476.764zm-3.24-.349c.44.008.718.014.93.037c.198.022.275.054.32.08l.754-1.297a2.2 2.2 0 0 0-.909-.274c-.298-.033-.657-.038-1.069-.045zm6.498 1.113c.218-.367.355-.598.476-.764c.112-.154.177-.204.224-.232l-.754-1.297c-.29.17-.5.395-.682.645c-.173.238-.352.54-.555.884zm1.924-2.612c-.412.007-.771.012-1.069.045c-.311.035-.616.104-.909.274l.754 1.297c.045-.026.122-.058.32-.08c.212-.023.49-.03.93-.037z" /></g></svg>
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </span>
            )}
          </Link>

          <UserProfileDropdown />
        </div>
      </nav>

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700 mx-auto mb-4"></div>
          </div>
        </div>
      )}
    </>
  );
}