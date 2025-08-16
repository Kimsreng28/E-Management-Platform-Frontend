"use client";
import { API_BASE_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Swal from "sweetalert2";

export default function TelegramCallbackPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const router = useRouter();

  useEffect(() => {
    const processTelegramAuth = async () => {
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: "#fff",
        customClass: {
          popup: "swal2-sm-toast",
        },
        didOpen: (toast) => {
          toast.style.fontSize = "0.85rem";
          toast.style.fontFamily = "Inria Sans, sans-serif";
          toast.style.minWidth = "200px";
          toast.style.padding = "8px 12px";
          toast.style.borderRadius = "10px";
          toast.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
          toast.style.opacity = "0";
          toast.animate([{ opacity: "0" }, { opacity: "1" }], {
            duration: 300,
            fill: "forwards",
          });
        },
        willClose: (toast) => {
          toast.animate([{ opacity: "1" }, { opacity: "0" }], {
            duration: 300,
            fill: "forwards",
          });
        },
      });

      try {
        const hash = window.location.hash.substring(1);
        const urlParams = new URLSearchParams(hash);
        const tgAuthResult = urlParams.get("tgAuthResult");

        if (!tgAuthResult) throw new Error("Missing tgAuthResult in URL");

        // Base64-decode and parse JSON
        let decoded: Record<string, any>;
        try {
          decoded = JSON.parse(atob(tgAuthResult));
        } catch {
          throw new Error("Invalid Base64 JSON data received from Telegram");
        }

        // Convert all values to strings
        const telegramData: Record<string, string> = {};
        Object.keys(decoded).forEach((key) => {
          telegramData[key] = String(decoded[key]);
        });

        // Send decoded object to backend
        const response = await fetch(
          `${API_BASE_URL}/api/auth/telegram/spa-login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(telegramData),
          }
        );

        const text = await response.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "Invalid response from server. Possibly an HTML error page."
          );
        }

        if (!response.ok || data.status !== "success") {
          throw new Error(data.message || "Authentication failed");
        }

        // Save auth token and user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        await Toast.fire({
          icon: "success",
          title: "Login Successful",
        });

        router.push(`/${locale}/customer`);
      } catch (error: any) {
        console.error("Authentication Error:", error);

        await Toast.fire({
          icon: "error",
          title: "Login Failed",
          text: error.message || "Unknown error occurred",
        });

        router.push(`/${locale}/auth/login`);
      }
    };

    processTelegramAuth();
  }, [locale, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600">Authenticating with Telegram...</p>
    </div>
  );
}
