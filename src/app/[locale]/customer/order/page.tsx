"use client";

import { API_BASE_URL } from "@/lib/config";
import { Order } from "@/types/order";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    IoIosArrowBack,
    IoIosCheckmarkCircle,
    IoIosCloseCircle,
    IoIosTime,
    IoIosCart,
    IoIosArrowForward
} from "react-icons/io";
import {
    MdLocalShipping,
    MdOutlinePayment
} from "react-icons/md";
import { FaBoxOpen, FaSearch } from "react-icons/fa";
import { format } from "date-fns";
import Image from "next/image";
import OrderDetailModal from "@/components/ui/customer/OrderDetailModal";
import ReviewModal from "@/components/ui/customer/ReviewModal"; // Import the ReviewModal
import { useTranslations } from "@/utils/useTranslations";
import { PiStarDuotone } from "react-icons/pi";
import DeliveryAgentRatingModal from "@/components/ui/customer/DeliveryAgentRatingModal";

interface OrdersResponse {
    data: Order[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export default function OrderHistoryPage({
    params,
}: {
    params: Promise<{ locale: "en" | "kh" }>;
}) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const router = useRouter();
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const [showDeliveryRatingModal, setShowDeliveryRatingModal] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

    const unwrappedParams = use(params);
    const language = unwrappedParams.locale || "en";
    const t = useTranslations(language);

    const statusOptions = [
        { value: "all", label: t.orderDetail.allOrders },
        { value: "pending", label: "Pending" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    const handleViewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setShowOrderDetail(true);
    };

    const handleOpenReviewModal = (order: Order) => {
        setSelectedOrder(order);
        setShowReviewModal(true);
    };

    const handleReviewSubmitted = () => {
        // Refresh orders to reflect any changes after review submission
        fetchOrders(currentPage, searchTerm, statusFilter);
        setShowReviewModal(false);
    };

    const fetchOrders = async (page = 1, search = "", status = "all") => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/auth/login");
                return;
            }

            let url = `${API_BASE_URL}/api/orders?page=${page}&per_page=10`;

            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }

