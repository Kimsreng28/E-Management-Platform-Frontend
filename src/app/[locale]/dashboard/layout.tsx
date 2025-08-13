"use client";

import UserDropdown from "@/components/ui/dashboard/UserDropdown";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { navItems } from "@/data/navItems";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // ✅ Unwrap params because in Next.js 15 params is now a Promise
  const { locale } = use(params);

  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Now using the unwrapped locale value
  const localizedNavItems = navItems.map((item) => ({
    ...item,
    href: `/${locale}${item.href}`,
  }));

  const handleNavClick = (href: string) => {
    if (pathname !== href) {
      setIsLoading(true);
      router.push(href);
    }
  };

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen font-inria-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#F9F9F9] text-black flex flex-col">
        <div className="flex items-center justify-between p-6 font-['Inria_Sans']">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="EMP Admin" className="h-12 w-12" />
            <span className="text-lg font-bold">EMP Admin</span>
          </div>

          {/* Notification bell icon */}
          <div className="relative cursor-pointer bg-white w-8 h-8 flex items-center justify-center rounded-lg shadow-sm hover:shadow-md transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
                d="M9.107 2.674A6.5 6.5 0 0 1 12 2c3.727 0 6.75 3.136 6.75 7.005v.705a4.4 4.4 0 0 0 .692 2.375l1.108 1.724c1.011 1.575.239 3.716-1.52 4.214a25.8 25.8 0 0 1-14.06 0c-1.759-.498-2.531-2.639-1.52-4.213l1.108-1.725A4.4 4.4 0 0 0 5.25 9.71v-.705c0-1.074.233-2.092.65-3.002M7.5 19c.655 1.748 2.422 3 4.5 3q.367 0 .72-.05M16.5 19a4.5 4.5 0 0 1-1.302 1.84"
              />
            </svg>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {localizedNavItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "flex items-center gap-3 w-full text-left bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-900 hover:text-white transition",
                pathname === item.href && "bg-gray-900 text-white"
              )}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-gray-100 flex flex-col">
        <header className="flex items-center justify-between bg-[#F9F9F9] px-6 py-4 shadow">
          <div className="flex-1 max-w-lg mx-8 relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-6 h-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            >
              <path d="m21 21-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314" />
            </svg>

            <input
              type="search"
              placeholder="Search products, orders, customers..."
              className="w-full rounded-lg border border-gray-300 px-10 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <UserDropdown />
          </div>
        </header>

        {/* Page content with loading overlay */}
        <main className="relative p-6 flex-1">
          <LoadingOverlay show={isLoading} />
          {children}
        </main>
      </div>
    </div>
  );
}
