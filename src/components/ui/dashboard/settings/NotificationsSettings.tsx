"use client";

import { getToken } from "@/lib/api/auth";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import {
  PiBell,
  PiDeviceMobile,
  PiEnvelope,
  PiNotificationDuotone,
  PiPaperPlaneTilt,
} from "react-icons/pi";

type NotificationSettings = {
  email: boolean;
  push: boolean;
  telegram: boolean;
  sms: boolean;
};

interface Props {
  onSettingsChange: (settings: any) => void;
  currentLanguage: "en" | "kh";
}

export default function NotificationsSettings({
  onSettingsChange,
  currentLanguage,
}: Props) {
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      email: true,
      push: true,
      telegram: false,
      sms: false,
    });
  const [telegramChatId, setTelegramChatId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const t = useTranslations(currentLanguage);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = getToken();
        const response = await fetch(
          `${API_BASE_URL}/api/notification-settings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setNotificationSettings(data.settings);
          setTelegramChatId(data.telegram_chat_id || "");
          setPhoneNumber(data.phone_number || "");
          onSettingsChange({
            settings: data.settings,
            telegram_chat_id: data.telegram_chat_id,
            phone_number: data.phone_number,
          });
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [onSettingsChange]);

  const handleToggle = async (type: keyof NotificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [type]: !notificationSettings[type],
    };

    setNotificationSettings(newSettings);
    onSettingsChange({
      settings: newSettings,
      telegram_chat_id: telegramChatId,
      phone_number: phoneNumber,
    });
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === "telegram_chat_id") {
      setTelegramChatId(value);
    } else if (field === "phone_number") {
      setPhoneNumber(value);
    }

    onSettingsChange({
      settings: notificationSettings,
      telegram_chat_id: field === "telegram_chat_id" ? value : telegramChatId,
      phone_number: field === "phone_number" ? value : phoneNumber,
    });
  };

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
        <h2 className="text-xl font-semibold flex items-center text-black dark:text-white">
          <PiNotificationDuotone className=" mr-2" />
          {t.settingSession.notificationSettings}
        </h2>
        <p className="text-gray-500 dark:text-gray-300">
          {t.settingSession.notificationSettingsDescription}
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <PiEnvelope className="text-xl text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t.settingSession.emailNotifications}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t.settingSession.receiveEmailNotifications}
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.email}
              onChange={() => handleToggle("email")}
              className={`${
                notificationSettings.email
                  ? "bg-blue-600"
                  : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out`}
            >
              <span
                className={`${
                  notificationSettings.email ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 ease-in-out`}
              />
            </Switch>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <PiBell className="text-xl text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t.settingSession.pushNotifications}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t.settingSession.receivePushNotifications}
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.push}
              onChange={() => handleToggle("push")}
              className={`${
                notificationSettings.push
                  ? "bg-green-600"
                  : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out`}
            >
              <span
                className={`${
                  notificationSettings.push ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 ease-in-out`}
              />
            </Switch>
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <PiPaperPlaneTilt className="text-xl text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t.settingSession.telegramNotifications}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t.settingSession.receiveTelegramNotifications}
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.telegram}
              onChange={() => handleToggle("telegram")}
              className={`${
                notificationSettings.telegram
                  ? "bg-purple-600"
                  : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out`}
            >
              <span
                className={`${
                  notificationSettings.telegram
                    ? "translate-x-6"
                    : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 ease-in-out`}
              />
            </Switch>
          </div>

          {notificationSettings.telegram && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <label
                htmlFor="telegramChatId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t.settingSession.telegramChatId}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) =>
                    handleFieldChange("telegram_chat_id", e.target.value)
                  }
                  className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter your Telegram Chat ID"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <PiPaperPlaneTilt className="text-gray-400" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t.settingSession.telegramChatIdDescription}
              </p>
            </div>
          )}
        </div>

        {/* SMS Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <PiDeviceMobile className="text-xl text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t.settingSession.smsNotifications}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t.settingSession.receiveSmsNotifications}
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.sms}
              onChange={() => handleToggle("sms")}
              className={`${
                notificationSettings.sms
                  ? "bg-amber-600"
                  : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out`}
            >
              <span
                className={`${
                  notificationSettings.sms ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 ease-in-out`}
              />
            </Switch>
          </div>

          {notificationSettings.sms && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t.settingSession.phoneNumber}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                  className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t.settingSession.enterYourPhoneNumber}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <PiDeviceMobile className="text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
