"use client";

import { API_BASE_URL } from "@/lib/config";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BiSolidUserRectangle } from "react-icons/bi";
import { FaShoppingCart, FaTruck } from "react-icons/fa";
import { FaNoteSticky } from "react-icons/fa6";
import { IoIosArrowBack } from "react-icons/io";
import { LuUser } from "react-icons/lu";
import {
  MdArrowBack,
  MdLocationOn,
  MdOutlineLocationCity,
  MdOutlinePayment,
  MdOutlinePhone,
  MdPublic,
} from "react-icons/md";

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

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: string;
  created_at: string;
  user: { name: string; email: string };
  items: OrderItem[];
  payments: Payment[];
  notes?: string | null;
  shipping_address?: Address;
  billing_address?: Address;
}

export default function OrderDetailPage() {
  const { order } = useParams();
  const router = useRouter();

  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");

        console.log(token);

        // Check if token exists
        if (!token) {
          setError("Please log in to view order details");
          router.push("/login"); // Redirect to login
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/orders/${order}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        console.log(response);

        // Handle different response statuses
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (response.status === 403) {
          setError("You don't have permission to view this order");
          return;
        }

        if (response.status === 404) {
          setError("Order not found");
          return;
        }

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data: Order = await response.json();
        setOrderData(data);
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (order) {
      fetchOrder();
    }
  }, [order]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-gray-200 dark:border-gray-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <button
          className="bg-gray-100 border border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow p-2 transition flex-shrink-0"
          onClick={() => router.back()}
        >
          <MdArrowBack />
        </button>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <h2 className="text-red-800 dark:text-red-400 font-semibold">
            Error Loading Order
          </h2>
          <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <button
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => router.back()}
        >
          <MdArrowBack />
        </button>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Order Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            The requested order could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className=" space-y-6 px-2 sm:px-4 lg:px-1 lg:py-1 py-4">
      <div className="flex mb-4 flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="bg-gray-100 border cursor-pointer border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow p-2 transition flex-shrink-0"
        >
          <IoIosArrowBack className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Order Header */}
        <div className="bg-gray-50 dark:bg-gray-700 px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              Order #{orderData.order_number}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium self-start md:self-auto ${
                orderData.status === "completed"
                  ? "bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-200"
                  : orderData.status === "delivered"
                  ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
                  : orderData.status === "processing"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : orderData.status === "pending"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : orderData.status === "cancelled"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
              }`}
            >
              {orderData.status.charAt(0).toUpperCase() +
                orderData.status.slice(1)}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Placed on {new Date(orderData.created_at).toLocaleDateString()} at{" "}
            {new Date(orderData.created_at).toLocaleTimeString()}
          </p>
        </div>

        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Customer Information */}
          <div>
            <h2 className="text-lg flex items-center font-semibold mb-3 text-gray-800 dark:text-white">
              <BiSolidUserRectangle className="mr-2 text-blue-500" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Name</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {orderData.user.name}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Email
                </p>
                <p className="font-medium text-gray-800 dark:text-white break-all">
                  {orderData.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h2 className="text-lg flex items-center font-semibold mb-3 text-gray-800 dark:text-white">
              <FaShoppingCart className="mr-2 text-blue-500" />
              Order Items
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orderData.items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.product_model}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        ${Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        ${Number(item.total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-white text-right"
                    >
                      Order Total:
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${orderData.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Payment Information */}
            {orderData.payments && orderData.payments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-lg flex items-center font-semibold mb-4 text-gray-800 dark:text-white">
                  <MdOutlinePayment className="mr-2 text-indigo-500" />
                  Payment Information
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {orderData.payments.map((payment) => {
                    let logoSrc = "/images/default.png"; // fallback logo

                    if (payment.payment_method.toLowerCase() === "khqr") {
                      logoSrc = "/images/KHQR_Logo.png";
                    } else if (
                      payment.payment_method.toLowerCase() === "stripe"
                    ) {
                      logoSrc = "/images/stripe.png";
                    }

                    return (
                      <div
                        key={payment.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={logoSrc}
                              alt={payment.payment_method}
                              className="w-10 h-10 object-contain"
                            />
                            <span className="font-medium capitalize text-gray-700 dark:text-gray-200 truncate">
                              {payment.payment_method}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              payment.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          ${Number(payment.amount).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shipping Information */}
            {orderData.shipping_address && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-lg flex items-center font-semibold mb-4 text-gray-800 dark:text-white">
                  <FaTruck className="mr-2 text-green-500" />
                  Shipping Information
                </h2>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-3">
                  {/* Recipient */}
                  <p className="text-gray-800 dark:text-white font-medium flex items-center">
                    <LuUser className="mr-2 text-indigo-500 w-4 h-4" />
                    {orderData.shipping_address.recipient_name}
                  </p>

                  {/* Address Line */}
                  <p className="text-gray-600 dark:text-gray-300 flex items-start">
                    <MdLocationOn className="mr-2 text-indigo-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {orderData.shipping_address.address_line_1}
                      {orderData.shipping_address.address_line_2 && (
                        <>, {orderData.shipping_address.address_line_2}</>
                      )}
                    </span>
                  </p>

                  {/* City, State, Postal */}
                  <p className="text-gray-600 dark:text-gray-300 flex items-center">
                    <MdOutlineLocationCity className="mr-2 text-indigo-500 w-4 h-4 flex-shrink-0" />
                    {orderData.shipping_address.city},{" "}
                    {orderData.shipping_address.state}{" "}
                    {orderData.shipping_address.postal_code}
                  </p>

                  {/* Country */}
                  <p className="text-gray-600 dark:text-gray-300 flex items-center">
                    <MdPublic className="mr-2 text-indigo-500 w-4 h-4 flex-shrink-0" />
                    {orderData.shipping_address.country}
                  </p>

                  {/* Phone */}
                  <p className="text-gray-600 dark:text-gray-300 flex items-center">
                    <MdOutlinePhone className="mr-2 text-indigo-500 w-4 h-4 flex-shrink-0" />
                    {orderData.shipping_address.phone}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {orderData.notes && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-white">
                <FaNoteSticky className="mr-2 text-yellow-500" />
                Order Notes
              </h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm md:text-base">
                  {orderData.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
