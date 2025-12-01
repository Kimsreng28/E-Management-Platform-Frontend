"use client";

import { getToken } from "@/lib/api/auth";
import { API_BASE_URL } from "@/lib/config";
import { useEffect, useState } from "react";
import { BsClockHistory } from "react-icons/bs";
import { FaPercentage } from "react-icons/fa";
import {
  FiAlertTriangle,
  FiCopy,
  FiCreditCard,
  FiEye,
  FiInfo,
  FiLink,
  FiUser,
} from "react-icons/fi";
import { RiKey2Fill, RiKey2Line, RiPaypalFill } from "react-icons/ri";

import { useTranslations } from "@/utils/useTranslations";
import {
  MdAttachMoney,
  MdBusinessCenter,
  MdInventory,
  MdOutlineDone,
  MdPayment,
  MdReceipt,
  MdSaveAs,
} from "react-icons/md";
import Swal from "sweetalert2";

interface BusinessHours {
  open: string;
  close: string;
  daysOpen: number[];
}

interface BusinessData {
  businessName: string;
  taxId: string;
  currency: string;
  taxRate: number;
  invoicePrefix: string;
  invoiceStartingNumber: number;
  inventoryManagement: boolean;
  lowStockThreshold: number;
  businessHours: BusinessHours;
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  khqrEnabled: boolean;
  khqrMerchantName: string;
  khqrMerchantAccount: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalSandbox: boolean;
}

interface UserRole {
  role_id: number;
  is_admin: boolean;
  is_vendor: boolean;
}

interface Props {
  currentLanguage: "en" | "kh";
}

