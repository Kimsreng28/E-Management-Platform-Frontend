"use client";

import { useState } from "react";
import { FaEarthAsia } from "react-icons/fa6";

export default function GeneralSettings() {
  const [siteName, setSiteName] = useState("EMP Platform");
  const [siteDescription, setSiteDescription] = useState(
    "Electronics Management Platform for electrical measurement equipment"
  );
  const [contactEmail, setContactEmail] = useState("info@emp-platform.com");
  const [contactPhone, setContactPhone] = useState("+855 12 345 678");
  const [businessAddress, setBusinessAddress] = useState(
    "123 Electronics Street, Phnom Penh, Cambodia"
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl flex items-center font-semibold">
          <FaEarthAsia className="mr-2" /> General Settings
        </h2>
        <p className="text-gray-500 dark:text-gray-300">
          Basic information about your platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Site Name</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Contact Email
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Site Description
          </label>
          <textarea
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Contact Phone
          </label>
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Business Address
          </label>
          <input
            type="text"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>
      </div>
    </div>
  );
}
