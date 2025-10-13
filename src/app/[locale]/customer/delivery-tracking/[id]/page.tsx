// app/[locale]/customer/delivery-tracking/[id]/page.tsx
"use client";

import { API_BASE_URL } from "@/lib/config";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IoIosArrowBack, IoIosCheckmarkCircle } from "react-icons/io";
import { MdOutlineDeliveryDining, MdLocationOn } from "react-icons/md";
import { FaPhone, FaUser } from "react-icons/fa";
import { BsClockHistory } from "react-icons/bs";
import { TbTruckDelivery } from "react-icons/tb";
import { RiCustomerService2Line } from "react-icons/ri";
import { format } from "date-fns";
import Image from "next/image";
import ChatModal from "@/components/ui/customer/ChatModal";
import OrderDetailModal from "@/components/ui/customer/OrderDetailModal";
import { Order } from "@/types/order";
import initializeEcho, { disconnectEcho } from "@/lib/echo";
import { User } from "@/contexts/ChatContext";
import { useTranslations } from "@/utils/useTranslations";


interface Delivery {
    id: number;
    tracking_number: string;
    status: string;
    estimated_arrival_time: string;
    assigned_at: string;
    picked_up_at: string | null;
    out_for_delivery_at: string | null;
    delivered_at: string | null;
    received_at: string | null;
    delivery_notes: string | null;
    agent_lat: number | null;
    agent_lng: number | null;
    delivery_options: any;
    customer_accepted_at: string | null;
    order: {
        id: number;
        order_number: string;
        total: string;
        status: string;
        user_id?: number;
        items: Array<{
            id: number;
            product_name: string;
            product_model: string;
            quantity: number;
            unit_price: string;
            product: {
                images: Array<{
                    path: string;
                    is_primary: boolean;
                }>;
            };
        }>;
    };
    agent: {
        id: number;
        name: string;
        phone: string;
        avatar: string | null;
        vehicle_type: string | null;
        vehicle_number: string | null;
    } | null;
    trackingHistory: Array<{
        id: number;
        status: string;
        notes: string;
        created_at: string;
        lat: number | null;
        lng: number | null;
    }>;
}

