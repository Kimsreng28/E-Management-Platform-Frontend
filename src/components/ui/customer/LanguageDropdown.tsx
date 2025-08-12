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

  // SVG Flags
  const flags = {
    en: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 480"
        className="h-6 w-6 "
        role="img"
        aria-label="English"
      >
        <rect width="640" height="480" fill="#b22234" />
        <g fill="#fff">
          <rect y="35" width="640" height="35" />
          <rect y="105" width="640" height="35" />
          <rect y="175" width="640" height="35" />
          <rect y="245" width="640" height="35" />
          <rect y="315" width="640" height="35" />
          <rect y="385" width="640" height="35" />
        </g>
        <rect width="296" height="210" fill="#3c3b6e" />
        <g fill="#fff">
          {[...Array(9)].map((_, i) => (
            <polygon
              key={i}
              points="10,10 12,14 16,14 13,17 14,21 10,19 6,21 7,17 4,14 8,14"
              transform={`translate(${(i % 3) * 33 + 15},${
                Math.floor(i / 3) * 35 + 20
              }) scale(1.5)`}
            />
          ))}
        </g>
      </svg>
    ),
    kh: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 480"
        className="h-6 w-6"
        role="img"
        aria-label="Khmer"
      >
        <rect width="640" height="480" fill="#002868" />
        <rect y="120" width="640" height="240" fill="#ce1126" />
        <path
          fill="#fff"
          d="M320 185l60 100-60-30-60 30 60-100z"
          stroke="#000"
          strokeWidth="4"
        />
        <path fill="#fff" d="M310 185h20v80h-20z" />
        <circle cx="320" cy="175" r="10" fill="#fff" />
      </svg>
    ),
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={open}
        className="
          flex items-center space-x-2
          px-3 py-1.5
          rounded-lg
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          transition-colors duration-300 ease-in-out
          cursor-pointer
          select-none
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
        "
      >
        <span
          className="inline-block rounded-md shadow-md transform transition-transform duration-300 ease-in-out"
          style={{ willChange: "transform" }}
        >
          {flags[language]}
        </span>
        <span className="font-semibold text-gray-800 dark:text-gray-200 tracking-wide select-none">
          {language.toUpperCase()}
        </span>
        {/* Down arrow icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transform transition-transform duration-300 ${
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
            bg-white dark:bg-gray-800 focus:outline-none z-50
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
                flex items-center space-x-2 w-full px-4 py-2 text-sm
                ${
                  language === lang
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }
                rounded-md
                focus:outline-none focus:ring-2 focus:ring-gray-500
              `}
              role="menuitem"
            >
              <span className="inline-block w-6 h-6 rounded-md shadow-md">
                {flags[lang]}
              </span>
              <span>{lang.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
