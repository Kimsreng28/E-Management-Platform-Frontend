"use client";

import { API_BASE_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  IoIosArrowBack,
  IoIosSave,
  IoIosCamera,
  IoIosPerson,
  IoIosMail,
  IoIosCall,
  IoIosCalendar,
  IoIosLink,
  IoIosLock,
  IoIosEye,
  IoIosEyeOff,
  IoIosPin
} from "react-icons/io";
import { FaTransgender, FaGlobe } from "react-icons/fa";
import { useTranslations } from "@/utils/useTranslations";
import dynamic from 'next/dynamic';
import Swal from "sweetalert2";
import MapSelectionModal from "@/components/ui/customer/MapSelectionModal";

interface UserProfile {
  user: {
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
  };
  profile: {
    bio: string | null;
    birth_date: string | null;
    gender: string | null;
    website: string | null;
    social_links: string | null;
  };
  address: {
    id?: number;
    label: string;
    recipient_name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    latitude?: number;
    longitude?: number;
  } | null;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}
export default function ProfilePage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {

  const unwrappedParams = use(params);
  const language = unwrappedParams.locale || "en";
  const t = useTranslations(language);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Map modal states
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const [formData, setFormData] = useState({
    user: {
      name: "",
      email: "",
      phone: "",
    },
    profile: {
      bio: "",
      birth_date: "",
      gender: "",
      website: "",
      social_links: "",
    },
    address: {
      id: undefined as number | undefined,
      label: "",
      recipient_name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
    }
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: UserProfile = await response.json();
        setProfile(data);
        setFormData({
          user: {
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
          },
          profile: {
            bio: data.profile?.bio || "",
            birth_date: data.profile?.birth_date || "",
            gender: data.profile?.gender || "",
            website: data.profile?.website || "",
            social_links: data.profile?.social_links || "",
          },
          address: data.address ? {
            id: data.address.id,
            label: data.address.label || "",
            recipient_name: data.address.recipient_name || "",
            phone: data.address.phone || "",
            address_line_1: data.address.address_line_1 || "",
            address_line_2: data.address.address_line_2 || "",
            city: data.address.city || "",
            state: data.address.state || "",
            postal_code: data.address.postal_code || "",
            country: data.address.country || "",
            latitude: data.address.latitude,
            longitude: data.address.longitude,
          } : {
            id: undefined,
            label: "",
            recipient_name: "",
            phone: "",
            address_line_1: "",
            address_line_2: "",
            city: "",
            state: "",
            postal_code: "",
            country: "",
            latitude: undefined,
            longitude: undefined,
          }
        });

        // Set coordinates for map modal
        if (data.address?.latitude && data.address?.longitude) {
          setSelectedCoordinates({
            lat: data.address.latitude,
            lng: data.address.longitude
          });
        }
      } else {
        setError("Failed to fetch profile");
      }
    } catch (error) {
      setError("An error occurred while fetching profile");
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleAddressChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Avatar updated successfully!',
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        fetchProfile();
      } else {
        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: 'Failed to update avatar',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
        });
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Error updating avatar',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      // Prepare the data for submission
      const submissionData = {
        ...formData.user,
        ...formData.profile,
        address: formData.address
      };

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Profile updated successfully!',
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        fetchProfile();
      } else {
        const errorData = await response.json();
        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: 'Failed to update profile',
          text: errorData.message || 'Please try again',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Error updating profile',
        text: 'Please try again',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/security/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      if (response.ok) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Password changed successfully!',
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        setShowPasswordModal(false);
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: ""
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: 'Failed to change password',
          text: errorData.message || 'Please try again',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
        });
      }
    } catch (error) {
      console.error("Password change error:", error);
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Error changing password',
        text: 'Please try again',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleMapSelect = async (lat: number, lng: number) => {
    handleAddressChange("latitude", lat);
    handleAddressChange("longitude", lng);

    // Save coordinates to the address if it exists
    if (formData.address?.id) {
      await saveAddressCoordinates(formData.address.id, lat, lng);
    }
  };

  const saveAddressCoordinates = async (addressId: number, lat: number, lng: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/addresses/${addressId}/coordinates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      if (response.ok) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Location saved successfully!',
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save coordinates');
      }
    } catch (error: any) {
      console.error('Failed to save coordinates:', error);
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Failed to save location',
        text: error.message || 'Please try again',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 border-t-black border-gray-200 dark:border-gray-700"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.profileSetting.profileSettings}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.profileSetting.manageYourAccount}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t.profileSetting.profilePhoto}
            </h2>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {profile?.user.avatar ? (
                    <img
                      src={`${API_BASE_URL}/storage/${profile.user.avatar}`}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <IoIosPerson className="w-10 h-10 text-gray-400" />
                  )}
                </div>

                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <IoIosCamera className="w-4 h-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.profileSetting.uploadANewPhoto}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t.profileSetting.personalInformation}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.profileSetting.fullName}
                </label>
                <div className="relative">
                  <IoIosPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.user.name}
                    onChange={(e) => handleInputChange("user", "name", e.target.value)}
                    className="pl-10 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.profileSetting.emailAddress}
                </label>
                <div className="relative">
                  <IoIosMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.user.email}
                    onChange={(e) => handleInputChange("user", "email", e.target.value)}
                    className="pl-10 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.login.phoneNumber}
                </label>
                <div className="relative">
                  <IoIosCall className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.user.phone}
                    onChange={(e) => handleInputChange("user", "phone", e.target.value)}
                    className="pl-10 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.profileSetting.birthDate}
                </label>
                <div className="relative">
                  <IoIosCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={formData.profile.birth_date}
                    onChange={(e) => handleInputChange("profile", "birth_date", e.target.value)}
                    className="pl-10 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingSession.gender}
                </label>
                <div className="relative">
                  <FaTransgender className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.profile.gender}
                    onChange={(e) => handleInputChange("profile", "gender", e.target.value)}
                    className="pl-10 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingSession.website}
                </label>
                <div className="relative">
                  <IoIosLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={formData.profile.website}
                    onChange={(e) => handleInputChange("profile", "website", e.target.value)}
                    className="pl-10 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={formData.profile.bio}
                onChange={(e) => handleInputChange("profile", "bio", e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t.profileSetting.tellUs}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t.settingSession.addressInformation}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address Label
                </label>
                <input
                  type="text"
                  value={formData.address.label}
                  onChange={(e) => handleAddressChange("label", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Home, Office, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={formData.address.recipient_name}
                  onChange={(e) => handleAddressChange("recipient_name", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingSession.phoneNumber}
                </label>
                <input
                  type="tel"
                  value={formData.address.phone}
                  onChange={(e) => handleAddressChange("phone", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Phone number for delivery"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingSession.addressLine1}
                </label>
                <input
                  type="text"
                  value={formData.address.address_line_1}
                  onChange={(e) => handleAddressChange("address_line_1", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Street address, P.O. box"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingSession.addressLine2}
                </label>
                <input
                  type="text"
                  value={formData.address.address_line_2}
                  onChange={(e) => handleAddressChange("address_line_2", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingSession.city}
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingSession.state}
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="State or province"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingSession.postalCode}
                </label>
                <input
                  type="text"
                  value={formData.address.postal_code}
                  onChange={(e) => handleAddressChange("postal_code", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="ZIP or postal code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.settingSession.country}
                </label>
                <div className="relative">
                  <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) => handleAddressChange("country", e.target.value)}
                    className="pl-10 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Country"
                  />
                </div>
              </div>

              {/* Coordinates Section */}
              <div className="col-span-1 md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Location Coordinates
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set your exact location for better delivery accuracy
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCoordinates(
                        formData.address.latitude && formData.address.longitude
                          ? { lat: formData.address.latitude, lng: formData.address.longitude }
                          : null
                      );
                      setShowMapModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <IoIosPin className="mr-2" />
                    Set on Map
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.address.latitude || ''}
                      onChange={(e) => handleAddressChange("latitude", e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 11.5564"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.address.longitude || ''}
                      onChange={(e) => handleAddressChange("longitude", e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 104.9282"
                    />
                  </div>
                </div>

                {formData.address.latitude && formData.address.longitude && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Location coordinates set: {Number(formData.address.latitude).toFixed(6)}, {Number(formData.address.longitude).toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t.settingSession.security}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{t.settingSession.changePassword}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t.profileSetting.updateYourPassword}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  title="Change Password"
                  className={`px-2 w-fit flex items-center cursor-pointer justify-center gap-2 py-2 rounded-full font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12.079 2.25c-4.794 0-8.734 3.663-9.118 8.333H2a.75.75 0 0 0-.528 1.283l1.68 1.666a.75.75 0 0 0 1.056 0l1.68-1.666a.75.75 0 0 0-.528-1.283h-.893c.38-3.831 3.638-6.833 7.612-6.833a7.66 7.66 0 0 1 6.537 3.643a.75.75 0 1 0 1.277-.786A9.16 9.16 0 0 0 12.08 2.25m8.761 8.217a.75.75 0 0 0-1.054 0L18.1 12.133a.75.75 0 0 0 .527 1.284h.899c-.382 3.83-3.651 6.833-7.644 6.833a7.7 7.7 0 0 1-6.565-3.644a.75.75 0 1 0-1.277.788a9.2 9.2 0 0 0 7.842 4.356c4.808 0 8.765-3.66 9.15-8.333H22a.75.75 0 0 0 .527-1.284z" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`px-4 w-fit flex items-center cursor-pointer justify-center gap-2 py-2 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t.profileSetting.saving}
                </>
              ) : (
                <>
                  <IoIosSave className="mr-2" />
                  {t.settingSession.saveChanges}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {t.settingSession.changePassword}
              </h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.settingSession.currentPassword}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={(e) => handlePasswordChange("current_password", e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showCurrentPassword ? <IoIosEyeOff /> : <IoIosEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.settingSession.newPassword}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={(e) => handlePasswordChange("new_password", e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? <IoIosEyeOff /> : <IoIosEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.settingSession.confirmNewPassword}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.new_password_confirmation}
                      onChange={(e) => handlePasswordChange("new_password_confirmation", e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? <IoIosEyeOff /> : <IoIosEye />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 cursor-pointer bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    {t.productDashboard.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className={`px-4 w-fit  flex items-center cursor-pointer justify-center gap-2 py-2 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
                  >
                    {changingPassword ? t.profileSetting.changing : t.settingSession.changePassword}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Map Selection Modal */}
        <MapSelectionModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setSelectedCoordinates(null);
          }}
          onSelect={handleMapSelect}
          initialLat={selectedCoordinates?.lat || (formData.address.latitude || 11.5564)}
          initialLng={selectedCoordinates?.lng || (formData.address.longitude || 104.9282)}
        />
      </div>
    </div>
  );
}