export default function DeliveryTrackingPage() {
    const params = useParams();
    const router = useRouter();

    const pathname = usePathname();
    // Get current locale from URL
    const currentLocale = (pathname.split("/")[1] || "en") as "en" | "kh";
    const t = useTranslations(currentLocale);

    const deliveryId = params.id as string;
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [fullOrder, setFullOrder] = useState<Order | null>(null);
    const [echoInitialized, setEchoInitialized] = useState(false);

    const [echo, setEcho] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Define delivery status steps
    const statusSteps = [
        {
            status: 'assigned',
            label: t.deliveryTrack.orderAssigned,
            description: t.deliveryTrack.deliveryAgent,
            icon: <RiCustomerService2Line className="w-6 h-6" />
        },
        {
            status: 'picked_up',
            label: t.deliveryTrack.pickedUp,
            description: t.deliveryTrack.yourOrder,
            icon: <TbTruckDelivery className="w-6 h-6" />
        },
        {
            status: 'out_for_delivery',
            label: t.deliveryTrack.outForDelivery,
            description: t.deliveryTrack.yourOrderIsOnTheWay,
            icon: <MdOutlineDeliveryDining className="w-6 h-6" />
        },
        {
            status: 'delivered',
            label: t.deliveryTrack.delivered,
            description: t.deliveryTrack.yourOrderHasBeenDelivered,
            icon: <IoIosCheckmarkCircle className="w-6 h-6" />
        },
        {
            status: 'completed',
            label: t.deliveryTrack.completed,
            description: t.deliveryTrack.orderCompletedSuccessfully,
            icon: <IoIosCheckmarkCircle className="w-6 h-6" />
        }
    ];

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        console.log("Loading user/token from localStorage:", {
            hasToken: !!storedToken,
            hasUser: !!storedUser,
            userId: storedUser ? JSON.parse(storedUser).id : 'none'
        });

        setToken(storedToken);
        setUser(storedUser ? JSON.parse(storedUser) : null);
    }, []);


    useEffect(() => {
        fetchDelivery();

        // Set up interval to refresh delivery status every 30 seconds
        const interval = setInterval(fetchDelivery, 30000);

        return () => {
            clearInterval(interval);
            disconnectEcho();
        };
    }, [deliveryId]);

    useEffect(() => {
        if (delivery) {
            // Determine current step based on delivery status
            const stepIndex = statusSteps.findIndex(step => step.status === delivery.status);
            setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
        }
    }, [delivery]);


    const fetchOrder = async (orderId: number) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch order: ${res.statusText}`);
            }

            const data = await res.json();

            // Check different possible response formats
            if (data.order) {
                setFullOrder(data.order);
            } else if (data.success && data.data) {
                setFullOrder(data.data);
            } else {
                setFullOrder(data);
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            // Fallback: use the delivery order data if available
            if (delivery?.order) {
                setFullOrder(delivery.order as unknown as Order);
            }
        }
    };

    const handleShowOrderDetail = async () => {
        if (delivery?.order?.id) {
            await fetchOrder(delivery.order.id);
            setShowOrderDetail(true);
        } else {
            // If no order ID, just show the modal with available data
            setShowOrderDetail(true);
        }
    };

    const fetchDelivery = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/auth/login");
                return;
            }

            setRefreshing(true);
            const response = await fetch(`${API_BASE_URL}/api/deliveries/${deliveryId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDelivery(data.delivery);
            } else {
                setError("Failed to fetch delivery information");
            }
        } catch (error) {
            setError("An error occurred while fetching delivery information");
            console.error("Delivery fetch error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Listen to Channel 
    useEffect(() => {
        const initializeEchoAndListen = async () => {
            if (!token || !deliveryId) return;

            try {
                // Initialize Echo
                const echo = initializeEcho(token);
                if (!echo) return;

                setEcho(echo);

                // Listen for delivery status updates
                const channelName = `delivery.${deliveryId}`;
                const channel = echo.channel(channelName);

                channel.listen('.delivery.status.updated', (e: any) => {
                    console.log("Delivery status updated via Echo:", e);
                    if (e.delivery?.id === parseInt(deliveryId)) {
                        setDelivery(prev => ({ ...prev!, ...e.delivery }));
                    }
                });

                // Listen for delivery assignment
                channel.listen('.delivery.assigned', (e: any) => {
                    console.log("Delivery assigned via Echo:", e);
                    if (e.delivery?.id === parseInt(deliveryId)) {
                        setDelivery(prev => ({ ...prev!, ...e.delivery }));
                    }
                });

                setEchoInitialized(true);
            } catch (error) {
                console.error("Error initializing Echo:", error);
            }
        };

        if (token && !echoInitialized) {
            initializeEchoAndListen();
        }

        return () => {
            // Cleanup when component unmounts
            if (echo) {
                echo.disconnect();
            }
        };
    }, [token, deliveryId, echoInitialized]);

    const handleConfirmReceipt = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(
                `${API_BASE_URL}/api/deliveries/${deliveryId}/confirm-receipt`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                // Refresh delivery data
                fetchDelivery();

                // push to home page 
                router.push(`/${currentLocale}/customer`);
            } else {
                alert("Failed to confirm receipt. Please try again.");
            }
        } catch (error) {
            console.error("Error confirming receipt:", error);
            alert("An error occurred. Please try again.");
        }
    };

    const handleContactAgent = () => {
        if (delivery?.agent) {
            setShowChatModal(true);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'assigned': return 'bg-blue-100 text-blue-800';
            case 'picked_up': return 'bg-yellow-100 text-yellow-800';
            case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "Not available";
        return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a");
    };

    const getEstimatedTime = () => {
        if (!delivery?.estimated_arrival_time) return "Not available";

        const now = new Date();
        const arrivalTime = new Date(delivery.estimated_arrival_time);
        const diffMs = arrivalTime.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / (1000 * 60));

        if (diffMins <= 0) return "Arriving anytime now";
        if (diffMins < 60) return `Arriving in ${diffMins} minutes`;

        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        return `Arriving in ${diffHours}h ${remainingMins}m`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 border-t-black border-gray-200 dark:border-gray-700"></div>

                    <p className="text-gray-600 dark:text-gray-400">Loading delivery information...</p>
                </div>
            </div>
        );
    }

    if (error || !delivery) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {error || "Delivery not found"}
                    </h2>
                    <Link
                        href="/customer/orders"
                        className="inline-flex items-center text-blue-600 hover:underline dark:text-blue-400"
                    >
                        <IoIosArrowBack className="mr-2" />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {t.deliveryTrack.trackYourDelivery}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {t.orderDetail.order} #{delivery.order.order_number}
                            </p>
                        </div>

                        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                                {delivery.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Delivery Progress */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        {t.deliveryTrack.deliveryStatus}
                    </h2>

                    {/* Progress Steps */}
                    <div className="relative mb-8">
                        {/* Progress Line */}
                        <div className="absolute left-4 top-4 h-3/4 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                        <div className="space-y-8 relative">
                            {statusSteps.map((step, index) => (
                                <div key={step.status} className="flex items-start space-x-4">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${index <= currentStep
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {step.icon}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className={`font-medium ${index <= currentStep
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {step.label}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {step.description}
                                        </p>

                                        {/* Show timestamp if this step is completed */}
                                        {index < currentStep && delivery && (
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                {formatDateTime(
                                                    index === 0 ? delivery.assigned_at :
                                                        index === 1 ? delivery.picked_up_at :
                                                            index === 2 ? delivery.out_for_delivery_at :
                                                                index === 3 ? delivery.delivered_at :
                                                                    delivery.received_at
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Estimated Arrival */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <BsClockHistory className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                            <div>
                                <h3 className="font-medium text-blue-800 dark:text-blue-300">{t.deliveryTrack.estimatedArrival}</h3>
                                <p className="text-blue-600 dark:text-blue-400">{getEstimatedTime()}</p>
                                {delivery.estimated_arrival_time && (
                                    <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">
                                        {formatDateTime(delivery.estimated_arrival_time)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Agent Information */}
                {delivery.agent && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t.deliveryTrack.deliveryAgent}
                        </h2>

                        <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-shrink-0">
                                {delivery.agent.avatar ? (
                                    <Image
                                        src={delivery.agent.avatar}
                                        alt={delivery.agent.name}
                                        width={64}
                                        height={64}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                                        <FaUser className="w-8 h-8 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-white">{delivery.agent.name}</h3>

                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5 mr-2"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        >
                                            <path d="M17 12a5 5 0 1 0-4.478-2.774a.82.82 0 0 1 .067.574l-.298 1.113a.65.65 0 0 0 .796.796l1.113-.298a.82.82 0 0 1 .574.067A5 5 0 0 0 17 12Z" />
                                            <path
                                                strokeLinecap="round"
                                                d="M15 7h4m-2 2V5M2.007 9.933c-.073 1.908.41 5.149 3.66 8.4A14 14 0 0 0 8 20.232M3.538 6.937c1.393-1.393 3.615-1.206 4.5.38l.649 1.162c.585 1.05.35 2.426-.572 3.349c0 0-1.12 1.119.91 3.148c2.028 2.028 3.147.91 3.147.91c.923-.923 2.3-1.158 3.349-.573l1.163.65c1.585.884 1.772 3.106.379 4.5c-.837.836-1.863 1.488-2.996 1.53A9.8 9.8 0 0 1 11 21.611"
                                            />
                                        </svg>
                                        <a href={`tel:${delivery.agent.phone}`} className="hover:underline">
                                            {delivery.agent.phone}
                                        </a>
                                    </div>

                                    {delivery.agent.vehicle_type && delivery.agent.vehicle_number && (
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <TbTruckDelivery className="w-4 h-4 mr-2" />
                                            <span>{delivery.agent.vehicle_type} ({delivery.agent.vehicle_number})</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Call Agent */}
                                <a
                                    href={`tel:${delivery.agent.phone}`}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition duration-200"
                                    title="Call Agent"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M17 12a5 5 0 1 0-4.478-2.774a.82.82 0 0 1 .067.574l-.298 1.113a.65.65 0 0 0 .796.796l1.113-.298a.82.82 0 0 1 .574.067A5 5 0 0 0 17 12Z" />
                                        <path
                                            strokeLinecap="round"
                                            d="M15 7h4m-2 2V5M2.007 9.933c-.073 1.908.41 5.149 3.66 8.4A14 14 0 0 0 8 20.232M3.538 6.937c1.393-1.393 3.615-1.206 4.5.38l.649 1.162c.585 1.05.35 2.426-.572 3.349c0 0-1.12 1.119.91 3.148c2.028 2.028 3.147.91 3.147.91c.923-.923 2.3-1.158 3.349-.573l1.163.65c1.585.884 1.772 3.106.379 4.5c-.837.836-1.863 1.488-2.996 1.53A9.8 9.8 0 0 1 11 21.611"
                                        />
                                    </svg>
                                </a>

                                {/* Chat Agent */}
                                <button
                                    onClick={handleContactAgent}
                                    className="flex items-center justify-center cursor-pointer w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
                                    title="Chat with Agent"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    >
                                        <path d="M8 10.5h8M8 14h5.5M17 3.338A9.95 9.95 0 0 0 12 2C6.477 2 2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10c0-1.821-.487-3.53-1.338-5" />
                                    </svg>
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t.ordersDetail.orderItems}
                        </h2>
                        <button
                            onClick={handleShowOrderDetail}
                            title="Show Order Details"
                            className="px-2 py-2 cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M9 4.46A9.8 9.8 0 0 1 12 4c4.182 0 7.028 2.5 8.725 4.704C21.575 9.81 22 10.361 22 12c0 1.64-.425 2.191-1.275 3.296C19.028 17.5 16.182 20 12 20s-7.028-2.5-8.725-4.704C2.425 14.192 2 13.639 2 12c0-1.64.425-2.191 1.275-3.296A14.5 14.5 0 0 1 5 6.821" /><path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z" /></g></svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {delivery.order?.items?.map((item) => {
                            const primaryImage = item.product.images?.find(img => img.is_primary);
                            const imageSrc = primaryImage
                                ? `${API_BASE_URL}/${primaryImage.path}`
                                : "/placeholder-product.png";

                            return (
                                <div key={item.id} className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="flex-shrink-0 w-16 h-16 relative">
                                        <Image
                                            src={imageSrc}
                                            alt={item.product_name}
                                            fill
                                            className="object-cover rounded-md"
                                        />
                                    </div>

                                    <div className="ml-4 flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white">{item.product_name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.product_model}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t.ordersDetail.qty}: {item.quantity} × ${item.unit_price}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">{t.cartPage.total}</span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                ${delivery.order.total}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Delivery History */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {t.deliveryTrack.deliveryHistory}
                    </h2>

                    <div className="space-y-4">
                        {delivery.trackingHistory?.length ? (
                            delivery.trackingHistory.map((tracking, index) => (
                                <div key={tracking.id} className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                                                {tracking.status.replace(/_/g, ' ')}
                                            </h3>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDateTime(tracking.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tracking.notes}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                {t.deliveryTrack.noTrackingHistory}
                            </p>
                        )}
                    </div>
                </div>

                {/* Delivery Options */}
                {delivery.delivery_options && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t.deliveryTrack.deliveryInstructions}
                        </h2>

                        <div className="space-y-3">
                            {delivery.delivery_options.instructions && (
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">{t.deliveryTrack.specialInstructions}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">{delivery.delivery_options.instructions}</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4">
                                {/* Leave at door */}
                                <label className="flex items-center space-x-2 cursor-pointer select-none px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
                                    <input
                                        type="checkbox"
                                        checked={delivery.delivery_options.leave_at_door || false}
                                        readOnly
                                        className="hidden peer"
                                    />
                                    <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-400 peer-checked:border-green-500 peer-checked:bg-green-500 transition"></span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t.deliveryTrack.leaveAtDoor}
                                    </span>
                                </label>

                                {/* Signature required */}
                                <label className="flex items-center space-x-2 cursor-pointer select-none px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
                                    <input
                                        type="checkbox"
                                        checked={delivery.delivery_options.signature_required || false}
                                        readOnly
                                        className="hidden peer"
                                    />
                                    <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-400 peer-checked:border-green-500 peer-checked:bg-green-500 transition"></span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t.deliveryTrack.signatureRequired}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Receipt Button */}
                {delivery.status === 'delivered' && !delivery.received_at && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t.deliveryTrack.confirmReceipt}
                        </h2>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                                {t.deliveryTrack.yourOrderHasBeenMarked}
                            </p>

                            <button
                                onClick={handleConfirmReceipt}
                                className="w-full cursor-pointer bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                {t.deliveryTrack.confirmReceiptOfDelivery}
                            </button>
                        </div>
                    </div>
                )}

                {/* Refresh Button */}
                <div className="flex items-center mb-4">
                    <div className={`flex items-center mr-4 ${echoInitialized ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 rounded-full mr-2 ${echoInitialized ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-sm">
                            {echoInitialized ? 'Live updates active' : 'Connecting...'}
                        </span>
                    </div>

                    {refreshing && (
                        <div className="flex items-center text-blue-600">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-sm">Refreshing data...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Modal */}
            {delivery.agent && (
                <ChatModal
                    isOpen={showChatModal}
                    onClose={() => setShowChatModal(false)}
                    agent={delivery.agent}
                />
            )}

            {/* Order Detail Modal */}
            <OrderDetailModal
                isOpen={showOrderDetail}
                onClose={() => setShowOrderDetail(false)}
                order={fullOrder}
                params={currentLocale === 'en' ? { locale: 'en' } : { locale: 'kh' }}
            />
        </div>
    );
}