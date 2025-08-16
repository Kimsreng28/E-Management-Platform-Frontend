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
  role: "admin" | "customer";
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

        if (
          (role === "admin" && !isAdmin) ||
          (role === "customer" && !isCustomer)
        ) {
          router.push(
            isAdmin
              ? `/${currentLocale}/dashboard`
              : `/${currentLocale}/customer`
          );
        }
      } catch (error) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    verify();
  }, [token, router, role]);

  if (!token) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
}
