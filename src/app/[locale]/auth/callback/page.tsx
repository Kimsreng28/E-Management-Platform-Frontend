"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Swal from "sweetalert2";

export default function AuthCallbackPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params; // "en" or "kh"
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Save token
      localStorage.setItem("token", token);

      Swal.fire({
        icon: "success",
        title: "Login successful!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });

      // Redirect to the customer page
      router.replace(`/${locale}/customer`);
    } else {
      Swal.fire({
        icon: "error",
        title: "Login failed",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });

      router.replace(`/${locale}/auth/login`);
    }
  }, [searchParams, router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  );
}
