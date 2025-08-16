"use client";

import { navLinks } from "@/data/navLinks";
import { useTranslations } from "@/utils/useTranslations";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageDropdown } from "./LanguageDropdown";
import { UserProfileDropdown } from "./UserProfileDropdown";

export function CustomerNavbar({
  language,
  onLanguageChange,
}: {
  language: "en" | "kh";
  onLanguageChange: (lang: "en" | "kh") => void;
}) {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const t = useTranslations(language);

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
    return `/${language}${
      cleanHref.startsWith("/") ? cleanHref : `/${cleanHref}`
    }`;
  };

  return (
    <nav className="border-b border-gray-300 bg-white dark:bg-gray-900 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap">
      {/* Logo & Hamburger */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <Link
          href={getLocalizedHref("/customer")}
          className="flex items-center space-x-2 font-bold text-xl text-gray-900 dark:text-white"
        >
          <img src="/images/logo.png" alt="EMP Logo" className="h-12 w-12" />
          <span>EMP</span>
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {menuOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div
        className={`${
          menuOpen ? "block" : "hidden"
        } w-full md:flex md:items-center md:w-auto mt-4 md:mt-0`}
      >
        <div className="flex flex-col md:flex-row md:space-x-6">
          {navLinks.map(({ href, label }) => {
            const localizedHref = getLocalizedHref(href);
            const isActive = hydrated && pathname === localizedHref;

            return (
              <Link
                key={href}
                href={localizedHref}
                className={`py-2 md:py-0 font-semibold hover:text-black dark:hover:text-white ${
                  isActive
                    ? "text-black underline dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
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
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none"
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
            language === "en" ? "Search products..." : "ស្វែងរកផលិតផល..."
          }
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-10 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4 mt-4 md:mt-0">
        <LanguageDropdown
          language={language}
          onLanguageChange={toggleLanguage}
        />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {darkMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m8.485-8.485h1M3.515 12h1m12.02 4.95l.707.707M6.343 6.343l.707.707M16.95 7.05l.707-.707M7.05 16.95l.707-.707M12 7a5 5 0 100 10a5 5 0 000-10z"
              />
            </svg>
          )}
        </button>

        {/* Cart */}
        <button className="relative text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g>
              <path d="M7.5 18a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM16.5 18a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
              <path d="M11 9H8M2 3l.265.088c1.32.44 1.98.66 2.357 1.184S5 5.492 5 6.883V9.5c0 2.828 0 4.243.879 5.121.878.879 2.293.879 5.121.879h2m6 0h-2" />
              <path d="M5 6h3m-2.5 7h10.522c.96 0 1.439 0 1.815-.248s.564-.688.942-1.57l.429-1c.81-1.89 1.214-2.833.77-3.508C19.533 6 18.505 6 16.45 6H12" />
            </g>
          </svg>
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1" />
        </button>

        <UserProfileDropdown />
      </div>
    </nav>
  );
}
