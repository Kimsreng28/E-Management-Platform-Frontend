"use client";

import { getToken } from "@/lib/api/auth";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { GrShieldSecurity } from "react-icons/gr";
import { MdDevices, MdOutlineChangeCircle, MdPassword } from "react-icons/md";
import { RiLogoutCircleLine, RiShieldCheckLine } from "react-icons/ri";
import Swal from "sweetalert2";

type ActiveSession = {
  id: string;
  device: string;
  browser: string;
  ip_address: string;
  last_activity: string;
  is_current: boolean;
};

interface Props {
  currentLanguage: "en" | "kh";
}

export default function SecuritySettings({ currentLanguage }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const t = useTranslations(currentLanguage);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/security/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: confirmPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      Swal.fire({
        position: "top-right",
        title: "Success!",
        text: "Password changed successfully",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Swal.fire({
        position: "top-right",
        title: "Error!",
        text: error.message || "Failed to change password",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleTwoFactor = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/security/two-factor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enable: !twoFactorEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update two-factor authentication");
      }

      setTwoFactorEnabled(!twoFactorEnabled);
      Swal.fire({
        position: "top-right",
        title: "Success!",
        text: `Two-factor authentication ${
          !twoFactorEnabled ? "enabled" : "disabled"
        }`,
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } catch (error: any) {
      Swal.fire({
        position: "top-right",
        title: "Error!",
        text: error.message || "Failed to update two-factor authentication",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/security/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke session");
      }

      setActiveSessions(
        activeSessions.filter((session) => session.id !== sessionId)
      );
      Swal.fire({
        position: "top-right",
        title: "Success!",
        text: "Session revoked successfully",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } catch (error: any) {
      Swal.fire({
        position: "top-right",
        title: "Error!",
        text: error.message || "Failed to revoke session",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    }
  };

  // Load active sessions on component mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/security/sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setActiveSessions(data.sessions);
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

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
        <h2 className="text-xl flex items-center font-semibold text-black dark:text-white">
          <GrShieldSecurity className="mr-2" />
          {t.settingSession.securitySettings}
        </h2>
        <p className="text-gray-500 dark:text-gray-300">
          {t.settingSession.securitySettingsDescription}
        </p>
      </div>

      {/* Change Password Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <MdPassword className="text-xl text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t.settingSession.changePassword}
          </h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.settingSession.currentPassword}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
              placeholder={t.settingSession.enterYourCurrentPassword}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.settingSession.newPassword}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
                minLength={8}
                placeholder={t.settingSession.enterNewPassword}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.settingSession.confirmNewPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
                minLength={8}
                placeholder={t.settingSession.confirmNewPassword}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="bg-black text-white flex items-center justify-center px-6 py-3 rounded-xl hover:bg-gray-900 transition duration-300 w-full md:w-auto"
          >
            <MdOutlineChangeCircle className="mr-2 text-lg" />
            {isChangingPassword
              ? t.settingSession.changingPassword
              : t.settingSession.changePassword}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <RiShieldCheckLine className="text-xl text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t.settingSession.twoFactor}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t.settingSession.twoFactorDescription}
              </p>
            </div>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onChange={toggleTwoFactor}
            className={`${
              twoFactorEnabled ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"
            } relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ease-in-out`}
          >
            <span
              className={`${
                twoFactorEnabled ? "translate-x-6" : "translate-x-1"
              } inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 ease-in-out`}
            />
          </Switch>
        </div>

        {twoFactorEnabled && (
          <div className="mt-5 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
            <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
              <RiShieldCheckLine className="mr-2 text-base" />
              Two-factor authentication is currently enabled for your account.
            </p>
          </div>
        )}
      </div>

      {/* Active Sessions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <MdDevices className="text-xl text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t.settingSession.activeSessions}
          </h2>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t.settingSession.activeSessionsDescription}
        </p>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activeSessions.length > 0 ? (
            activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 transition-all hover:bg-gray-100 dark:hover:bg-gray-800/70"
              >
                <div className="flex-1 mb-3 md:mb-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {session.device}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {session.browser} • {session.ip_address}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Last active: {session.last_activity}
                  </p>
                </div>

                {session.is_current ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 self-start md:self-auto">
                    Current Session
                  </span>
                ) : (
                  <button
                    onClick={() => revokeSession(session.id)}
                    className="flex items-center text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors self-start md:self-auto"
                  >
                    <RiLogoutCircleLine className="mr-1" />
                    Revoke
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MdDevices className="text-4xl mx-auto mb-3 opacity-50" />
              <p>No active sessions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
