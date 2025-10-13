"use client";

import { LanguageDropdown } from "@/components/ui/customer/LanguageDropdown";
import NotificationBell from "@/components/ui/dashboard/NotificationBell";
import SearchResults from "@/components/ui/dashboard/SearchResults";
import UserDropdown from "@/components/ui/dashboard/UserDropdown";
import { navItems } from "@/data/navItems";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/utils/useTranslations";
import { Inria_Sans, Kantumruy_Pro } from "next/font/google";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { AiFillSun, AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { MdNightlightRound } from "react-icons/md";

const inriaSans = Inria_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inria-sans",
});

const kantumruyPro = Kantumruy_Pro({
  subsets: ["latin", "khmer"],
  weight: ["400", "700"],
  variable: "--font-kantumruy-pro",
});

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const pathname = usePathname();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "kh">(locale as "en" | "kh");
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const t = useTranslations(language);

  // Prepare nav items with locale
  const localizedNavItems = navItems.map((item) => ({
    ...item,
    href: `/${language}${item.href}`,
  }));

  // Check if a route is active
  const getActiveNav = () => {
    // Sort by href length descending to prioritize deeper routes
    const sortedNav = [...localizedNavItems].sort(
      (a, b) => b.href.length - a.href.length
    );
    return sortedNav.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
  };

  const activeNav = getActiveNav();

  // Load dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle("dark", savedDarkMode);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("darkMode", String(newMode));
      document.documentElement.classList.toggle("dark", newMode);
      return newMode;
    });
  };

  const handleLanguageChange = (newLang: "en" | "kh") => {
    setLanguage(newLang);
    const newPath = pathname.replace(/^\/(en|kh)/, `/${newLang}`);
    setIsNavigating(true);
    router.push(newPath);
  };

  const handleNavClick = (href: string) => {
    if (pathname !== href) {
      setIsNavigating(true);
      router.push(href);
      setMobileMenuOpen(false); // Close mobile menu on navigation
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close search when route changes
  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setIsSearchOpen(true);
  };

  const handleSearchFocus = () => {
    if (search.trim()) {
      setIsSearchOpen(true);
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
  };

  // Reset navigation loading state when route changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  return (
    <div
      className={`flex min-h-screen ${inriaSans.variable} ${kantumruyPro.variable} font-combo antialiased`}
    >
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700 mx-auto mb-4"></div>
          </div>
        </div>
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed z-40 bottom-4 right-4 sm:hidden bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-3 rounded-full shadow-lg"
      >
        {mobileMenuOpen ? (
          <AiOutlineClose size={24} />
        ) : (
          <AiOutlineMenu size={24} />
        )}
      </button>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={cn(
          "fixed min-h-screen sm:relative z-40 w-64 bg-[#F9F9F9] text-black flex flex-col dark:bg-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out",
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full sm:translate-x-0"
        )}
      >
        <div className="flex flex-col p-4 sm:p-6 font-['Inria_Sans'] h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="EMP Admin"
                className="h-10 w-10 sm:h-12 sm:w-12"
              />
              <span className="text-lg font-bold">EMP Admin</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {localizedNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex items-center cursor-pointer gap-3 w-full text-left text-sm sm:text-base px-4 py-2 rounded-lg border transition-colors font-combo",
                  // Default styles
                  "bg-gray-100 border-gray-200 text-black hover:bg-green-700 hover:text-white dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700",
                  // Active styles
                  activeNav?.href === item.href &&
                  "bg-red-800 text-white dark:bg-white dark:text-black"
                )}
              >
                {item.icon}
                {t[item.name]}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 flex flex-col min-w-0">
        <header className="flex flex-col sm:flex-row items-center justify-between bg-[#F9F9F9] dark:bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 shadow gap-3 sm:gap-0">
          {/* Mobile header */}
          <div className="flex items-center justify-between w-full sm:hidden">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="EMP Admin"
                className="h-10 w-10"
              />
              <span className="text-lg font-bold">EMP Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                {darkMode ? (
                  <MdNightlightRound size={18} />
                ) : (
                  <AiFillSun size={18} />
                )}
              </button>
              <UserDropdown />
            </div>
          </div>

          {/* Search bar */}
          <div
            ref={searchRef}
            className="w-full sm:flex-1 sm:max-w-lg mx-0 sm:mx-8 relative"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-5 h-5 sm:w-6 sm:h-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            >
              <path d="m21 21-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314" />
            </svg>

            <input
              type="search"
              placeholder={
                language === "en"
                  ? "Search products, orders, customers..."
                  : "ស្វែងរកផលិតផល, ការកម្មង់, អតិថិជន..."
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 pl-10 pr-3 py-2 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
              value={search}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
            />

            {/* Search Results Dropdown */}
            <SearchResults
              query={search}
              isOpen={isSearchOpen}
              onClose={closeSearch}
              language={language}
            />
          </div>

          {/* Desktop controls */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Language switch */}
            <LanguageDropdown
              language={language}
              onLanguageChange={handleLanguageChange}
            />

            {/* Dark mode switch */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center cursor-pointer justify-center p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 h-10 w-10"
            >
              {darkMode ? (
                <MdNightlightRound size={20} />
              ) : (
                <AiFillSun size={20} />
              )}
            </button>

            {/* Notifications */}
            <NotificationBell language={language} />

            <UserDropdown />
          </div>
        </header>

        <main className="relative p-2 sm:p-2 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}