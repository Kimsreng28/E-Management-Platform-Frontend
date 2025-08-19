"use client";

interface SettingsTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function SettingsTabs({
  tabs,
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="border-b bg-gray-200 rounded-lg border-gray-200 dark:border-gray-700 mb-6">
      <nav className="flex w-full p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1  cursor-pointer text-center px-4 py-2 text-sm font-medium transition-colors duration-300 ${
              activeTab === tab
                ? "border border-gray-300 dark:border-gray-500 drop-shadow-black bg-white rounded-lg font-semibold text-black dark:text-black"
                : "text-gray-500 dark:text-gray-700 hover:text-gray-500 dark:hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>
    </div>
  );
}
