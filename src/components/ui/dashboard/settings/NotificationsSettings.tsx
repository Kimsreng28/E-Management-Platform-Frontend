"use client";

import { useState } from "react";

export default function NotificationsSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Notification Settings</h2>
        <p className="text-gray-500 dark:text-gray-300">
          Manage how you receive notifications from the platform
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Email Notifications</label>
            <p className="text-gray-500 text-sm dark:text-gray-400">
              Receive notifications via email
            </p>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={() => setEmailNotifications(!emailNotifications)}
            className="h-5 w-5 text-black dark:text-white"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">SMS Notifications</label>
            <p className="text-gray-500 text-sm dark:text-gray-400">
              Receive notifications via SMS
            </p>
          </div>
          <input
            type="checkbox"
            checked={smsNotifications}
            onChange={() => setSmsNotifications(!smsNotifications)}
            className="h-5 w-5 text-black dark:text-white"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Push Notifications</label>
            <p className="text-gray-500 text-sm dark:text-gray-400">
              Receive push notifications on your device
            </p>
          </div>
          <input
            type="checkbox"
            checked={pushNotifications}
            onChange={() => setPushNotifications(!pushNotifications)}
            className="h-5 w-5 text-black dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}
