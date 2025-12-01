"use client";
import { getToken } from "@/lib/api/auth";
import { API_BASE_URL } from "@/lib/config";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "admin" | "customer" | "vendor" | "delivery";
}) {
  const router = useRouter();
  const token = getToken();
  const pathname = usePathname();

  // get current locale from url
  const currentLocale = pathname.split("/")[1] || "en";

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    // Verify token and check role
    const verify = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Invalid token");
        }

        const user = await response.json();
        const isAdmin = user.role_id === 1;
        const isCustomer = user.role_id === 2;
        const isVendor = user.role_id === 4;
        const isDelivery = user.role_id === 5;

        let hasAccess = false;

        // Check if user has access to the requested role
        switch (role) {
          case "admin":
            hasAccess = isAdmin;
            break;
          case "customer":
            hasAccess = isCustomer;
            break;
          case "vendor":
            hasAccess = isVendor;
            break;
          case "delivery":
            hasAccess = isDelivery;
            break;
        }

        if (!hasAccess) {
          // Redirect to appropriate page based on user's actual role
          if (isAdmin || isVendor || isDelivery) {
            router.push(`/${currentLocale}/dashboard`);
          } else if (isCustomer) {
            router.push(`/${currentLocale}/customer`);
          } else {
            router.push("/login");
          }
        }
      } catch (error) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    verify();
  }, [token, router, role, currentLocale]);

  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200"></div>
      </div>
    );
  }

  return <>{children}</>;
}