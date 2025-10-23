"use client";
import OrderDetailModal from "@/components/ui/dashboard/orders/OrderDetailModal";
import StatCard from "@/components/ui/dashboard/StatCard";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { IoIosArrowDown, IoIosArrowUp, IoIosSearch } from "react-icons/io";
import { MdMoreVert, MdVisibility } from "react-icons/md";
import Swal from "sweetalert2";

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  is_active: boolean;
  addresses: Address[];
  carts: Cart[];
  orders: Order[];
  notification_settings: NotificationSettings;
}

interface Address {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

interface Cart {
  id: number;
  total_price: number;
  created_at: string;
  items: CartItem[];
}

interface CartItem {
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
  name: string;
  email: string;
  items: OrderItem[];
  payments: Payment[];
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Payment {
  id: number;
  payment_method: string;
  amount: string;
  status: string;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function CustomersPage({
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

  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Order detail
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  // filter and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // table
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // fetch data customer state
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/customers/stats`, {
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
    } catch (error) {
      console.error("Error fetching stats:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to load order statistics. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  // fetch data customer
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedStatus) params.append("status", selectedStatus);
      params.append("page", currentPage.toString());
      params.append("per_page", itemsPerPage.toString());
      params.append("sort_by", sortField);
      params.append("sort_direction", sortDirection);

      const response = await fetch(
        `${API_BASE_URL}/api/customers?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();

      const customersData = data.data.map((customer: any) => ({
        ...customer,
        orders: (customer.orders || []).map((o: any) => ({
          ...o,
          items: Array.isArray(o.items || o.order_items)
            ? o.items || o.order_items
            : [],
          payments: Array.isArray(o.payments) ? o.payments : [],
        })),
      }));

      setCustomers(customersData);
      setTotal(data.total);
      setTotalPages(data.last_page || 1);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  // handle view
  const handleViewCustomer = (customer: Customer) => {
    router.push(`/${currentLocale}/dashboard/customers/${customer.id}`);
  };

  // handle view order
  const handleViewOrders = (customer: Customer) => {
    const orderIds = customer.orders.map((o: any) => o.id);
    setSelectedOrderIds(orderIds);
    setIsOrderModalOpen(true);
  };

  // handle sort
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

  // Fetch data customer state
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch data customer
  useEffect(() => {
    fetchCustomers();
  }, [
    searchTerm,
    selectedStatus,
    currentPage,
    itemsPerPage,
    sortField,
    sortDirection,
  ]);

  return (
    <div className="space-y-3 px-2 sm:px-2 lg:px-2 lg:py-2 py-2 sm:space-y-3 md:px-2 sm:py-2">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 dark:text-white">
            {t.customerPage.customers}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300">
            {t.customerPage.manageCustomers}
          </p>
        </div>
      </div>

      {/* State Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title={t.customerPage.totalCustomers}
          value={stats?.totalCustomers?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
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
          gradientFrom="from-[#5d30b6]"
          gradientTo="to-[#5752cf]"
        />
        <StatCard
          title={t.customerPage.activeCustomers}
          value={stats?.activeCustomers?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
            >
              <g fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="6" r="4" />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m17 10.3l1.333 1.2L21 8.5"
                />
                <path
                  stroke-linecap="round"
                  d="M18.998 18q.002-.246.002-.5c0-2.485-3.582-4.5-8-4.5s-8 2.015-8 4.5S3 22 11 22c2.231 0 3.84-.157 5-.437"
                />
              </g>
            </svg>
          }
          gradientFrom="from-[#2563eb]"
          gradientTo="to-[#06b6d4]"
        />
        <StatCard
          title={t.customerPage.inactiveCustomers}
          value={stats?.inactiveCustomers?.toString() || "0"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
            >
              <g fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="10" cy="6" r="4" />
                <path
                  stroke-linecap="round"
                  d="M20.414 11.414L19 10m0 0l-1.414-1.414M19 10l1.414-1.414M19 10l-1.414 1.414M17.998 18q.002-.246.002-.5c0-2.485-3.582-4.5-8-4.5s-8 2.015-8 4.5S2 22 10 22c2.231 0 3.84-.157 5-.437"
                />
              </g>
            </svg>
          }
          gradientFrom="from-[#ec4899]"
          gradientTo="to-[#f97316]"
        />
        <StatCard
          title={t.customerPage.totalRevenue}
          value={`$ ${stats?.totalRevenue?.toString() || "0"}`}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
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
          gradientFrom="from-[#22c55e]"
          gradientTo="to-[#0d9488]"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Search, filter by status and payment, and manage your order */}
        <div className=" p-2 m-2 ">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t.customerPage.customerManagement}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.customerPage.searchFilterManage}
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
                  placeholder={t.customerPage.searchCustomers}
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
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    {t.customerPage.customer} {getSortIndicator("name")}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center">
                    {t.customerPage.contact} {getSortIndicator("email")}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("orders_count")}
                >
                  <div className="flex items-center">
                    {t.customerPage.ordersTotal} {getSortIndicator("orders_count")}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("total_spent")}
                >
                  <div className="flex items-center">
                    {t.customerPage.totalSpent} {getSortIndicator("total_spent")}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("last_order_date")}
                >
                  <div className="flex items-center">
                    {t.customerPage.lastOrder} {getSortIndicator("last_order_date")}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("is_active")}
                >
                  <div className="flex items-center">
                    {t.customerPage.status} {getSortIndicator("is_active")}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-black dark:text-gray-300 uppercase tracking-wider flex items-center justify-end"
                >
                  {t.customerPage.actions}
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
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  // Calculate order stats
                  const orderCount = customer.orders?.length || 0;
                  const totalSpent =
                    customer.orders?.reduce(
                      (sum, order) => sum + parseFloat(order.total || "0"),
                      0
                    ) || 0;

                  // Get last order date
                  const lastOrder =
                    customer.orders && customer.orders.length > 0
                      ? new Date(
                        customer.orders.reduce(
                          (latest, order) =>
                            new Date(order.created_at) >
                              new Date(latest.created_at)
                              ? order
                              : latest,
                          customer.orders[0]
                        ).created_at
                      )
                      : null;

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {/* Customer Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {customer.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={customer.avatar}
                                alt={customer.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {customer.name?.charAt(0).toUpperCase() || "C"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => handleViewCustomer(customer)}
                              className="text-sm font-bold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer transition-colors duration-200 text-left"
                            >
                              {customer.name || "Unknown Customer"}
                            </button>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {customer.addresses && customer.addresses.length > 0
                                ? `${customer.addresses[0].city}, ${customer.addresses[0].state}`
                                : "No address"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {customer.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {customer.phone || "No phone"}
                        </div>
                      </td>

                      {/* Orders Total Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {orderCount}
                      </td>

                      {/* Total Spent Column */}
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-gray-900 dark:text-white">
                        ${totalSpent.toFixed(2)}
                      </td>

                      {/* Last Order Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {lastOrder
                          ? lastOrder.toLocaleDateString()
                          : "No orders"}
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                            }`}
                        >
                          {customer.is_active ? t.customerPage.active : t.customerPage.inactive}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <div className="relative inline-block text-left">
                          {/* Trigger button */}
                          <button
                            type="button"
                            className="inline-flex cursor-pointer justify-center w-8 h-8 rounded-full items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                            onClick={(e) => toggleDropdown(customer.id, e)}
                          >
                            <MdMoreVert className="w-5 h-5" />
                          </button>

                          {/* Dropdown */}
                          {dropdownOpen === customer.id && dropdownPosition && (
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
                                    handleViewCustomer(customer);
                                  }}
                                >
                                  <MdVisibility className="mr-2" />
                                  {t.customerPage.viewProfile}
                                </button>

                                <button
                                  className="flex items-center cursor-pointer px-4 py-2 text-sm w-full text-left 
                     text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                  onClick={() => {
                                    handleViewOrders(customer);
                                    setDropdownOpen(null);
                                  }}
                                >
                                  <MdVisibility className="mr-2" />
                                  {t.customerPage.viewOrders}
                                </button>


                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {customers.length > 0 && (
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

          <OrderDetailModal
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
            orderIds={selectedOrderIds}
            params={{ locale: language }}
          />
        </div>
      </div>
    </div>
  );
}
