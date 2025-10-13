"use client";

import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { useState } from "react";
import { BiUpload } from "react-icons/bi";
import { FaEnvelope, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import {
  FaCity,
  FaEarthAsia,
  FaGlobe,
  FaHashtag,
  FaPhone,
} from "react-icons/fa6";
import { RiBuilding2Line, RiProfileLine } from "react-icons/ri";
import { TbBuildingEstate } from "react-icons/tb";

interface GeneralSettingsProps {
  formData: {
    user: {
      name: string;
      email: string;
      phone: string;
      avatar: string;
      file?: File;
    };
    profile: {
      bio: string;
      birth_date?: string;
      gender?: string;
      website?: string;
      social_links?: string;
    };
    address: {
      label?: string;
      recipient_name?: string;
      phone?: string;
      address_line_1: string;
      address_line_2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  onFormChange: (newData: any) => void;
  currentLanguage: "en" | "kh";
}

export default function GeneralSettings({
  formData,
  onFormChange,
  currentLanguage,
}: GeneralSettingsProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const [section, field] = name.split(".");
    console.log("Field changed:", name, value); // Debug log

    if (section === "user") {
      onFormChange({ user: { [field]: value } });
    } else if (section === "profile") {
      onFormChange({ profile: { [field]: value } });
    } else if (section === "address") {
      onFormChange({ address: { [field]: value } });
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const t = useTranslations(currentLanguage);

  const getAvatarUrl = (avatar: string) => {
    if (!avatar) return "/default-avatar.png";

    // If it's a data URL (from FileReader) or full URL, just return it
    if (avatar.startsWith("data:") || avatar.startsWith("http")) return avatar;

    // Otherwise, prepend backend URL + /storage
    return `${API_BASE_URL}/storage/${avatar}`;
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large. Please select an image under 5MB.");
      setIsUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onFormChange({
        user: {
          ...formData.user,
          avatar: reader.result as string,
          file: file,
        },
      });
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert("Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-xl flex items-center font-semibold text-black dark:text-white">
          <FaEarthAsia className="mr-2" /> {t.settingSession.generalSettings}
        </h2>
        <p className="text-gray-500 dark:text-gray-300">
          {t.settingSession.generalSettingsDescription}
        </p>
      </div>

      {/* Avatar Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md mr-3">
            <FaUser className="text-blue-600 dark:text-blue-400" />
          </div>
          {t.settingSession.profilePhoto}
        </h3>

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg group">
              <img
                src={getAvatarUrl(formData.user.avatar)}
                alt="User Avatar"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-white border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Controls */}
          <div className="flex-1">
            <div className="mb-3">
              <h4 className="font-bold text-gray-900 dark:text-white">
                {formData.user.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.settingSession.yourProfilePicture}
              </p>
            </div>

            <label className="relative cursor-pointer inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />

              <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
                <BiUpload className="text-lg" />
                <span>{isUploading ? "Uploading..." : "Upload Photo"}</span>
              </div>
            </label>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t.settingSession.supportedFormats}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md mr-3">
            <RiProfileLine className="text-purple-600 dark:text-purple-400" />
          </div>
          {t.settingSession.personalInformation}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name Field */}
          <div className="space-y-2">
            <label className=" text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <FaUser className="mr-2 text-gray-400 text-sm" />
              {t.settingSession.fullName}
            </label>
            <div className="relative">
              <input
                type="text"
                name="user.name"
                value={formData.user.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter your full name"
              />
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className=" text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <FaEnvelope className="mr-2 text-gray-400 text-sm" />
              {t.settingSession.email}
            </label>
            <div className="relative">
              <input
                type="email"
                name="user.email"
                value={formData.user.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter your email"
              />
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className=" text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <FaPhone className="mr-2 text-gray-400 text-sm" />
              {t.settingSession.phoneNumber}
            </label>
            <div className="relative">
              <input
                type="text"
                name="user.phone"
                value={formData.user.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter your phone number"
              />
              <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Bio Field */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.settingSession.bio}
            </label>
            <textarea
              name="profile.bio"
              value={formData.profile.bio}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Tell us a little about yourself..."
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-md mr-3">
            <RiBuilding2Line className="text-green-600 dark:text-green-400" />
          </div>
          {t.settingSession.addressInformation}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Address Line 1 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-gray-400 text-sm" />
              {t.settingSession.addressLine1}
            </label>
            <div className="relative">
              <input
                type="text"
                name="address.address_line_1"
                value={formData.address.address_line_1}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Street address, P.O. box"
              />
              <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <FaCity className="mr-2 text-gray-400 text-sm" />
              {t.settingSession.city}
            </label>
            <div className="relative">
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="City"
              />
              <FaCity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* State */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <TbBuildingEstate className="mr-2 text-gray-400 text-sm" />
              {t.settingSession.state}
            </label>
            <div className="relative">
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="State or province"
              />
              <TbBuildingEstate className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <label className=" text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <FaHashtag className="mr-2 text-gray-400 text-sm" />
              {t.settingSession.postalCode}
            </label>
            <div className="relative">
              <input
                type="text"
                name="address.postal_code"
                value={formData.address.postal_code}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="ZIP or postal code"
              />
              <FaHashtag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Country */}
          <div className="md:col-span-2 space-y-2">
            <label className=" text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <FaGlobe className="mr-2 text-gray-400 text-sm" />
              {t.settingSession.country}
            </label>
            <div className="relative">
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Country"
              />
              <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
