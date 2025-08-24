"use client";

import AppearanceSettings from "@/components/ui/dashboard/settings/AppearanceSettings";
import BusinessSettings from "@/components/ui/dashboard/settings/BusinessSettings";
import GeneralSettings from "@/components/ui/dashboard/settings/GeneralSettings";
import NotificationsSettings from "@/components/ui/dashboard/settings/NotificationsSettings";
import SecuritySettings from "@/components/ui/dashboard/settings/SecuritySettings";
import SettingsTabs from "@/components/ui/dashboard/settings/SettingsTabs";
import TopCouponsPage from "@/components/ui/dashboard/settings/TopCouponsPage";
import { getToken } from "@/lib/api/auth";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MdSaveAs } from "react-icons/md";
import Swal from "sweetalert2";

interface UserData {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  file?: File;
}

interface ProfileData {
  bio: string;
  birth_date?: string;
  gender?: string;
  website?: string;
  social_links?: string;
}

interface AddressData {
  label?: string;
  recipient_name?: string;
  phone?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface FormDataState {
  user: UserData;
  profile: ProfileData;
  address: AddressData;
}

export default function SettingsPage({ locale }: { locale: "en" | "kh" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState<"en" | "kh">(locale);
  const t = useTranslations(language);

  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null);

  const [formData, setFormData] = useState<FormDataState>({
    user: { name: "", email: "", phone: "", avatar: "" },
    profile: { bio: "" },
    address: {
      address_line_1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "Cambodia",
    },
  });

  useEffect(() => {
    const match = pathname.match(/^\/(en|kh)/);
    if (match && match[1] !== language) {
      setLanguage(match[1] as "en" | "kh");
    }
  }, [pathname]);

  // Dark mode initialization
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle("dark", savedDarkMode);
  }, []);

  const toggleDarkMode = (newMode: boolean) => {
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark", newMode);
  };

  const handleLanguageChange = (newLang: "en" | "kh") => {
    setLanguage(newLang);
    const newPath = pathname.replace(/^\/(en|kh)/, `/${newLang}`);
    router.push(newPath);
  };

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setFormData({
        user: {
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
          avatar: data.user?.avatar || "",
        },
        profile: {
          bio: data.profile?.bio || "",
          birth_date: data.profile?.birth_date || "",
          gender: data.profile?.gender || "",
          website: data.profile?.website || "",
          social_links: data.profile?.social_links || "",
        },
        address: {
          label: data.address?.label || "Home",
          recipient_name: data.address?.recipient_name || data.user?.name || "",
          phone: data.address?.phone || data.user?.phone || "",
          address_line_1: data.address?.address_line_1 || "",
          address_line_2: data.address?.address_line_2 || "",
          city: data.address?.city || "",
          state: data.address?.state || "",
          postal_code: data.address?.postal_code || "",
          country: data.address?.country || "Cambodia",
        },
      });

      console.log("Fetched profile data:", data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error!",
        text: "Failed to load profile data",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update form data with deep merge
  const updateFormData = (newData: Partial<FormDataState>) => {
    setFormData((prev) => ({
      user: { ...prev.user, ...(newData.user || {}) },
      profile: { ...prev.profile, ...(newData.profile || {}) },
      address: { ...prev.address, ...(newData.address || {}) },
    }));
  };

  // Save handler
  const handleSave = async () => {
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      if (activeTab === "general") {
        let res: Response;

        // If uploading avatar, use FormData
        if (formData.user.file) {
          const fd = new FormData();
          if (formData.user.name) fd.append("name", formData.user.name);
          if (formData.user.email) fd.append("email", formData.user.email);
          if (formData.user.phone) fd.append("phone", formData.user.phone);
          if (formData.profile.bio) fd.append("bio", formData.profile.bio);
          if (formData.address.address_line_1)
            fd.append(
              "address[address_line_1]",
              formData.address.address_line_1
            );
          if (formData.address.city)
            fd.append("address[city]", formData.address.city);
          if (formData.address.state)
            fd.append("address[state]", formData.address.state);
          if (formData.address.postal_code)
            fd.append("address[postal_code]", formData.address.postal_code);
          if (formData.address.country)
            fd.append("address[country]", formData.address.country);
          if (formData.user.file) fd.append("avatar", formData.user.file);

          res = await fetch(`${API_BASE_URL}/api/profile`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
        } else {
          // JSON payload with only non-empty fields
          const payload: any = {};
          if (formData.user.name) payload.name = formData.user.name;
          if (formData.user.email) payload.email = formData.user.email;
          if (formData.user.phone) payload.phone = formData.user.phone;
          if (formData.profile.bio) payload.bio = formData.profile.bio;

          // Address fields
          payload.address = {};
          if (formData.address.address_line_1)
            payload.address.address_line_1 = formData.address.address_line_1;
          if (formData.address.city)
            payload.address.city = formData.address.city;
          if (formData.address.state)
            payload.address.state = formData.address.state;
          if (formData.address.postal_code)
            payload.address.postal_code = formData.address.postal_code;
          if (formData.address.country)
            payload.address.country = formData.address.country;

          // Remove address if empty
          if (Object.keys(payload.address).length === 0) delete payload.address;

          res = await fetch(`${API_BASE_URL}/api/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
        }

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Validation failed");
        }
      }

      if (activeTab === "notifications" && notificationData) {
        const res = await fetch(`${API_BASE_URL}/api/notification-settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(notificationData),
        });

        if (!res.ok) throw new Error("Failed to save notification settings");
      }

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Setting Save Successfully!",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });

      await fetchProfile();
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Error!",
        text: err.message || "settings.saveFailed",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const tabs = [
    { id: "general", label: t.settingSession.general },
    { id: "notifications", label: t.settingSession.notification },
    { id: "security", label: t.settingSession.security },
    { id: "appearance", label: t.settingSession.appearance },
    { id: "business", label: t.settingSession.business },
    { id: "coupons", label: "Coupons" },
  ];

  return (
    <div className="p-1 space-y-1">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 text-black dark:text-white">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {t.settingSession.setting}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t.settingSession.manageSettingSubtitle}
          </p>
        </div>
        <button
          onClick={handleSave}
          className="bg-black text-white flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          <MdSaveAs className="mr-2" />
          {t.settingSession.saveChanges}
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
        {activeTab === "general" && (
          <GeneralSettings
            currentLanguage={language}
            formData={formData}
            onFormChange={updateFormData}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationsSettings
            currentLanguage={language}
            onSettingsChange={setNotificationData}
          />
        )}
        {activeTab === "security" && (
          <SecuritySettings currentLanguage={language} />
        )}
        {activeTab === "appearance" && (
          <AppearanceSettings
            currentLanguage={language}
            currentDarkMode={darkMode}
            onLanguageChange={handleLanguageChange}
            onDarkModeChange={toggleDarkMode}
          />
        )}
        {activeTab === "business" && (
          <BusinessSettings currentLanguage={language} />
        )}

        {activeTab === "coupons" && <TopCouponsPage locale={language} />}
      </div>
    </div>
  );
}
