"use client";

import { getToken } from "@/lib/api/auth";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { Switch } from "@headlessui/react";
import { debounce } from "lodash";
import { useEffect, useState } from "react";
import { IoIosColorPalette } from "react-icons/io";
import { IoMoon, IoSunny } from "react-icons/io5";
import { RiCurrencyLine, RiEarthLine, RiTimeLine } from "react-icons/ri";
import Swal from "sweetalert2";

interface AppearanceSettingsProps {
  currentLanguage: "en" | "kh";
  currentDarkMode: boolean;
  onLanguageChange: (language: "en" | "kh") => void;
  onDarkModeChange: (darkMode: boolean) => void;
}

export default function AppearanceSettings({
  currentLanguage,
  currentDarkMode,
  onLanguageChange,
  onDarkModeChange,
}: AppearanceSettingsProps) {
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("Asia/Phnom_Penh");
  const [isLoading, setIsLoading] = useState(true);

  const [timezones, setTimezones] = useState<string[]>([]);

  const t = useTranslations(currentLanguage);

  const currencies = [
    { value: "USD", label: t.settingSession.us },
    { value: "KHR", label: t.settingSession.kh },
  ];

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Get all support timezones
        let tzList: string[] = [];
        if (typeof Intl.supportedValuesOf === "function") {
          tzList = Intl.supportedValuesOf("timeZone");
        } else {
          // fallback (modern browsers support this already)
          tzList = ["UTC", "Asia/Phnom_Penh"];
        }

        setTimezones(tzList);

        // Detect user's current timezone
        const detectedTimezone =
          Intl.DateTimeFormat().resolvedOptions().timeZone;

        const token = getToken();
        const response = await fetch(
          `${API_BASE_URL}/api/appearance-settings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCurrency(data.currency || "USD");
          setTimezone(data.timezone || detectedTimezone || "UTC");
        } else {
          setTimezone(detectedTimezone || "UTC");
        }
      } catch (error) {
        console.error("Error loading appearance settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings with debounce
  const saveSettings = debounce(
    async (settings: {
      language?: string;
      dark_mode?: boolean;
      currency?: string;
      timezone?: string;
    }) => {
      try {
        const token = getToken();
        const response = await fetch(
          `${API_BASE_URL}/api/appearance-settings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              language: currentLanguage,
              dark_mode: currentDarkMode,
              currency,
              timezone,
              ...settings,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save appearance settings");
        }

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Settings saved!",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
      } catch (error: any) {
        Swal.fire({
          position: "top-end",
          title: "Error!",
          text: error.message || "Failed to save settings",
          icon: "error",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    500
  );

  // Handle language change with immediate save
  const handleLanguageChange = (language: "en" | "kh") => {
    onLanguageChange(language);
    saveSettings({ language });
  };

  // Handle dark mode change with immediate save
  const handleDarkModeChange = (darkMode: boolean) => {
    onDarkModeChange(darkMode);
    saveSettings({ dark_mode: darkMode });
  };

  // Handle currency change
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    saveSettings({ currency: newCurrency });
  };

  // Handle timezone change
  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    setTimezone(newTimezone);
    saveSettings({ timezone: newTimezone });
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      saveSettings.cancel();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl flex items-center font-semibold text-black dark:text-white">
          <IoIosColorPalette className="mr-2" />
          {t.settingSession.appearanceSettings}
        </h2>
        <p className="text-gray-500 dark:text-gray-300">
          {t.settingSession.appearanceSettingsDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <RiEarthLine className="text-xl text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.settingSession.language}
            </h3>
          </div>
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) =>
                handleLanguageChange(e.target.value as "en" | "kh")
              }
              className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
            >
              <option value="en">English</option>
              <option value="kh">ភាសាខ្មែរ</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <RiEarthLine className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20  rounded-lg">
              {currentDarkMode ? (
                <IoMoon className="text-xl text-purple-600 dark:text-purple-400" />
              ) : (
                <IoSunny className="text-xl text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.settingSession.theme}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {currentDarkMode ? (
                <>
                  <IoMoon className="text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {currentLanguage === "en" ? "Dark Mode" : "ផ្ទាំងងងឹត"}
                  </span>
                </>
              ) : (
                <>
                  <IoSunny className="text-amber-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {currentLanguage === "en" ? "Light Mode" : "ផ្ទាំងពន្លឺ"}
                  </span>
                </>
              )}
            </div>
            <Switch
              checked={currentDarkMode}
              onChange={handleDarkModeChange}
              className={`${
                currentDarkMode
                  ? "bg-purple-600"
                  : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-7 w-12 items-center cursor-pointer rounded-full transition-colors duration-300 ease-in-out`}
            >
              <span
                className={`${
                  currentDarkMode ? "translate-x-6" : "translate-x-1"
                } inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 ease-in-out`}
              />
            </Switch>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <RiCurrencyLine className="text-xl text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.settingSession.currency}
            </h3>
          </div>
          <div className="relative">
            <select
              value={currency}
              onChange={handleCurrencyChange}
              className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
            >
              {currencies.map((curr) => (
                <option key={curr.value} value={curr.value}>
                  {curr.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <RiCurrencyLine className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Timezone Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <RiTimeLine className="text-xl text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.settingSession.timezone}
            </h3>
          </div>
          <div className="relative">
            <select
              value={timezone}
              onChange={handleTimezoneChange}
              className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <RiTimeLine className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t.settingSession.preview}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-xl ${
              currentDarkMode
                ? "bg-gray-800 text-white dark:bg-gray-700 dark:text-gray-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{t.settingSession.theme}</span>
              {currentDarkMode ? (
                <div className="flex items-center text-sm text-purple-400">
                  <IoMoon className="mr-1" />
                  <span>{currentLanguage === "en" ? "Dark" : "ងងឹត"}</span>
                </div>
              ) : (
                <div className="flex items-center text-sm text-amber-500">
                  <IoSunny className="mr-1" />
                  <span>{currentLanguage === "en" ? "Light" : "ភ្លឺ"}</span>
                </div>
              )}
            </div>
            <p className="text-sm opacity-75">
              {t.settingSession.themeDescription}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-blue-800 dark:text-blue-200">
                {t.settingSession.language}
              </span>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-300">
                <RiEarthLine className="mr-1" />
                <span>
                  {currentLanguage === "en" ? "English" : "ភាសាខ្មែរ"}
                </span>
              </div>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {currentLanguage === "en"
                ? "Your interface language is set to English."
                : "ភាសានៃចំណុចប្រទាក់របស់អ្នកត្រូវបានកំណត់ជាភាសាខ្មែរ។"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