export default function BusinessSettings({ currentLanguage }: Props) {
  const [businessData, setBusinessData] = useState<BusinessData>({
    businessName: "",
    taxId: "",
    currency: "USD",
    taxRate: 10,
    invoicePrefix: "INV-",
    invoiceStartingNumber: 1001,
    inventoryManagement: true,
    lowStockThreshold: 5,
    businessHours: {
      open: "08:00",
      close: "17:00",
      daysOpen: [1, 2, 3, 4, 5],
    },
    stripeEnabled: false,
    stripePublicKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    khqrEnabled: false,
    khqrMerchantName: "",
    khqrMerchantAccount: "",
    paypalEnabled: false,
    paypalClientId: "",
    paypalClientSecret: "",
    paypalSandbox: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const t = useTranslations(currentLanguage);

  // Load user role and business settings
  const loadUserRoleAndSettings = async () => {
    try {
      const token = getToken();

      // Load user role first
      const roleResponse = await fetch(`${API_BASE_URL}/api/business-settings/user-role`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (roleResponse.ok) {
        const roleData = await roleResponse.json();
        if (roleData.success) {
          setUserRole(roleData);
        }
      }

      // Then load business settings
      const settingsResponse = await fetch(`${API_BASE_URL}/api/business-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const settingsData = await settingsResponse.json();
      if (settingsResponse.ok && settingsData.settings) {
        const s = settingsData.settings;
        setBusinessData({
          businessName: s.business_name || "",
          taxId: s.tax_id || "",
          currency: s.currency || "USD",
          taxRate: Number(s.tax_rate) || 10,
          invoicePrefix: s.invoice_prefix || "INV-",
          invoiceStartingNumber: Number(s.invoice_starting_number) || 1001,
          inventoryManagement: s.inventory_management !== false,
          lowStockThreshold: Number(s.low_stock_threshold) || 5,
          businessHours: {
            open: s.business_hours?.open || "08:00",
            close: s.business_hours?.close || "17:00",
            daysOpen: s.business_hours?.days_open || [1, 2, 3, 4, 5],
          },
          stripeEnabled: s.stripe_enabled || false,
          stripePublicKey: s.stripe_public_key || "",
          stripeSecretKey: s.stripe_secret_key || "",
          stripeWebhookSecret: s.stripe_webhook_secret || "",
          khqrEnabled: s.khqr_enabled || false,
          khqrMerchantName: s.khqr_merchant_name || "",
          khqrMerchantAccount: s.khqr_merchant_account || "",
          paypalEnabled: s.paypal_enabled || false,
          paypalClientId: s.paypal_client_id || "",
          paypalClientSecret: s.paypal_client_secret || "",
          paypalSandbox: s.paypal_sandbox !== false,
        });
      } else {
        console.error("Failed to load settings:", settingsData);
      }
    } catch (error) {
      console.error("Error loading business settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save business settings
  const saveBusinessSettings = async () => {
    try {
      const token = getToken();

      // Prepare data - both admin and vendor can save payment settings
      const requestData: any = {
        business_name: businessData.businessName,
        tax_id: businessData.taxId,
        currency: businessData.currency,
        tax_rate: Number(businessData.taxRate),
        invoice_prefix: businessData.invoicePrefix,
        invoice_starting_number: Number(businessData.invoiceStartingNumber),
        inventory_management: Boolean(businessData.inventoryManagement),
        low_stock_threshold: Number(businessData.lowStockThreshold),
        business_hours: {
          open: businessData.businessHours.open,
          close: businessData.businessHours.close,
          days_open: businessData.businessHours.daysOpen,
        },
        // Payment settings - available for both admin and vendors
        stripe_enabled: Boolean(businessData.stripeEnabled),
        stripe_public_key: businessData.stripePublicKey,
        stripe_secret_key: businessData.stripeSecretKey,
        stripe_webhook_secret: businessData.stripeWebhookSecret,
        khqr_enabled: Boolean(businessData.khqrEnabled),
        khqr_merchant_name: businessData.khqrMerchantName,
        khqr_merchant_account: businessData.khqrMerchantAccount,
        paypal_enabled: Boolean(businessData.paypalEnabled),
        paypal_client_id: businessData.paypalClientId,
        paypal_client_secret: businessData.paypalClientSecret,
        paypal_sandbox: Boolean(businessData.paypalSandbox),
      };

      const response = await fetch(`${API_BASE_URL}/api/business-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to save business settings");

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Business settings saved!",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } catch (error: any) {
      console.error("Save error:", error);
      Swal.fire({
        position: "top-end",
        title: "Error!",
        text: error.message || "Failed to save business settings",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    }
  };

  // Input handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setBusinessData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setBusinessData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleBusinessHoursChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setBusinessData((prev) => ({
      ...prev,
      businessHours: { ...prev.businessHours, [name]: value },
    }));
  };

  const toggleDayOpen = (dayIndex: number) => {
    setBusinessData((prev) => {
      const daysOpen = [...prev.businessHours.daysOpen];
      const index = daysOpen.indexOf(dayIndex);
      if (index === -1) daysOpen.push(dayIndex);
      else daysOpen.splice(index, 1);
      return {
        ...prev,
        businessHours: { ...prev.businessHours, daysOpen: daysOpen.sort() },
      };
    });
  };

  // Load settings on mount
  useEffect(() => {
    loadUserRoleAndSettings();
  }, []);

  const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
  ];

  const currencies = [
    { value: "USD", label: "US Dollar ($)" },
    { value: "KHR", label: "Cambodian Riel (៛)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "British Pound (£)" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Role Badge */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl flex items-center font-semibold text-black dark:text-white">
            <MdBusinessCenter className="mr-2" />
            {t.settingSession.businessSettings}
          </h2>
          <p className="text-gray-500 dark:text-gray-300">
            {userRole?.is_admin
              ? "Admin Business Settings - Configure global payment and business settings"
              : "Vendor Business Settings - Configure your personal payment and business preferences"
            }
          </p>
        </div>
        {userRole && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${userRole.is_admin
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            }`}>
            {userRole.is_admin ? "Administrator" : "Vendor"}
          </div>
        )}
      </div>

      {/* Business Information */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-black dark:text-white">
          <MdBusinessCenter className="text-blue-500 mr-2" />
          {t.settingSession.businessInformation}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settingSession.businessName}
            </label>
            <input
              type="text"
              name="businessName"
              value={businessData.businessName}
              onChange={handleInputChange}
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              placeholder="Your Business Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settingSession.taxID}
            </label>
            <input
              type="text"
              name="taxId"
              value={businessData.taxId}
              onChange={handleInputChange}
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              placeholder="Tax Identification Number"
            />
          </div>
        </div>
      </div>

      {/* Currency and Tax */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-black dark:text-white">
          <MdAttachMoney className="text-blue-500 mr-2" />
          {t.settingSession.currencyAndTax}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settingSession.currency}
            </label>
            <select
              name="currency"
              value={businessData.currency}
              onChange={handleInputChange}
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
              <FaPercentage className="mr-1" />
              {t.settingSession.taxRate}
            </label>
            <input
              type="number"
              name="taxRate"
              min="0"
              max="100"
              step="0.01"
              value={businessData.taxRate}
              onChange={handleInputChange}
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-black dark:text-white">
          <MdReceipt className="text-blue-500 mr-2" />
          {t.settingSession.invoiceSettings}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settingSession.invoicePrefix}
            </label>
            <input
              type="text"
              name="invoicePrefix"
              value={businessData.invoicePrefix}
              onChange={handleInputChange}
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              placeholder="e.g., INV-"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settingSession.startingInvoiceNumber}
            </label>
            <input
              type="number"
              name="invoiceStartingNumber"
              min="1"
              value={businessData.invoiceStartingNumber}
              onChange={handleInputChange}
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Inventory Management */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-black dark:text-white">
          <MdInventory className="text-blue-500 mr-2" />
          {t.settingSession.inventoryManagement}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              name="inventoryManagement"
              id="inventoryManagement"
              checked={businessData.inventoryManagement}
              onChange={handleCheckboxChange}
              className="absolute opacity-0 h-5 w-5 cursor-pointer"
            />
            <div
              className={`h-4 w-4 border rounded-sm flex items-center justify-center 
                   ${businessData.inventoryManagement
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-300"
                }`}
            >
              {businessData.inventoryManagement && (
                <MdOutlineDone className="text-white w-3 h-3" />
              )}
            </div>
            <label
              htmlFor="inventoryManagement"
              className="ml-2 text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {t.settingSession.enableInventory}
            </label>
          </div>
          {businessData.inventoryManagement && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settingSession.lowStockThreshold}
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                min="1"
                value={businessData.lowStockThreshold}
                onChange={handleInputChange}
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-black dark:text-white">
          <BsClockHistory className=" text-blue-500 mr-2" />
          {t.settingSession.businessHours}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settingSession.openTime}
            </label>
            <input
              type="time"
              name="open"
              value={businessData.businessHours.open}
              onChange={handleBusinessHoursChange}
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settingSession.closeTime}
            </label>
            <input
              type="time"
              name="close"
              value={businessData.businessHours.close}
              onChange={handleBusinessHoursChange}
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.settingSession.daysOpen}{" "}
            <span className="text-gray-400 text-xs">
              {t.settingSession.selectAllThatApply}
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              const allDayIds = daysOfWeek.map((day) => day.id);
              const shouldSelectAll =
                businessData.businessHours.daysOpen.length !==
                daysOfWeek.length;
              setBusinessData({
                ...businessData,
                businessHours: {
                  ...businessData.businessHours,
                  daysOpen: shouldSelectAll ? allDayIds : [],
                },
              });
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            {businessData.businessHours.daysOpen.length === daysOfWeek.length
              ? t.settingSession.deselectAll
              : t.settingSession.selectAll}
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {daysOfWeek.map((day) => (
              <div key={day.id} className="group relative">
                <input
                  type="checkbox"
                  id={`day-${day.id}`}
                  checked={businessData.businessHours.daysOpen.includes(day.id)}
                  onChange={() => toggleDayOpen(day.id)}
                  className="absolute opacity-0 h-0 w-0 peer"
                />
                <label
                  htmlFor={`day-${day.id}`}
                  className={`
            flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
            ${businessData.businessHours.daysOpen.includes(day.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200"
                      : "border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }
            peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2
          `}
                >
                  <span className="text-xs font-medium mb-1">
                    {day.name.substring(0, 3)}
                  </span>
                  <span className="text-sm font-semibold">{day.name}</span>
                  {businessData.businessHours.daysOpen.includes(day.id) && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-2 h-2 text-white "
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment & Integration Settings - For Both Admin and Vendors */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-6 flex items-center text-gray-800 dark:text-white">
          <MdPayment className="mr-3 text-blue-500 text-2xl" />
          {t.settingSession.paymentIntegration}
          <span className={`ml-2 text-xs px-2 py-1 rounded-full ${userRole?.is_admin
            ? "bg-blue-100 text-blue-800"
            : "bg-green-100 text-green-800"
            }`}>
            {userRole?.is_admin ? "Admin" : "Vendor"} Settings
          </span>
        </h3>

        {/* Vendor Notice */}
        {userRole?.is_vendor && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FiInfo className="text-blue-600 dark:text-blue-400 mr-3 text-lg" />
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  Vendor Payment Settings
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  Configure your personal payment integration settings. These settings will only affect your vendor account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Settings */}
        <div
          className={`mb-6 p-5 rounded-xl transition-all duration-300 ${businessData.stripeEnabled
            ? "border-2 border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10"
            : "border border-gray-200 dark:border-gray-500"
            }`}
        >
          <div className="flex items-center mb-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="stripeEnabled"
                id="stripeEnabled"
                checked={businessData.stripeEnabled}
                onChange={handleCheckboxChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.settingSession.enableStripe}
              </span>
            </label>
          </div>

          {businessData.stripeEnabled && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <RiKey2Line className="mr-1" />{" "}
                      {t.settingSession.publicKey}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="stripePublicKey"
                      value={businessData.stripePublicKey}
                      onChange={handleInputChange}
                      className="w-full text-sm border bg-white dark:bg-gray-700 focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/30 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 dark:text-white shadow-sm"
                      placeholder="pk_test_..."
                    />
                    <FiCopy className="absolute right-3 top-3 text-gray-400 hover:text-blue-500 cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <RiKey2Fill className="mr-1" />{" "}
                      {t.settingSession.secretKey}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="stripeSecretKey"
                      value={businessData.stripeSecretKey}
                      onChange={handleInputChange}
                      className="w-full text-sm border bg-white dark:bg-gray-700 focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/30 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 dark:text-white shadow-sm"
                      placeholder="sk_test_..."
                    />
                    <FiEye className="absolute right-3 top-3 text-gray-400 hover:text-blue-500 cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <FiLink className="mr-1" /> {t.settingSession.webHook}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="stripeWebhookSecret"
                      value={businessData.stripeWebhookSecret}
                      onChange={handleInputChange}
                      className="w-full text-sm border bg-white dark:bg-gray-700 focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/30 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 dark:text-white shadow-sm"
                      placeholder="whsec_..."
                    />
                    <FiEye className="absolute right-3 top-3 text-gray-400 hover:text-blue-500 cursor-pointer" />
                  </div>
                </div>
              </div>
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                <FiInfo className="mr-1" />
                <span>{t.settingSession.markStripeWebhook}</span>
              </div>
            </div>
          )}
        </div>

        {/* KHQR Settings */}
        <div
          className={`mb-6 p-5 rounded-xl transition-all duration-300 ${businessData.khqrEnabled
            ? "border-2 border-green-100 dark:border-green-900 bg-green-50/30 dark:bg-green-900/10"
            : "border border-gray-200 dark:border-gray-500"
            }`}
        >
          <div className="flex items-center mb-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="khqrEnabled"
                id="khqrEnabled"
                checked={businessData.khqrEnabled}
                onChange={handleCheckboxChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.settingSession.enableKhqr}
              </span>
            </label>
          </div>

          {businessData.khqrEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center">
                    <FiUser className="mr-1" /> {t.settingSession.merchantName}
                  </span>
                </label>
                <input
                  type="text"
                  name="khqrMerchantName"
                  value={businessData.khqrMerchantName}
                  onChange={handleInputChange}
                  className="w-full text-sm border bg-white dark:bg-gray-700 focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500/30 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 dark:text-white shadow-sm"
                  placeholder="Your Business Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center">
                    <FiCreditCard className="mr-1" />{" "}
                    {t.settingSession.merchantAccount}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="khqrMerchantAccount"
                    value={businessData.khqrMerchantAccount}
                    onChange={handleInputChange}
                    className="w-full text-sm border bg-white dark:bg-gray-700 focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500/30 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 dark:text-white shadow-sm"
                    placeholder="Bank account number"
                  />
                  <FiCopy className="absolute right-3 top-3 text-gray-400 hover:text-green-500 cursor-pointer" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PayPal Settings */}
        <div
          className={`p-5 rounded-xl transition-all duration-300 ${businessData.paypalEnabled
            ? "border-2 border-yellow-100 dark:border-yellow-900 bg-yellow-50/30 dark:bg-yellow-900/10"
            : "border border-gray-200 dark:border-gray-500"
            }`}
        >
          <div className="flex items-center mb-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="paypalEnabled"
                id="paypalEnabled"
                checked={businessData.paypalEnabled}
                onChange={handleCheckboxChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable PayPal Payments
              </span>
            </label>
          </div>

          {businessData.paypalEnabled && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <RiPaypalFill className="mr-1 text-blue-500" /> Client ID
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="paypalClientId"
                      value={businessData.paypalClientId}
                      onChange={handleInputChange}
                      className="w-full text-sm border bg-white dark:bg-gray-700 focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500/30 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 dark:text-white shadow-sm"
                      placeholder="AeA..."
                    />
                    <FiCopy className="absolute right-3 top-3 text-gray-400 hover:text-yellow-500 cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <RiPaypalFill className="mr-1 text-blue-500" /> Client
                      Secret
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="paypalClientSecret"
                      value={businessData.paypalClientSecret}
                      onChange={handleInputChange}
                      className="w-full text-sm border bg-white dark:bg-gray-700 focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500/30 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 dark:text-white shadow-sm"
                      placeholder="EC..."
                    />
                    <FiEye className="absolute right-3 top-3 text-gray-400 hover:text-yellow-500 cursor-pointer" />
                  </div>
                </div>
              </div>
              <div className="flex items-center mt-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="paypalSandbox"
                    id="paypalSandbox"
                    checked={businessData.paypalSandbox}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Use PayPal Sandbox (Testing Environment)
                  </span>
                </label>
              </div>
              {businessData.paypalSandbox && (
                <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
                  <FiAlertTriangle className="mr-1" />
                  <span>
                    Sandbox mode is active - no real transactions will be
                    processed
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveBusinessSettings}
          className="bg-black text-white flex items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          <MdSaveAs className="mr-2" />
          Save Business Settings
        </button>
      </div>
    </div>
  );
}