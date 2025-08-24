"use client";
import { API_BASE_URL } from "@/lib/config";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaClock,
  FaDollarSign,
  FaEdit,
  FaMapMarkerAlt,
  FaShoppingCart,
} from "react-icons/fa";
import { FaAddressBook, FaPhone } from "react-icons/fa6";
import { IoIosArrowBack } from "react-icons/io";
import Swal from "sweetalert2";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  is_active: boolean;
  addresses: Address[];
  orders: Order[];
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
  is_default: boolean;
}

interface Order {
  id: number;
  order_number: string;
  total: string;
  status: string;
  created_at: string;
  notes?: string | null;
  items: OrderItem[];
  payments: Payment[];
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_model: string;
}

interface Payment {
  id: number;
  payment_method: string;
  amount: string;
  status: string;
}

export default function CustomerViewPage() {
  const { customer } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(
        `${API_BASE_URL}/api/customers/${customer}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch customer");

      const data: any = await response.json();

      const orders = (data.orders || []).map((o: any) => ({
        ...o,
        items: Array.isArray(o.items || o.order_items)
          ? o.items || o.order_items
          : [],
        payments: Array.isArray(o.payments) ? o.payments : [],
      }));

      setCustomerData({ ...data, orders });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load customer data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customer]);

  if (loading || !customerData) {
    return (
      <div className="flex justify-center items-center h-screen ">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black dark:border-t-white border-gray-200 dark:border-gray-700"></div>
      </div>
    );
  }

  const totalOrders = customerData.orders.length;
  const totalSpent = customerData.orders.reduce(
    (sum, o) => sum + parseFloat(o.total || "0"),
    0
  );
  const lastOrder =
    customerData.orders.length > 0
      ? new Date(
          customerData.orders.reduce((latest, o) =>
            new Date(o.created_at) > new Date(latest.created_at) ? o : latest
          ).created_at
        )
      : null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400 border-green-200 dark:border-green-700";
      case "delivered":
        return "bg-teal-100 text-teal-800 dark:bg-teal-800/30 dark:text-teal-400 border-teal-200 dark:border-teal-700";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400 border-blue-200 dark:border-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400 border-red-200 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-1 lg:py-1 py-6 sm:space-y-6 md:px-6 sm:py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center cursor-pointer justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors shadow-sm"
          >
            <IoIosArrowBack className="w-5 h-5" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Customer Details
          </h1>
        </div>

        {/* Customer Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row items-start gap-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {customerData.avatar ? (
                  <img
                    className="w-full h-full object-cover"
                    src={customerData.avatar}
                    alt={customerData.name}
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-semibold text-gray-600 dark:text-gray-300">
                    {customerData.name?.charAt(0).toUpperCase() || "C"}
                  </span>
                )}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 ${
                  customerData.is_active ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {customerData.name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {customerData.email}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    customerData.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400"
                  }`}
                >
                  {customerData.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FaPhone className="w-4 h-4" />
                  <span>{customerData.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FaAddressBook className="w-4 h-4" />
                  <span>{customerData.addresses.length} Addresses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 ">
          {["overview", "orders", "addresses", "activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 cursor-pointer text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-500 font-semibold text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              } capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow duration-300">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400">
                <FaShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalOrders}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow duration-300">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400">
                <FaDollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  Total Spent
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow duration-300">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-800/30 text-purple-600 dark:text-purple-400">
                <FaClock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  Last Order
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {lastOrder ? lastOrder.toLocaleDateString() : "No orders"}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Orders
              </h3>
              <button
                onClick={() => setActiveTab("orders")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {customerData.orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Order #{order.order_number}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600 dark:text-gray-400">
                      {order.items.length} items
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${parseFloat(order.total).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {customerData.orders.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No orders found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Order History
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {customerData.orders.map((order) => (
              <div
                key={order.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Order #{order.order_number}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      order.status
                    )} self-start lg:self-auto`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Items:
                  </p>
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.quantity} x {item.product_name}
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          ${Number(item.total_price).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    {order.payments.length > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Payment: {order.payments[0].payment_method} (
                        {order.payments[0].status})
                      </p>
                    )}
                    {order.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Notes: {order.notes}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Total: ${parseFloat(order.total).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            {customerData.orders.length === 0 && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No orders found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === "addresses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customerData.addresses.map((address) => (
            <div
              key={address.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {address.label}
                  </h3>
                </div>
                {address.is_default && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>{address.recipient_name}</p>
                <p>{address.phone}</p>
                <p>
                  {address.address_line_1}
                  {address.address_line_2 && `, ${address.address_line_2}`}
                </p>
                <p>
                  {address.city}, {address.state} {address.postal_code}
                </p>
                <p>{address.country}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button className="text-sm text-blue-600 cursor-pointer dark:text-blue-400 hover:underline flex items-center gap-1">
                  <FaEdit className="w-3 h-3" />
                  Edit Address
                </button>
              </div>
            </div>
          ))}
          {customerData.addresses.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <FaMapMarkerAlt className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No addresses
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                This customer hasn't added any addresses yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Customer Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="relative">
              {/* Timeline */}
              <div className="space-y-8">
                {/* Account Creation */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Account created
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Customer joined on{" "}
                      {formatDate(
                        customerData.orders[0]?.created_at ||
                          new Date().toISOString()
                      )}
                    </p>
                  </div>
                </div>

                {/* Orders */}
                {customerData.orders.slice(0, 5).map((order, index) => (
                  <div key={order.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      {index < customerData.orders.slice(0, 5).length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-8 last:pb-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Placed order #{order.order_number}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(order.created_at)} • $
                        {parseFloat(order.total).toFixed(2)} •{" "}
                        {order.items.length} items
                      </p>
                    </div>
                  </div>
                ))}

                {customerData.orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No activity recorded yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
