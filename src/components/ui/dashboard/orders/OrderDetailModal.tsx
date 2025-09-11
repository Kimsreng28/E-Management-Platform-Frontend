"use client";
import { useState, useEffect } from "react";
import { MdClose, MdArrowBack, MdLocationOn, MdOutlineLocationCity, MdOutlinePayment, MdOutlinePhone, MdPublic } from "react-icons/md";
import { FaShoppingCart, FaTruck } from "react-icons/fa";
import { LuUser } from "react-icons/lu";
import { BiSolidUserRectangle } from "react-icons/bi";
import { API_BASE_URL } from "@/lib/config";
import { FaNoteSticky } from "react-icons/fa6";

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

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderIds: number[];
}

export default function OrderDetailModal({ isOpen, onClose, orderIds }: OrderDetailModalProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

    useEffect(() => {
        if (isOpen && orderIds.length > 0) {
            fetchOrders();
        }
    }, [isOpen, orderIds]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("token");

            if (!token) {
                setError("Please log in to view order details");
                return;
            }

            // Fetch all orders
            const orderPromises = orderIds.map(id =>
                fetch(`${API_BASE_URL}/api/orders/${id}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }).then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch order ${id}`);
                    }
                    return response.json();
                })
            );

            const ordersData = await Promise.all(orderPromises);
            setOrders(ordersData);
        } catch (err: any) {
            console.error("Error fetching orders:", err);
            setError(err.message || "Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const handleNextOrder = () => {
        if (currentOrderIndex < orders.length - 1) {
            setCurrentOrderIndex(currentOrderIndex + 1);
        }
    };

    const handlePrevOrder = () => {
        if (currentOrderIndex > 0) {
            setCurrentOrderIndex(currentOrderIndex - 1);
        }
    };

    const currentOrder = orders[currentOrderIndex];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <MdClose className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                            Order Details ({currentOrderIndex + 1} of {orders.length})
                        </h2>
                    </div>

                    {orders.length > 1 && (
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrevOrder}
                                disabled={currentOrderIndex === 0}
                                className="p-2 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                <MdArrowBack className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleNextOrder}
                                disabled={currentOrderIndex === orders.length - 1}
                                className="p-2 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 rotate-180"
                            >
                                <MdArrowBack className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal Content */}
                <div className="p-4 md:p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-gray-200 dark:border-gray-700"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                            <h2 className="text-red-800 dark:text-red-400 font-semibold">
                                Error Loading Orders
                            </h2>
                            <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                        </div>
                    ) : currentOrder ? (
                        <OrderDetailContent order={currentOrder} />
                    ) : (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                No Orders Found
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                The requested orders could not be found.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderDetailContent({ order }: { order: Order }) {
    return (
        <div className="space-y-6">
            {/* Order Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 md:px-6 py-4 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                        Order #{order.order_number}
                    </h1>
                    <span
                        className={`px-3 py-1 rounded-full text-sm font-medium self-start md:self-auto ${order.status === "completed"
                            ? "bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-200"
                            : order.status === "delivered"
                                ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
                                : order.status === "processing"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : order.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                        : order.status === "cancelled"
                                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            }`}
                    >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
                    Placed on {new Date(order.created_at).toLocaleDateString()} at{" "}
                    {new Date(order.created_at).toLocaleTimeString()}
                </p>
            </div>

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
                            {order.user.name}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Email</p>
                        <p className="font-medium text-gray-800 dark:text-white break-all">
                            {order.user.email}
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
                            {order.items.map((item) => (
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
                                    ${order.total}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Payment Information */}
                {order.payments && order.payments.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 md:p-6">
                        <h2 className="text-lg flex items-center font-semibold mb-4 text-gray-800 dark:text-white">
                            <MdOutlinePayment className="mr-2 text-indigo-500" />
                            Payment Information
                        </h2>
                        <div className="grid grid-cols-1 gap-3">
                            {order.payments.map((payment) => {
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
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${payment.status === "completed"
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
                {order.shipping_address && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 md:p-6">
                        <h2 className="text-lg flex items-center font-semibold mb-4 text-gray-800 dark:text-white">
                            <FaTruck className="mr-2 text-green-500" />
                            Shipping Information
                        </h2>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-3">
                            {/* Recipient */}
                            <p className="text-gray-800 dark:text-white font-medium flex items-center">
                                <LuUser className="mr-2 text-indigo-500 w-4 h-4" />
                                {order.shipping_address.recipient_name}
                            </p>

                            {/* Address Line */}
                            <p className="text-gray-600 dark:text-gray-300 flex items-start">
                                <MdLocationOn className="mr-2 text-indigo-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    {order.shipping_address.address_line_1}
                                    {order.shipping_address.address_line_2 && (
                                        <>, {order.shipping_address.address_line_2}</>
                                    )}
                                </span>
                            </p>

                            {/* City, State, Postal */}
                            <p className="text-gray-600 dark:text-gray-300 flex items-center">
                                <MdOutlineLocationCity className="mr-2 text-indigo-500 w-4 h-4 flex-shrink-0" />
                                {order.shipping_address.city},{" "}
                                {order.shipping_address.state}{" "}
                                {order.shipping_address.postal_code}
                            </p>

                            {/* Country */}
                            <p className="text-gray-600 dark:text-gray-300 flex items-center">
                                <MdPublic className="mr-2 text-indigo-500 w-4 h-4 flex-shrink-0" />
                                {order.shipping_address.country}
                            </p>

                            {/* Phone */}
                            <p className="text-gray-600 dark:text-gray-300 flex items-center">
                                <MdOutlinePhone className="mr-2 text-indigo-500 w-4 h-4 flex-shrink-0" />
                                {order.shipping_address.phone}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Notes */}
            {order.notes && (
                <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-white">
                        <FaNoteSticky className="mr-2 text-yellow-500" />
                        Order Notes
                    </h2>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm md:text-base">
                            {order.notes}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}