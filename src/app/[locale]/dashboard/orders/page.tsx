"use client";

import UpdateStatusModal from "@/components/ui/dashboard/orders/UpdateStatusModal";
import StatCard from "@/components/ui/dashboard/StatCard";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { FaLocationArrow } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp, IoIosSearch } from "react-icons/io";
import { MdMoreVert, MdVisibility } from "react-icons/md";
import { RiEditLine } from "react-icons/ri";
import Swal from "sweetalert2";

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  completed: number;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: string;
  created_at: string;
  user: { name: string; email: string };
  items: OrderItem[];
  payments: Payment[];
}

interface Payment {
  id: number;
  payment_method: string;
  amount: string;
  status: string;
}

export default function OrdersPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const unwrappedParams = use(params);
  const language = unwrappedParams.locale || "en";
  const currentLocale = pathname.split("/")[1] || "en";
  const t = useTranslations(language);

  const [stats, setStats] = useState<OrderStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const statusOptions = [
    { label: t.ordersPage.allStatus, value: "" },
    { label: t.ordersPage.pending, value: "pending" },
    { label: t.ordersPage.processing, value: "processing" },
    { label: t.ordersPage.shipped, value: "shipped" },
    { label: t.ordersPage.cancelled, value: "cancelled" },
    { label: t.ordersPage.refunded, value: "refunded" },
    { label: t.ordersPage.completed, value: "completed" },
  ];

  const paymentOptions = [
    { label: t.ordersPage.completed, value: "completed" },
    { label: t.ordersPage.pending, value: "pending" },
    { label: t.ordersPage.failed, value: "failed" },
    { label: t.ordersPage.refunded, value: "refunded" },
  ];

  // Fetch order stats
  const fetchOrderStats = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching order stats:", err);
      Swal.fire({
        title: "Error!",
        text: "Failed to load order statistics. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedPayment) params.append("payment_status", selectedPayment);
      params.append("page", currentPage.toString());
      params.append("per_page", itemsPerPage.toString());
      params.append("sort_by", sortField);
      params.append("sort_direction", sortDirection);

      const response = await fetch(
        `${API_BASE_URL}/api/orders?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      console.log("Response:", data);

      setOrders(
        (data.data || []).map((order: any) => ({
          ...order,
          payment_status: order.payments?.[0]?.status || "unknown",
        }))
      );
      setTotalPages(data.last_page || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error fetching orders:", err);
      Swal.fire({
        title: "Error!",
        text: "Failed to load orders. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for actions
  const handleViewDetails = (order: Order) => {
    console.log("View details for order:", order.id);
    router.push(`/${currentLocale}/dashboard/orders/${order.id}`);
  };

  const handleTrackShipment = (order: Order) => {
    // Implement track shipment logic
    console.log("Track shipment for order:", order.id);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIndicator = (field: string) => {
    return (
      <span className="inline-flex flex-col ml-1">
        <IoIosArrowUp
          className={`w-3 h-3 ${sortField === field && sortDirection === "asc"
            ? "text-gray-900 dark:text-gray-200"
            : "text-gray-400 dark:text-gray-200"
            }`}
        />
        <IoIosArrowDown
          className={`w-3 h-3 ${sortField === field && sortDirection === "desc"
            ? "text-gray-900 dark:text-gray-200"
            : "text-gray-400 dark:text-gray-200"
            }`}
        />
      </span>
    );
  };

  const DROPDOWN_WIDTH = 160; // Tailwind w-40 = 10rem = 160px
  const DROPDOWN_EST_HEIGHT = 160; // rough height of menu; adjust if needed
  const PADDING = 8;

  const toggleDropdown = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (dropdownOpen === id) {
      setDropdownOpen(null);
      setDropdownPosition(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Horizontal: right-align to button, clamp to viewport
    let left = rect.right - DROPDOWN_WIDTH;
    if (left < PADDING) left = PADDING;
    if (left + DROPDOWN_WIDTH + PADDING > window.innerWidth) {
      left = Math.max(window.innerWidth - DROPDOWN_WIDTH - PADDING, PADDING);
    }

    // Vertical: open below; flip above if not enough space
    const spaceBelow = window.innerHeight - rect.bottom;
    let top =
      spaceBelow >= DROPDOWN_EST_HEIGHT
        ? rect.bottom
        : Math.max(rect.top - DROPDOWN_EST_HEIGHT, PADDING);

    setDropdownOpen(id);
    setDropdownPosition({ top, left });
  };

  // Close on outside click, scroll, or resize (use capture to catch inner scrollables)
  useEffect(() => {
    if (dropdownOpen === null) return;
    const close = () => {
      setDropdownOpen(null);
      setDropdownPosition(null);
    };
    document.addEventListener("click", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [dropdownOpen]);

  // Fetch order stats when the component mounts
  useEffect(() => {
    fetchOrderStats();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [
    searchTerm,
    selectedStatus,
    selectedPayment,
    currentPage,
    itemsPerPage,
    sortField,
    sortDirection,
  ]);

  const getTranslatedStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: t.ordersPage.pending,
      processing: t.ordersPage.processing,
      shipped: t.ordersPage.shipped,
      cancelled: t.ordersPage.cancelled,
      refunded: t.ordersPage.refunded,
      completed: t.ordersPage.completed,
    };
    return statusMap[status] || status;
  };

  // Helper function to translate payment status
  const getTranslatedPaymentStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: t.ordersPage.pending,
      completed: t.ordersPage.completed,
      failed: t.ordersPage.failed,
      refunded: t.ordersPage.refunded,
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-3 px-2 sm:px-2 lg:px-2 lg:py-2 py-2 sm:space-y-3 md:px-2 sm:py-2">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 dark:text-white">
            {t.ordersPage.orders}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300">
            {t.ordersPage.manageCustomer}
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard
          title={t.ordersPage.totalOrders}
          value={stats?.total?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
                d="M21.984 10c-.037-1.311-.161-2.147-.581-2.86c-.598-1.015-1.674-1.58-3.825-2.708l-2-1.05C13.822 2.461 12.944 2 12 2s-1.822.46-3.578 1.382l-2 1.05C4.271 5.56 3.195 6.125 2.597 7.14C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709l2 1.049C10.178 21.539 11.056 22 12 22s1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.42-.713.544-1.549.581-2.86M21 7.5l-4 2M12 12L3 7.5m9 4.5v9.5m0-9.5l4.5-2.25l.5-.25m0 0V13m0-3.5l-9.5-5"
              />
            </svg>
          }
          gradientFrom="from-[#5d30b6]"
          gradientTo="to-[#5752cf]"
        />
        <StatCard
          title={t.ordersPage.pending}
          value={stats?.pending?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 24 24"
            >
              <g fill="none">
                <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                <path
                  fill="currentColor"
                  d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0 2a1 1 0 0 1 .993.883L13 7v4.586l2.707 2.707a1 1 0 0 1-1.32 1.497l-.094-.083l-3-3a1 1 0 0 1-.284-.576L11 12V7a1 1 0 0 1 1-1"
                />
              </g>
            </svg>
          }
          gradientFrom="from-[#2563eb]"
          gradientTo="to-[#06b6d4]"
        />
        <StatCard
          title={t.ordersPage.processing}
          value={stats?.processing?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 32 32"
            >
              <path
                fill="currentColor"
                d="M12 25c-.738 0-1.376.405-1.723 1h-5.63l2.648-5.092c.227.055.461.092.705.092c1.654 0 3-1.346 3-3s-1.346-3-3-3s-3 1.346-3 3c0 .679.235 1.298.616 1.801L2.113 26.54A1 1 0 0 0 3 28h7.277c.347.595.985 1 1.723 1a2 2 0 0 0 0-4m-4-8a1.001 1.001 0 0 1 0 2a1 1 0 0 1 0-2m21.887 9.539l-4.04-7.771A2 2 0 1 0 24 20c.075 0 .147-.014.22-.023L27.353 26h-4.537A2.995 2.995 0 0 0 20 24c-1.654 0-3 1.346-3 3s1.346 3 3 3a2.995 2.995 0 0 0 2.816-2H29a1 1 0 0 0 .887-1.462zM20 28a1.001 1.001 0 0 1 0-2a1.001 1.001 0 0 1 0 2m1-20a3 3 0 0 0-.705.092L16.887 1.54C16.715 1.207 16.357 1 16 1s-.715.207-.887.539L11.22 9.023C11.148 9.014 11.076 9 11 9a2 2 0 1 0 1.846 1.232L16 4.168l2.616 5.03A2.97 2.97 0 0 0 18 11c0 1.654 1.346 3 3 3s3-1.346 3-3s-1.346-3-3-3m0 4a1.001 1.001 0 0 1 0-2a1.001 1.001 0 0 1 0 2"
              />
            </svg>
          }
          gradientFrom="from-[#ec4899]"
          gradientTo="to-[#f97316]"
        />
        <StatCard
          title={t.ordersPage.shipped}
          value={stats?.shipped?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2-1a2.4 2.4 0 0 1 2-1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2-1a2.4 2.4 0 0 1 2-1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2-1M4 18l-1-5h18l-2 4M5 13V7h8l4 6M7 7V3H6"
              />
            </svg>
          }
          gradientFrom="from-[#22c55e]"
          gradientTo="to-[#0d9488]"
        />
        <StatCard
          title={t.ordersPage.completed}
          value={stats?.completed?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              viewBox="0 0 32 32"
            >
              <path
                fill="currentColor"
                d="M17.615 2.55a4.5 4.5 0 0 0-3.23 0L4.083 6.512A3.25 3.25 0 0 0 2 9.545v12.91a3.25 3.25 0 0 0 2.083 3.033l10.302 3.962a4.5 4.5 0 0 0 2.552.201a9 9 0 0 1-1.646-2.004a3 3 0 0 1-.188-.064l-5.244-2.016l-.01-.004l-5.048-1.942A1.25 1.25 0 0 1 4 22.455V9.545q0-.045.003-.088L15 13.687v5.185a9 9 0 0 1 2-2.58v-2.605l10.997-4.230l.003.088v5.97a9 9 0 0 1 2 1.828V9.545a3.25 3.25 0 0 0-2.083-3.033zm-2.512 1.867a2.5 2.5 0 0 1 1.794 0L26.214 8L22.5 9.43L12.286 5.5zM9.5 6.57l10.214 3.93L16 11.929L5.786 8zM23 15.5a7.5 7.5 0 1 1 0 15a7.5 7.5 0 0 1 0-15m-.72 11.03l5.25-5.25a.75.75 0 1 0-1.06-1.06l-4.72 4.72l-1.97-1.97a.75.75 0 1 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0"
              />
            </svg>
          }
          gradientFrom="from-[#fbbf24]"
          gradientTo="to-[#f59e0b]"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Search, filter by status and payment, and manage your order */}
        <div className=" p-2 m-2 ">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t.ordersPage.orderManagement}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.ordersPage.searchFilterManage}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 flex justify-center items-center pl-2 pointer-events-none">
                  <IoIosSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder={t.ordersPage.searchOrders}
                  className="w-full text-xs sm:text-sm md:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg pl-8 sm:pl-10 py-1.5 sm:py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter by Status (Dropdown) */}
              <div className="relative w-full md:w-48">
                <select
                  id="status"
                  value={selectedStatus || ""}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-600 appearance-none"
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option.value || "all"}
                      value={option.value || ""}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
              </div>

              {/* Filter by Payment (Dropdown) */}
              <div className="relative w-full md:w-52">
                <select
                  id="category"
                  value={selectedPayment || ""}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setSelectedPayment(e.target.value);
                  }}
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-2 py-2 pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-600 appearance-none"
                >
                  <option value="">{t.ordersPage.allPayments}</option>
                  {paymentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("order_number")}
                >
                  <div className="flex items-center">
                    {t.ordersPage.orderId} {getSortIndicator("order_number")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("user.name")}
                >
                  <div className="flex items-center">
                    {t.ordersPage.customer} {getSortIndicator("user.name")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider"
                >
                  {t.ordersPage.product}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("total")}
                >
                  <div className="flex items-center">
                    {t.ordersPage.total} {getSortIndicator("total")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    {t.ordersPage.status} {getSortIndicator("status")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("payment_status")}
                >
                  <div className="flex items-center">
                    {t.ordersPage.payment} {getSortIndicator("payment_status")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center">
                    {t.ordersPage.date} {getSortIndicator("created_at")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider"
                >
                  {t.ordersPage.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-black animate-bounce dark:bg-white"></div>
                      <div className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-.2s] dark:bg-white"></div>
                      <div className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-.4s] dark:bg-white"></div>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-black dark:text-white">
                        #{order.order_number || order.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black dark:text-white">
                          {order.user?.name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.user?.email || "No email"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 sm:px-6 sm:py-4 w-full max-w-[200px] md:max-w-[300px]">
                      <div className="flex flex-col space-y-1">
                        {order.items &&
                          order.items.slice(0, 2).map((item, index) => (
                            <div
                              key={index}
                              className="text-xs font-semibold text-black dark:text-gray-300 truncate"
                              title={`${item.product_name} (x${item.quantity})`}
                            >
                              {item.product_name} (x{item.quantity})
                            </div>
                          ))}

                        {order.items && order.items.length > 2 && (
                          <div className="text-xs text-blue-500 dark:text-blue-400 mt-1 truncate">
                            +{order.items.length - 2} more
                          </div>
                        )}

                        {(!order.items || order.items.length === 0) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            No items
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-bold dark:text-gray-400">
                      ${parseFloat(order.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : ""
                          }
      ${order.status === "processing"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : ""
                          }
      ${order.status === "shipped"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            : ""
                          }
      ${order.status === "cancelled"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : ""
                          }
      ${order.status === "refunded"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : ""
                          }
      ${order.status === "completed"
                            ? "bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-200"
                            : ""
                          }
    `}
                      >
                        {getTranslatedStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.payments?.length ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${order.payments[order.payments.length - 1].status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : ""
                            }
        ${order.payments[order.payments.length - 1].status === "completed"
                              ? "bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-200"
                              : ""
                            }
        ${order.payments[order.payments.length - 1].status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : ""
                            }
        ${order.payments[order.payments.length - 1].status === "refunded"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : ""
                            }
      `}
                        >
                          {getTranslatedPaymentStatus(order.payments[order.payments.length - 1].status)}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">N/A</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("en-GB")}{" "}
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <div className="relative inline-block text-left">
                        {/* Trigger button */}
                        <button
                          type="button"
                          className="inline-flex cursor-pointer justify-center w-8 h-8 rounded-full items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                          onClick={(e) => toggleDropdown(order.id, e)}
                        >
                          <MdMoreVert className="w-5 h-5" />
                        </button>

                        {/* Dropdown */}
                        {dropdownOpen === order.id && dropdownPosition && (
                          <div
                            className="fixed z-20 w-40 rounded-md shadow-lg bg-white dark:bg-gray-700 
               border border-gray-200 dark:border-gray-600"
                            style={{
                              top: dropdownPosition.top,
                              left: dropdownPosition.left,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <button
                                className="flex items-center cursor-pointer px-4 py-2 text-sm w-full text-left 
                   text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={() => {
                                  handleViewDetails(order);
                                  setDropdownOpen(null);
                                }}
                              >
                                <MdVisibility className="mr-2" />
                                {t.ordersPage.viewDetails}
                              </button>

                              <button
                                className="flex items-center cursor-pointer px-4 py-2 text-sm w-full text-left 
                   text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsModalOpen(true);
                                  setDropdownOpen(null);
                                }}
                              >
                                <RiEditLine className="mr-2" />
                                {t.ordersPage.updateStatus}
                              </button>

                              <button
                                className="flex items-center cursor-pointer px-4 py-2 text-sm w-full text-left 
                   text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={() => {
                                  handleTrackShipment(order);
                                  setDropdownOpen(null);
                                }}
                              >
                                <FaLocationArrow className="mr-2" />
                                Track Shipment
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {orders.length > 0 && (
            <div className="px-3 sm:px-5 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                {/* Rows per page selector */}
                <div className="flex items-center">
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mr-2">
                    {t.viewCategory.rowsPerPage}:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1 sm:px-2 py-1"
                  >
                    {[5, 10, 25, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pagination controls */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    {t.viewCategory.first}
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    {t.viewCategory.previous}
                  </button>

                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 px-1 sm:px-2">
                    {t.viewCategory.page} {currentPage} {t.viewCategory.of}{" "}
                    {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    {t.viewCategory.next}
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    {t.viewCategory.last}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Render modal here at top level */}
          {selectedOrder && (
            <UpdateStatusModal
              order={selectedOrder}
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedOrder(null);
              }}
              statusOptions={statusOptions}
              onSave={function (): void {
                throw new Error("Function not implemented.");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
