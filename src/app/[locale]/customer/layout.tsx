"use client";

import { CustomerNavbar } from "@/components/ui/customer/CustomerNavbar";
import Footer from "@/components/ui/customer/Footer";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { Inria_Sans, Kantumruy_Pro } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inriaSans = Inria_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inria-sans",
});

const kantumruyPro = Kantumruy_Pro({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-kantumruy-pro",
});

export default function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<"en" | "kh">("en");

  // Extract language from pathname or localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    const pathSegments = pathname.split("/");
    const pathLang =
      pathSegments[1] === "en" || pathSegments[1] === "kh"
        ? pathSegments[1]
        : null;

    const newLang = pathLang || savedLang || "en";
    setLanguage(newLang as "en" | "kh");

    // Update document language attribute
    document.documentElement.lang = newLang;
  }, [pathname]);

  const handleLanguageChange = (newLanguage: "en" | "kh") => {
    localStorage.setItem("language", newLanguage);
    setLanguage(newLanguage);

    // Update URL while preserving the rest of the path
    const newPath =
      pathname.replace(/^\/(en|kh)/, `/${newLanguage}`) ||
      `/${newLanguage}/customer`;
    router.push(newPath);
  };

  // Loading overlay for page transitions
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div
      className={`${inriaSans.variable} ${kantumruyPro.variable} font-combo relative`}
    >
      <CustomerNavbar
        language={language}
        onLanguageChange={handleLanguageChange}
      />
      <LoadingOverlay show={loading} />
      <main
        className={`antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 min-h-[calc(100vh-60px)] transition-opacity duration-500 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </main>
      <Footer language={language} />
    </div>
  );
}
