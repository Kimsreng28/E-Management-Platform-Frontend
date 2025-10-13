"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import RecentOrders from "@/components/ui/dashboard/RecentOrders";
import StatCard from "@/components/ui/dashboard/StatCard";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

interface DashboardStats {
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  revenueChange: number;
  currentMonthOrders: number;
  lastMonthOrders: number;
  orderChange: number;
  totalProducts: number;
  lastMonthProducts: number;
  productsChange: number;
  currentHourActive: number;
  previousHourActive: number;
  activeCustomerChange: number;
  totalCustomers: number;
  recentOrders: Order[];
}

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: string;
}

export interface LowStockItem {
  id: number;
  name: string;
  stock: number;
  low_stock_threshold: number;
  status: "low" | "ok";
  suggested_restock: number;
}

export default function DashboardPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);

  const pathname = usePathname();
  const router = useRouter();

  const unwrappedParams = use(params);
  const language = unwrappedParams.locale || "en";
  const currentLocale = pathname.split("/")[1] || "en";
  const t = useTranslations(language);

  // fetch stats
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/dashboard/recent-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      setStats({
        currentMonthRevenue: statsData.revenue.current_month,
        lastMonthRevenue: statsData.revenue.last_month,
        revenueChange: statsData.revenue.change,
        currentMonthOrders: statsData.orders.current_month,
        lastMonthOrders: statsData.orders.last_month,
        orderChange: statsData.orders.change,
        totalProducts: statsData.products.total,
        lastMonthProducts: statsData.products.last_month,
        productsChange: statsData.products.change,
        currentHourActive: statsData.active_customers.current_hour,
        previousHourActive: statsData.active_customers.previous_hour,
        activeCustomerChange: statsData.active_customers.change,
        totalCustomers: statsData.customers.total,
        recentOrders: ordersData.orders.map((order: any) => ({
          id: order.id,
          customer: order.customer,
          product: order.product,
          amount: order.amount,
          status: order.status,
        })),
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch low stock api
  const fetchLowStock = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/dashboard/low-stock`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setLowStock(data);
    } catch (error) {
      console.error("Failed to fetch low stock", error);
    }
  };

  const handleRestock = async (id: number, quantity: number) => {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE_URL}/api/dashboard/restock`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product_id: id, quantity }),
    });
    fetchLowStock();
  };

  const handleAddProduct = () => {
    router.push(`/${currentLocale}/dashboard/products/new/product`);
  };

  const handleViewOrders = () => {
    router.push(`/${currentLocale}/dashboard/orders`);
  };

  const handleManageCustomers = () => {
    router.push(`/${currentLocale}/dashboard/customers`);
  };

  const handleViewReports = () => {
    router.push(`/${currentLocale}/dashboard/reports`);
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchLowStock();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute role="admin">
      <div className="space-y-1 px-1 sm:px-6 lg:px-1 lg:py-1 sm:space-y-6 md:px-6 sm:py-6">
        {/* State Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title={t.dashboardPage.totalRevenue}
            value={`$${stats?.currentMonthRevenue?.toString() || "0"}`}
            change={`${stats?.revenueChange?.toString() || "0"
              } ${t.dashboardPage.fromLastMonth}`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10"
                viewBox="0 0 24 24"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.5"
                >
                  <path d="M12 6v12m3-8.5C15 8.12 13.657 7 12 7S9 8.12 9 9.5s1.343 2.5 3 2.5s3 1.12 3 2.5s-1.343 2.5-3 2.5s-3-1.12-3-2.5" />
                  <path d="M7 3.338A9.95 9.95 0 0 1 12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.338-5" />
                </g>
              </svg>
            }
            gradientFrom="from-[#5d30b6]"
            gradientTo="to-[#5752cf]"
          />
          <StatCard
            title={t.dashboardPage.orders}
            value={`+${stats?.currentMonthOrders?.toString() || "0"}`}
            change={
              stats
                ? `${stats.orderChange > 0 ? '+' : ''}${stats.orderChange} ${t.dashboardPage.fromLastMonth}`
                : `0 ${t.dashboardPage.fromLastMonth}`
            }
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10"
                viewBox="0 0 24 24"
              >
                <g fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M7.5 18a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Zm9 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z" />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m11 10.8l1.143 1.2L15 9"
                  />
                  <path
                    stroke-linecap="round"
                    d="m2 3l.261.092c1.302.457 1.953.686 2.325 1.231s.372 1.268.372 2.715V9.76c0 2.942.063 3.912.93 4.826c.866.914 2.26.914 5.05.914H12m4.24 0c1.561 0 2.342 0 2.894-.45c.551-.45.709-1.214 1.024-2.743l.5-2.424c.347-1.74.52-2.609.076-3.186c-.443-.577-1.96-.577-3.645-.577h-6.065m-6.066 0H7"
                  />
                </g>
              </svg>
            }
            gradientFrom="from-[#2563eb]"
            gradientTo="to-[#06b6d4]"
          />
          <StatCard
            title={t.dashboardPage.products}
            value={stats?.totalProducts?.toString() || "0"}
            change={`+${stats?.productsChange?.toString() || "0"
              } ${t.dashboardPage.fromLastMonth}`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.5"
                  d="M21.984 10c-.037-1.311-.161-2.147-.581-2.86c-.598-1.015-1.674-1.58-3.825-2.708l-2-1.05C13.822 2.461 12.944 2 12 2s-1.822.46-3.578 1.382l-2 1.05C4.271 5.56 3.195 6.125 2.597 7.14C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709l2 1.049C10.178 21.539 11.056 22 12 22s1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.42-.713.544-1.549.581-2.86M21 7.5l-4 2M12 12L3 7.5m9 4.5v9.5m0-9.5l4.5-2.25l.5-.25m0 0V13m0-3.5l-9.5-5"
                />
              </svg>
            }
            gradientFrom="from-[#ec4899]"
            gradientTo="to-[#f97316]"
          />
          <StatCard
            title={t.dashboardPage.activeCustomers}
            value={`+${stats?.currentHourActive?.toString() || "0"}`}
            change={`+${stats?.activeCustomerChange?.toString() || "0"
              } ${t.dashboardPage.sinceLastHour}`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2m1-17.87a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85"
                />
              </svg>
            }
            gradientFrom="from-[#22c55e]"
            gradientTo="to-[#0d9488]"
          />
        </div>

        {/* Recent Orders & Low Stock */}
        <div>
          {/* Orders */}
          {stats?.recentOrders && (
            <RecentOrders orders={stats.recentOrders} params={{ locale: language }} />
          )}

          {/* Low Stock */}
          {/* <LowStockAlert onRestock={handleRestock} lowStock={lowStock} /> */}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-4 w-full border border-gray-200">
          <h2 className="text-lg font-semibold">{t.dashboardPage.quickActions}</h2>
          <p className="text-sm text-gray-600 mb-2">
            {t.dashboardPage.commonShortcuts}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
            {/* Button Add Product */}
            <button
              type="button"
              onClick={handleAddProduct}
              className="text-primary cursor-pointer transition hover:bg-gray-900 flex items-center justify-center w-full  text-sm font-semibold bg-black text-white py-2 px-4 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.5"
                  d="M15 12h-3m0 0H9m3 0V9m0 3v3M7 3.338A9.95 9.95 0 0 1 12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.338-5"
                />
              </svg>
              {t.dashboardPage.addProduct}
            </button>

            {/* Button View Orders */}
            <button
              type="button"
              onClick={handleViewOrders}
              className="text-primary cursor-pointer transition border border-gray-300 hover:bg-gray-300 flex items-center justify-center w-full  text-sm font-semibold bg-gray-200 text-black py-2 px-4 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                viewBox="0 0 24 24"
              >
                <g fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M7.5 18a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Zm9 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z" />
                  <path
                    stroke-linecap="round"
                    d="M11 9H8M2 3l.265.088c1.32.44 1.98.66 2.357 1.184S5 5.492 5 6.883V9.5c0 2.828 0 4.243.879 5.121c.878.879 2.293.879 5.121.879h2m6 0h-2"
                  />
                  <path
                    stroke-linecap="round"
                    d="M5 6h3m-2.5 7h10.522c.96 0 1.439 0 1.815-.248s.564-.688.942-1.57l.429-1c.81-1.89 1.214-2.833.77-3.508C19.533 6 18.505 6 16.45 6H12"
                  />
                </g>
              </svg>
              {t.dashboardPage.viewOrders}
            </button>

            {/* Button Manage Customer */}
            <button
              type="button"
              onClick={handleManageCustomers}
              className="text-primary cursor-pointer transition border border-gray-300 hover:bg-gray-300 flex items-center justify-center w-full  text-sm font-semibold bg-gray-200 text-black py-2 px-4 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M21 19.75c0-2.09-1.67-5.068-4-5.727m-2 5.727c0-2.651-2.686-6-6-6s-6 3.349-6 6m9-12.5a3 3 0 1 1-6 0a3 3 0 0 1 6 0m3 3a3 3 0 1 0 0-6"
                />
              </svg>
              {t.dashboardPage.manageCustomers}
            </button>

            {/* Button View Reports */}
            <button
              type="button"
              onClick={handleViewReports}
              className="text-primary cursor-pointer transition border border-gray-300 hover:bg-gray-300 flex items-center justify-center w-full  text-sm font-semibold bg-gray-200 text-black py-2 px-4 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.5"
                  d="m19 15l-3.118-3.926c-.477-.602-.716-.903-.99-1.05a1.5 1.5 0 0 0-1.357-.029c-.28.135-.531.425-1.035 1.005s-.755.87-1.035 1.005a1.5 1.5 0 0 1-1.356-.03c-.274-.146-.513-.447-.99-1.048L6 7m16 15H12c-4.714 0-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12V9m0-7v3"
                />
              </svg>
              {t.dashboardPage.viewReports}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
