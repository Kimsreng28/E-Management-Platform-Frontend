"use client";

import UserDropdown from "@/components/ui/dashboard/UserDropdown";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { navItems } from "@/data/navItems";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/utils/useTranslations";
import { Inria_Sans, Kantumruy_Pro } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "kh">(locale as "en" | "kh");
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = useTranslations(language);

  // Prepare nav items with locale
  const localizedNavItems = navItems.map((item) => ({
    ...item,
    href: `/${language}${item.href}`,
  }));

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
    router.push(newPath);
  };

  const handleNavClick = (href: string) => {
    if (pathname !== href) {
      setIsLoading(true);
      router.push(href);
      setMobileMenuOpen(false); // Close mobile menu on navigation
    }
  };

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <div
      className={`flex min-h-screen ${inriaSans.variable} ${kantumruyPro.variable} font-combo antialiased`}
    >
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed z-50 bottom-4 right-4 sm:hidden bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-3 rounded-full shadow-lg"
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
          className="fixed inset-0 z-40 bg-black bg-opacity-50 sm:hidden"
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
                  "flex font-combo cursor-pointer items-center gap-3 w-full text-left dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-600 hover:text-white transition text-sm sm:text-base",
                  pathname === item.href &&
                    "bg-gray-900 text-white dark:bg-white dark:text-black"
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
          <div className="w-full sm:flex-1 sm:max-w-lg mx-0 sm:mx-8 relative">
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
                  : "ស្វែងរកផលិតផល..."
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 pl-10 pr-3 py-2 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Desktop controls */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Language switch */}
            {/* <LanguageDropdown
              language={language}
              onLanguageChange={handleLanguageChange}
            /> */}

            {/* Dark mode switch */}
            {/* <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 h-10 w-10"
            >
              {darkMode ? (
                <MdNightlightRound size={20} />
              ) : (
                <AiFillSun size={20} />
              )}
            </button> */}

            <UserDropdown />
          </div>
        </header>

        <main className="relative p-4 sm:p-6 flex-1 overflow-x-hidden">
          <LoadingOverlay show={isLoading} />
          {children}
        </main>
      </div>
    </div>
  );
}
