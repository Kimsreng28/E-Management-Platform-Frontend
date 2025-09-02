"use client";

import { API_BASE_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/utils/useTranslations";
import Echo from "laravel-echo";
import { Bell, Check, Trash2 } from "lucide-react";
import Pusher from "pusher-js";
import { useEffect, useState } from "react";

let echo: Echo<any> | null = null;

interface Notification {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    order_id?: string;
    payment_id?: string;
    product_id?: string;
    product_name?: string;
    product_sku?: string;
    current_stock?: number;
    threshold?: number;
    status?: string;
    total?: string;
    method?: string;
  };
  read_at: string | null;
  created_at: string;
}

export default function NotificationBell({
  language,
}: {
  language: "en" | "kh";
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations(language);

 useEffect(() => {
  console.log("[NotificationBell] useEffect triggered");

  fetchNotifications();

  const token = localStorage.getItem("token");
  console.log("[NotificationBell] token from localStorage:", token);
  if (!token) return;

  const userId = getUserId();
  console.log("[NotificationBell] userId:", userId);
  if (!userId) return;

  (window as any).Pusher = Pusher;

  echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST!,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT!),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT!),
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  });

  console.log("[NotificationBell] Echo instance created:", echo);

  const channel = echo.private(`user.notifications.${userId}`);
  console.log("[NotificationBell] Joined channel:", channel);

  // Listen to event
  channel.listen(".NotificationCreated", (payload: any) => {
    console.log("[NotificationBell] Realtime Notification Received:", payload);

    const notification: Notification = {
        id: payload.id,
        type: payload.type,
        data: typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data,
        read_at: payload.read_at,
        created_at: payload.created_at,
      };


    console.log("[NotificationBell] Parsed notification:", notification);

    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read_at) {
      setUnreadCount((prev) => prev + 1);
    }
  });

  // Log connection state every 2 seconds
  // const interval = setInterval(() => {
  //   console.log("[NotificationBell] Echo connection state:", echo?.connector.pusher.connection.state);
  // }, 2000);

  return () => {
    // clearInterval(interval);
    echo?.leave(`user.notifications.${userId}`);
    echo = null;
  };

}, []);


  const getUserId = () => {
    const user = localStorage.getItem("user");
    if (!user) return "guest";
    return JSON.parse(user).id;
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("[API] No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[API] Notifications fetched:", data);
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read_at).length);
      } else {
        console.error("[API] Failed to fetch notifications:", response.status);
      }
    } catch (error) {
      console.error("[API] Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${id}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        console.error("Failed to mark notification as read:", response.status);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read_at);
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        console.error("Failed to delete notification:", response.status);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_created":
      case "order_created_admin":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 48 48"
          >
            <g fill="none" stroke-width="3">
              <path
                fill="#fff"
                d="M3.007 11.873C2.9 13.577 4.268 15 5.975 15h36.052c1.707 0 3.074-1.423 2.968-3.127q-.091-1.472-.187-2.617c-.212-2.555-2.173-4.506-4.729-4.711C36.801 4.28 31.542 4 24.001 4c-7.542 0-12.8.28-16.078.545C5.367 4.75 3.406 6.7 3.194 9.256q-.096 1.144-.187 2.617"
              />
              <path
                fill="#8fbffa"
                d="M42 15v11c0 5.868-.205 10.096-.414 12.885c-.192 2.557-2.144 4.509-4.701 4.7c-2.789.21-7.017.415-12.885.415s-10.096-.205-12.885-.414c-2.557-.192-4.509-2.144-4.7-4.701C6.204 36.096 6 31.868 6 26V15z"
              />
              <path
                fill="#fff"
                d="M15.013 24.585c.065 1.434 1.3 2.316 2.735 2.35C19.142 26.97 21.197 27 24 27s4.858-.031 6.252-.064c1.435-.035 2.67-.916 2.735-2.35a13 13 0 0 0 0-1.171c-.065-1.434-1.3-2.316-2.735-2.35A265 265 0 0 0 24 21c-2.803 0-4.858.031-6.252.064c-1.435.035-2.67.916-2.735 2.35a13 13 0 0 0 0 1.171"
              />
              <path
                stroke="#2859c5"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.006 11.873C2.901 13.577 4.268 15 5.976 15h36.05c1.708 0 3.075-1.423 2.97-3.127q-.094-1.472-.189-2.617c-.21-2.555-2.173-4.506-4.728-4.711C36.801 4.28 31.542 4 24.001 4c-7.542 0-12.8.28-16.079.545C5.367 4.75 3.405 6.7 3.194 9.256q-.096 1.144-.188 2.617M6 15v11c0 5.868.205 10.096.414 12.885c.192 2.557 2.144 4.509 4.701 4.7c2.789.21 7.017.415 12.885.415s10.096-.205 12.885-.414c2.557-.192 4.509-2.144 4.7-4.701c.21-2.789.415-7.017.415-12.885V15"
              />
              <path
                stroke="#2859c5"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.013 24.585c.065 1.434 1.3 2.316 2.735 2.35C19.142 26.97 21.197 27 24 27s4.858-.031 6.252-.064c1.435-.035 2.67-.916 2.735-2.35a13 13 0 0 0 0-1.171c-.065-1.434-1.3-2.316-2.735-2.35A265 265 0 0 0 24 21c-2.803 0-4.858.031-6.252.064c-1.435.035-2.67.916-2.735 2.35a13 13 0 0 0 0 1.171"
              />
            </g>
          </svg>
        );
      case "payment_created":
      case "payment_created_admin":
      case "payment_status":
      case "payment_status_admin":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 "
            viewBox="0 0 14 14"
          >
            <g fill="none">
              <path
                fill="#8fbffa"
                d="M0 5v5.75a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V5z"
              />
              <path
                fill="#2859c5"
                fill-rule="evenodd"
                d="M1.5 1.75A1.5 1.5 0 0 0 0 3.25V5h14V3.25a1.5 1.5 0 0 0-1.5-1.5zm8 6.875a.625.625 0 1 0 0 1.25H11a.625.625 0 1 0 0-1.25z"
                clip-rule="evenodd"
              />
            </g>
          </svg>
        );
      case "low_stock":
      case "out_of_stock":
      case "stock_alert":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 48 48"
          >
            <g fill="none" stroke-width="3">
              <path
                fill="#8fbffa"
                d="M4.207 20.68c-1.678 1.938-1.678 4.702 0 6.64c1.698 1.962 4.28 4.793 7.98 8.492s6.53 6.283 8.493 7.98c1.938 1.679 4.702 1.679 6.64 0c1.962-1.697 4.793-4.28 8.492-7.98s6.283-6.53 7.98-8.491c1.679-1.939 1.679-4.703 0-6.642c-1.697-1.961-4.28-4.792-7.98-8.491c-3.7-3.7-6.53-6.283-8.491-7.98c-1.939-1.679-4.703-1.679-6.642 0c-1.961 1.697-4.792 4.28-8.491 7.98c-3.7 3.7-6.283 6.53-7.98 8.492Z"
              />
              <path
                fill="#fff"
                d="M20.5 33.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0m-.36-19.363c-.093-1.296.489-2.571 1.75-2.888A8.6 8.6 0 0 1 24 11c.834 0 1.538.105 2.111.249c1.26.317 1.842 1.592 1.75 2.888c-.19 2.696-.555 7.379-.949 10.003c-.13.865-.65 1.609-1.512 1.754c-.369.063-.83.106-1.4.106s-1.031-.044-1.4-.106c-.862-.145-1.383-.889-1.512-1.754c-.394-2.624-.758-7.307-.949-10.003Z"
              />
              <path
                stroke="#2859c5"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.207 20.68c-1.678 1.938-1.678 4.702 0 6.64c1.698 1.962 4.28 4.793 7.98 8.493s6.53 6.282 8.492 7.98c1.939 1.678 4.703 1.678 6.641 0c1.962-1.698 4.793-4.28 8.492-7.98s6.282-6.53 7.98-8.492c1.679-1.939 1.679-4.703 0-6.641c-1.698-1.962-4.28-4.793-7.98-8.492s-6.53-6.282-8.492-7.98c-1.938-1.679-4.702-1.679-6.64 0c-1.962 1.698-4.793 4.28-8.493 7.98s-6.282 6.53-7.98 8.492"
              />
              <path
                stroke="#2859c5"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M20.14 14.137c-.093-1.296.489-2.571 1.75-2.888A8.6 8.6 0 0 1 24 11c.834 0 1.538.105 2.111.249c1.26.317 1.842 1.592 1.75 2.888c-.19 2.696-.555 7.379-.949 10.003c-.13.865-.65 1.609-1.512 1.754c-.369.063-.83.106-1.4.106s-1.031-.044-1.4-.106c-.862-.145-1.383-.889-1.512-1.754c-.394-2.624-.758-7.307-.949-10.003ZM20.5 33.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"
              />
            </g>
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 "
            viewBox="0 0 14 14"
          >
            <g fill="none">
              <path
                stroke="#4147d5"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5.677 12.458a1.5 1.5 0 0 0 2.646 0"
                stroke-width="1"
              />
              <path
                fill="#d7e0ff"
                d="M4.262 1.884a3.872 3.872 0 0 1 6.61 2.738c0 .604.1 1.171.25 1.752q.063.198.137.373c.232.545.871.732 1.348 1.084c.711.527.574 1.654-.018 2.092c0 0-.955.827-5.589.827s-5.589-.827-5.589-.827c-.592-.438-.73-1.565-.018-2.092c.477-.352 1.116-.539 1.348-1.084c.231-.544.387-1.24.387-2.125c0-1.027.408-2.012 1.134-2.738"
              />
              <path
                stroke="#4147d5"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.262 1.884a3.872 3.872 0 0 1 6.61 2.738c0 .604.1 1.171.25 1.752q.063.198.137.373c.232.545.871.732 1.348 1.084c.711.527.574 1.654-.018 2.092c0 0-.955.827-5.589.827s-5.589-.827-5.589-.827c-.592-.438-.73-1.565-.018-2.092c.477-.352 1.116-.539 1.348-1.084c.231-.544.387-1.24.387-2.125c0-1.027.408-2.012 1.134-2.738"
                stroke-width="1"
              />
            </g>
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      if (diffInMinutes < 1) {
        return language === "en" ? "Just now" : "ទើបតែ";
      }
      return language === "en"
        ? `${diffInMinutes}m ago`
        : `${diffInMinutes}នាទីមុន`;
    } else if (diffInHours < 24) {
      return language === "en"
        ? `${diffInHours}h ago`
        : `${diffInHours}ម៉ោងមុន`;
    } else {
      return date.toLocaleDateString(language === "en" ? "en-US" : "km-KH", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer flex items-center justify-center p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 h-10 w-10"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {language === "en" ? "Notifications" : "ការជូនដំណឹង"}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
              >
                {language === "en"
                  ? "Mark all as read"
                  : "សម្គាល់ទាំងអស់ថាបានអាន"}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {language === "en" ? "Loading..." : "កំពុងផ្ទុក..."}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {language === "en" ? "No notifications" : "គ្មានការជូនដំណឹង"}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors",
                      !notification.read_at && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </span>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {notification.data.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                          {notification.data.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        {!notification.read_at && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900 rounded"
                            title={
                              language === "en"
                                ? "Mark as read"
                                : "សម្គាល់ថាបានអាន"
                            }
                          >
                            <Check size={14} className="text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-red-100 cursor-pointer dark:hover:bg-red-900 rounded"
                          title={language === "en" ? "Delete" : "លុប"}
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
