"use client";

interface Tab {
  id: string;
  label: string;
}

interface SettingsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SettingsTabs({
  tabs,
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="border-b bg-gray-200 dark:bg-gray-900 rounded-lg border-gray-200 dark:border-gray-700 mb-6">
      <nav className="flex w-full gap-2 p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 cursor-pointer text-center px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${
                isActive
                  ? "border border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-100 font-semibold text-black"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
