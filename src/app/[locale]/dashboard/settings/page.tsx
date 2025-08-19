"use client";

import GeneralSettings from "@/components/ui/dashboard/settings/GeneralSettings";
import NotificationsSettings from "@/components/ui/dashboard/settings/NotificationsSettings";
import SettingsTabs from "@/components/ui/dashboard/settings/SettingsTabs";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MdSaveAs } from "react-icons/md";

export default function SettingsPage({
  params,
}: {
  params: { locale: "en" | "kh" };
}) {
  const pathname = usePathname();
  const language = params.locale || "en";
  const t = useTranslations(language);

  const [activeTab, setActiveTab] = useState("general");

  const handleSave = () => {
    // TODO: Add API call to save settings
    alert("Settings saved successfully!");
  };

  const tabs = [
    "general",
    "notifications",
    "security",
    "appearance",
    "business",
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your platform configuration and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          className="bg-black text-white flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          <MdSaveAs className="mr-2" />
          Save Changes
        </button>
      </div>

      {/* Tabs Navigation */}
      <SettingsTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
        {activeTab === "general" && <GeneralSettings />}
        {activeTab == "notifications" && <NotificationsSettings />}
        {activeTab !== "general" && (
          <div className="text-gray-500 dark:text-gray-400">
            Content for {activeTab} tab coming soon...
          </div>
        )}
      </div>
    </div>
  );
}