            if (status !== "all") {
                url += `&status=${status}`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data: OrdersResponse = await response.json();
                setOrders(data.data);
                setCurrentPage(data.current_page);
                setTotalPages(data.last_page);
                setTotalOrders(data.total);
            } else {
                setError("Failed to fetch orders");
            }
        } catch (error) {
            setError("An error occurred while fetching orders");
            console.error("Orders fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(() => {
            fetchOrders(1, searchTerm, statusFilter);
        }, 500); // 500ms debounce

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrders(1, searchTerm, statusFilter);
    };

    const handleStatusFilter = (newStatus: string) => {
        setStatusFilter(newStatus);
        fetchOrders(1, searchTerm, newStatus);
    };

    const handlePageChange = (page: number) => {
        fetchOrders(page, searchTerm, statusFilter);
    };

    const handleRateDeliveryAgent = async (delivery: any) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const rating = prompt("Rate the delivery agent (1-5 stars):");
            if (!rating || isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
                alert("Please enter a valid rating between 1 and 5");
                return;
            }

            const comment = prompt("Add a comment (optional):");

            const response = await fetch(
                `${API_BASE_URL}/api/deliveries/${delivery.id}/rate-agent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        rating: parseInt(rating),
                        comment: comment || "",
                    }),
                }
            );

            if (response.ok) {
                alert("Thank you for rating the delivery agent!");
                fetchOrders(currentPage, searchTerm, statusFilter);
            } else {
                const error = await response.json();
                alert(error.message || "Failed to submit rating");
            }
        } catch (error) {
            console.error("Error rating delivery agent:", error);
            alert("An error occurred while submitting rating");
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <IoIosCheckmarkCircle className="w-5 h-5 text-green-600" />;
            case "cancelled":
                return <IoIosCloseCircle className="w-5 h-5 text-red-600" />;
            case "pending":
                return <IoIosTime className="w-5 h-5 text-yellow-600" />;
            case "processing":
                return <IoIosCart className="w-5 h-5 text-blue-600" />;
            case "shipped":
                return <MdLocalShipping className="w-5 h-5 text-purple-600" />;
            default:
                return <IoIosTime className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "processing":
                return "bg-blue-100 text-blue-800";
            case "shipped":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "MMM dd, yyyy");
    };

    if (loading && orders.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 border-t-black border-gray-200 dark:border-gray-700"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {t.orderDetail.orderHistory}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {totalOrders} {t.orderDetail.ordersFound}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t.ordersPage.searchOrders}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </form>

                        {/* Status Filter */}
                        <div className="w-full sm:w-64">
                            <label htmlFor="statusFilter" className="sr-only">{t.createProduct.filterByStatus}</label>
                            <select
                                id="statusFilter"
                                value={statusFilter}
                                onChange={(e) => handleStatusFilter(e.target.value)}
                                className="block cursor-pointer w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
                            <IoIosCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {t.ordersDetail.ordersNotFound}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {searchTerm || statusFilter !== "all"
                                    ? "Try adjusting your search or filters"
                                    : "You haven't placed any orders yet"}
                            </p>
                            {!searchTerm && statusFilter === "all" && (
                                <Link
                                    href={`/${language}/customer/products`}
                                    className={`px-4 w-fit flex items-center cursor-pointer justify-center gap-2 py-3 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7.5 18a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Zm9 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z" /><path stroke-linecap="round" d="M13 13v-2m0 0V9m0 2h2m-2 0h-2M2 3l.261.092c1.302.457 1.953.686 2.325 1.231s.372 1.268.372 2.715V9.76c0 2.942.063 3.912.93 4.826c.866.914 2.26.914 5.05.914H12m4.24 0c1.561 0 2.342 0 2.894-.45c.551-.45.709-1.214 1.024-2.743l.5-2.424c.347-1.74.52-2.609.076-3.186c-.443-.577-1.96-.577-3.645-.577h-6.065m-6.066 0H7" /></g></svg>
                                    {t.orderDetail.startShopping}
                                </Link>
                            )}
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {t.orderDetail.order} #{order.order_number}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {t.ordersDetail.placedOn} {formatDate(order.created_at)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            <span className="ml-2 capitalize">{order.status}</span>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                ${order.total}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Preview */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                    <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                                        {order.items.slice(0, 3).map((item) => {
                                            const primaryImage = item.product?.images?.find(img => img.is_primary) || item.product?.images?.[0];

                                            return (
                                                <div key={item.id} className="flex-shrink-0">
                                                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                                        {primaryImage ? (
                                                            <Image
                                                                src={`${API_BASE_URL}/${primaryImage.path}`}
                                                                alt={item.product_name}
                                                                width={64}
                                                                height={64}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            // Fallback to gradient with initial
                                                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    {item.product_name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                                                        {item.quantity} × ${item.unit_price}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                        {order.items.length > 3 && (
                                            <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    +{order.items.length - 3}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex justify-end space-x-3">
                                    {(order.status === 'completed' || order.status === 'delivered') && (
                                        <button
                                            onClick={() => handleOpenReviewModal(order)}
                                            className={`px-4 w-fit flex items-center cursor-pointer justify-center gap-2 py-2 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 shadow-md hover:shadow-lg`}
                                        >
                                            <PiStarDuotone className="ml-2 w-5 h-5" />
                                            {t.ordersDetail.rateProducts}
                                        </button>
                                    )}

                                    {order.delivery?.status === 'delivered' && !order.delivery?.agent_rating && (
                                        <button
                                            onClick={() => {
                                                setSelectedDelivery(order.delivery);
                                                setShowDeliveryRatingModal(true);
                                            }}
                                            className="w-fit flex items-center cursor-pointer justify-center px-4 py-2 gap-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                                        >
                                            <PiStarDuotone className="ml-2 w-5 h-5" />
                                            Rate Delivery Agent
                                        </button>
                                    )}

                                    {order.delivery && order.delivery.agent_rating && (
                                        <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
                                            <span className="mr-1 flex items-center gap-2">
                                                <PiStarDuotone className="ml-2 w-5 h-5" />
                                                {Number(order.delivery.agent_rating) % 1 === 0
                                                    ? Number(order.delivery.agent_rating).toFixed(0)
                                                    : Number(order.delivery.agent_rating).toFixed(1)}/5
                                            </span>
                                            <span>Delivery Rated</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleViewOrderDetails(order)}
                                        className={`px-4 w-fit flex items-center cursor-pointer justify-center gap-2 py-2 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
                                    >
                                        {t.createProduct.viewDetail}
                                        <IoIosArrowForward className="ml-2" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 cursor-pointer rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M13.488 4.43a.75.75 0 0 1 .081 1.058L7.988 12l5.581 6.512a.75.75 0 1 1-1.138.976l-6-7a.75.75 0 0 1 0-.976l6-7a.75.75 0 0 1 1.057-.081" clip-rule="evenodd" /><path fill="currentColor" d="M17.75 5a.75.75 0 0 0-1.32-.488l-6 7a.75.75 0 0 0 0 .976l6 7A.75.75 0 0 0 17.75 19z" /></svg>
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-2 cursor-pointer rounded-lg ${currentPage === page
                                        ? "bg-gray-700 dark:bg-gray-400 text-white dark:text-gray-900"
                                        : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 cursor-pointer rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M10.512 4.43a.75.75 0 0 0-.081 1.058L16.012 12l-5.581 6.512a.75.75 0 1 0 1.138.976l6-7a.75.75 0 0 0 0-.976l-6-7a.75.75 0 0 0-1.057-.081" clip-rule="evenodd" /><path fill="currentColor" d="M6.25 5a.75.75 0 0 1 1.32-.488l6 7a.75.75 0 0 1 0 .976l-6 7A.75.75 0 0 1 6.25 19z" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <OrderDetailModal
                isOpen={showOrderDetail}
                onClose={() => setShowOrderDetail(false)}
                order={selectedOrder}
                params={{ locale: language }}
            />

            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                order={selectedOrder}
                onReviewSubmitted={handleReviewSubmitted}
                params={{ locale: language }}
            />

            <DeliveryAgentRatingModal
                isOpen={showDeliveryRatingModal}
                onClose={() => setShowDeliveryRatingModal(false)}
                delivery={selectedDelivery}
                onRatingSubmitted={() => {
                    setShowDeliveryRatingModal(false);
                    fetchOrders(currentPage, searchTerm, statusFilter);
                }}
                params={{ locale: language }}
            />
        </div>
    );
}