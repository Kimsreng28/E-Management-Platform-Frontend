"use client";

import ReportFilters from "@/components/ui/dashboard/reports/ReportFilters";
import ReportTable from "@/components/ui/dashboard/reports/ReportTable";
import SettingsTabs from "@/components/ui/dashboard/settings/SettingsTabs";
import StatCard from "@/components/ui/dashboard/StatCard";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface StatsData {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  newCustomers: number;
  customersChange: number;
  avgOrderValue: number;
  avgOrderValueChange: number;
}

export default function ReportsPage({ locale }: { locale: "en" | "kh" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState<"en" | "kh">(locale);
  const t = useTranslations(language);

  const [activeTab, setActiveTab] = useState("salesReport");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [period, setPeriod] = useState("month");
  const [customRange, setCustomRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  useEffect(() => {
    const match = pathname.match(/^\/(en|kh)/);
    if (match && match[1] !== language) {
      setLanguage(match[1] as "en" | "kh");
    }
  }, [pathname]);

  useEffect(() => {
    fetchStats();
    fetchTableData();
  }, [activeTab, period, customRange]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(
        `${API_BASE_URL}/api/reports/sales-overview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Failed to load statistics",
        icon: "error",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableData = async () => {
    setIsLoading(true);
    try {
      let endpoint = "";
      switch (activeTab) {
        case "salesReport":
          endpoint = "sales";
          break;
        case "productPerformance":
          endpoint = "products";
          break;
        case "inventoryReport":
          endpoint = "inventory";
          break;
        case "customerAnalysis":
          endpoint = "customers";
          break;
        default:
          endpoint = "sales";
      }

      const params = new URLSearchParams({ period });
      if (customRange)
        params.append("custom_range", JSON.stringify(customRange));

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(
        `${API_BASE_URL}/api/reports/${endpoint}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch table data");

      const data = await response.json();

      // Convert object to array if needed
      const normalizedData = Array.isArray(data) ? data : Object.values(data);

      setTableData(normalizedData);
    } catch (error) {
      console.error(error);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: "pdf" | "csv") => {
    try {
      let reportType = "";
      switch (activeTab) {
        case "salesReport":
          reportType = "sales";
          break;
        case "productPerformance":
          reportType = "products";
          break;
        case "inventoryReport":
          reportType = "inventory";
          break;
        case "customerAnalysis":
          reportType = "customers";
          break;
      }

      const params = new URLSearchParams({ report_type: reportType, period });
      if (customRange)
        params.append("custom_range", JSON.stringify(customRange));

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(
        `${API_BASE_URL}/api/reports/export/${type}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to export report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== "custom") setCustomRange(null);
  };

  const handleCustomRangeChange = (range: { start: string; end: string }) =>
    setCustomRange(range);

  const tabs = [
    { id: "salesReport", label: t.reportsPage.salesReport },
    { id: "productPerformance", label: t.reportsPage.productPerformance },
    { id: "inventoryReport", label: t.reportsPage.inventoryReport },
    { id: "customerAnalysis", label: t.reportsPage.customerAnalysis },
  ];

  const getTableHeaders = () => {
    switch (activeTab) {
      case "salesReport":
        return ["Period", "Revenue", "Orders", "New Customers", "Growth (%)"];
      case "productPerformance":
        return [
          "Product",
          "Category",
          "Units Sold",
          "Revenue",
          "Performance (%)",
        ];
      case "inventoryReport":
        return ["Product", "Current Stock", "Threshold", "Status"];
      case "customerAnalysis":
        return [
          "Customer",
          "Total Orders",
          "Total Revenue",
          "Last Order",
          "Customer Value",
        ];
      default:
        return [];
    }
  };

  return (
    <div className="p-1 space-y-1">
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">{t.reportsPage.reports}</h1>
        <p className="text-gray-600">
          {t.reportsPage.trackPerformance}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
        <StatCard
          title={t.reportsPage.totalRevenue}
          value={`$${stats?.totalRevenue?.toString() || "0"}`}
          change={`+ ${stats?.revenueChange?.toString() || "0"
            } ${t.reportsPage.fromLastPeriod}`}
          gradientFrom="from-[#5d30b6]"
          gradientTo="to-[#5752cf]"
          icon={undefined}
        />

        <StatCard
          title={t.reportsPage.totalOrders}
          value={stats?.totalOrders?.toString() || "0"}
          change={`+ ${stats?.ordersChange?.toString() || "0"
            } ${t.reportsPage.fromLastPeriod}`}
          gradientFrom="from-[#2563eb]"
          gradientTo="to-[#06b6d4]"
          icon={undefined}
        />

        <StatCard
          title={t.reportsPage.newCustomers}
          value={stats?.newCustomers?.toString() || "0"}
          change={`+ ${stats?.customersChange?.toString() || "0"
            } ${t.reportsPage.fromLastPeriod}`}
          gradientFrom="from-[#ec4899]"
          gradientTo="to-[#f97316]"
          icon={undefined}
        />

        <StatCard
          title={t.reportsPage.averageOrderValue}
          value={`$${stats?.avgOrderValue?.toString() || "0"}`}
          change={`+ ${stats?.avgOrderValueChange?.toString() || "0"
            } ${t.reportsPage.fromLastPeriod}`}
          gradientFrom="from-[#22c55e]"
          gradientTo="to-[#0d9488]"
          icon={undefined}
        />
      </div>

      {/* Tabs Navigation */}
      <SettingsTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Filters and Export */}
      <ReportFilters
        period={period}
        onPeriodChange={handlePeriodChange}
        onCustomRangeChange={handleCustomRangeChange}
        onExport={handleExport}
        reportType={activeTab}
        isLoading={isLoading}
        params={{ locale: language }}
      />

      {/* Table Content */}
      <ReportTable
        headers={getTableHeaders()}
        data={tableData}
        activeTab={activeTab}
        isLoading={isLoading}
      />
    </div>
  );
}
