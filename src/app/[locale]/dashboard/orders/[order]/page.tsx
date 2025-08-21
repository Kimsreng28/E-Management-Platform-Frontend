"use client";

import { API_BASE_URL } from "@/lib/config";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import { FaUser } from "react-icons/fa6";
import { IoIosArrowBack } from "react-icons/io";
import { MdArrowBack, MdOutlinePayment } from "react-icons/md";

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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          onClick={() => router.back()}
        >
          <MdArrowBack />
          Back to Orders
        </button>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 font-semibold">Error Loading Order</h2>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="p-6">
        <button
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          onClick={() => router.back()}
        >
          <MdArrowBack />
          Back to Orders
        </button>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800">Order Not Found</h2>
          <p className="text-gray-600 mt-2">
            The requested order could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto">
      <div className="flex mb-4 flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="bg-gray-100 border border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow px-2 py-2 transition flex-shrink-0"
        >
          <IoIosArrowBack className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Order Header */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Order #{orderData.order_number}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                orderData.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : orderData.status === "processing"
                  ? "bg-blue-100 text-blue-800"
                  : orderData.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {orderData.status.charAt(0).toUpperCase() +
                orderData.status.slice(1)}
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            Placed on {new Date(orderData.created_at).toLocaleDateString()} at{" "}
            {new Date(orderData.created_at).toLocaleTimeString()}
          </p>
        </div>

        <div className="p-6">
          {/* Customer Information */}
          <div className="mb-8">
            <h2 className="text-lg flex items-center font-semibold mb-3 text-black dark:text-white">
              {" "}
              <FaUser className="mr-2" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="font-medium">{orderData.user.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{orderData.user.email}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h2 className="text-lg flex items-center font-semibold mb-3 text-black dark:text-white">
              <FaShoppingCart className="mr-2" />
              Order Items
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderData.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                        {item.product_model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${Number(item.total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-sm font-medium text-gray-900 text-right"
                    >
                      Order Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${orderData.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Information */}
          {orderData.payments && orderData.payments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg flex items-center font-semibold mb-3 text-black dark:text-white">
                <MdOutlinePayment className="mr-2" />
                Payment Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orderData.payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium capitalize">
                        {payment.payment_method}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                      ${payment.amount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {orderData.notes && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Order Notes</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">{orderData.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
