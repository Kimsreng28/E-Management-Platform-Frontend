"use client";

import { useEffect, useRef, useState } from "react";

type Language = "en" | "kh";

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LanguageDropdown({ language, onLanguageChange }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleDropdown() {
    setOpen(!open);
  }

  function selectLanguage(lang: Language) {
    onLanguageChange(lang);
    setOpen(false);
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={open}
        className="
    flex items-center justify-center space-x-2
    px-3 py-2
    rounded-lg
    bg-gray-200 dark:bg-white
    hover:bg-gray-200 dark:hover:bg-gray-700
    transition-colors duration-300 ease-in-out
    cursor-pointer
    select-none
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
  "
      >
        {/* Flag */}
        <span
          className={`fi fi-${language === "en" ? "us" : "kh"} fis w-5 h-5`}
        />

        {/* Language label */}
        <span className="text-sm font-semibold text-gray-800 dark:text-black tracking-wide select-none">
          {language.toUpperCase()}
        </span>

        {/* Down arrow */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-gray-600 dark:text-gray-600 transform transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className="
      origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg
      bg-white dark:bg-white focus:outline-none z-50
    "
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
        >
          {(["en", "kh"] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => selectLanguage(lang)}
              className={`
          flex items-center justify-start gap-2 w-full px-4 py-2 text-sm cursor-pointer
          ${
            language === lang
              ? "bg-gray-900 text-white dark:bg-gray-900 dark:text-white rounded-t-md"
              : "text-gray-700 dark:text-black hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-md"
          }
          focus:outline-none focus:ring-2 focus:ring-gray-500
        `}
              role="menuitem"
            >
              {/* Flag */}
              <span
                className={`fi fi-${lang === "en" ? "us" : "kh"} fis w-5 h-5`}
              />
              <span>{lang.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
