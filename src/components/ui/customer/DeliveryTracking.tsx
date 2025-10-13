// components/ui/customer/DeliveryTrackingModal.tsx
"use client";

import { API_BASE_URL } from "@/lib/config";
import { useEffect, useState, useRef } from "react";
import { IoIosCheckmarkCircle, IoIosClose } from "react-icons/io";
import { MdOutlineDeliveryDining } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { BsClockHistory } from "react-icons/bs";
import { TbTruckDelivery } from "react-icons/tb";
import { RiCustomerService2Line } from "react-icons/ri";
import { format } from "date-fns";
import Image from "next/image";
import initializeEcho, { disconnectEcho } from "@/lib/echo";
import ChatModal from "./ChatModal";
import Swal from "sweetalert2";
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


interface DeliveryTrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: number;
    params?: { locale: "en" | "kh" };
}

export default function DeliveryTrackingModal({
    isOpen,
    onClose,
    orderId,
    params
}: DeliveryTrackingModalProps) {
    const language = params?.locale || "en";
    const t = useTranslations(language);
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [echoInitialized, setEchoInitialized] = useState(false);
    const [deliveryOptions, setDeliveryOptions] = useState({
        delivery_time: "",
        delivery_instructions: "",
        leave_at_door: false,
        signature_required: false,
    });

    const echoRef = useRef<any>(null);
    const channelRef = useRef<any>(null);

    // Define delivery status steps
    const statusSteps = [
        {
            status: "assigned",
            label: t.deliveryTrack.orderAssigned,
            description: t.deliveryTrack.deliveryAgent,
            icon: <RiCustomerService2Line className="w-5 h-5" />,
        },
        {
            status: "picked_up",
            label: t.deliveryTrack.pickedUp,
            description: t.deliveryTrack.yourOrder,
            icon: <TbTruckDelivery className="w-5 h-5" />,
        },
        {
            status: "out_for_delivery",
            label: t.deliveryTrack.outForDelivery,
            description: t.deliveryTrack.yourOrderIsOnTheWay,
            icon: <MdOutlineDeliveryDining className="w-5 h-5" />,
        },
        {
            status: "delivered",
            label: t.deliveryTrack.delivered,
            description: t.deliveryTrack.yourOrderHasBeenDelivered,
            icon: <IoIosCheckmarkCircle className="w-5 h-5" />,
        },
        {
            status: "completed",
            label: t.deliveryTrack.completed,
            description: t.deliveryTrack.orderCompletedSuccessfully,
            icon: <IoIosCheckmarkCircle className="w-5 h-5" />,
        },
    ];

    useEffect(() => {
        if (isOpen && orderId) {
            fetchDelivery();
        }
    }, [isOpen, orderId]);

    useEffect(() => {
        if (isOpen && delivery?.id) {
            initializeEchoListener();
        }

        return () => {
            // Clean up Echo connection when component unmounts or delivery changes
            if (channelRef.current) {
                channelRef.current.stopListening('.delivery.status.updated');
                channelRef.current.stopListening('.delivery.assigned');
                channelRef.current = null;
            }
            if (echoRef.current) {
                disconnectEcho();
                echoRef.current = null;
            }
            setEchoInitialized(false);
        };
    }, [isOpen, delivery?.id]);

    useEffect(() => {
        if (delivery) {
            console.log("Current delivery status:", delivery.status);
            const stepIndex = statusSteps.findIndex(step => step.status === delivery.status);
            console.log("Calculated step index:", stepIndex);
            setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
        }
    }, [delivery]);


    const initializeEchoListener = () => {
        if (!delivery?.id) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            // Clean up any existing Echo connection
            if (echoRef.current) {
                disconnectEcho();
                echoRef.current = null;
            }

            const echo = initializeEcho(token);
            if (!echo) return;

            echoRef.current = echo;

            const channelName = `delivery.${delivery.id}`;
            const channel = echo.channel(channelName);
            channelRef.current = channel;

            console.log("Listening to channel:", channelName);

            // Fixed event listeners
            channel.listen('.delivery.status.updated', (e: any) => {
                console.log("Delivery status updated via Echo:", e);
                if (e.delivery_id === delivery.id || e.delivery?.id === delivery.id) {
                    // Use the delivery object from the event if available
                    if (e.delivery) {
                        setDelivery(prev => ({
                            ...prev!,
                            ...e.delivery
                        }));
                    } else {
                        // Fallback: update just the status if delivery object isn't provided
                        setDelivery(prev => ({
                            ...prev!,
                            status: e.status
                        }));
                    }
                }
            });

            channel.listen('.delivery.assigned', (e: any) => {
                console.log("Delivery assigned via Echo:", e);
                if (e.delivery?.id === delivery.id) {
                    setDelivery(prev => ({
                        ...prev!,
                        ...e.delivery
                    }));
                }
            });

            // Listen for connection events
            channel.listen('.connected', () => {
                console.log("Connected to delivery channel");
                setEchoInitialized(true);
            });

            setEchoInitialized(true);
        } catch (error) {
            console.error("Error initializing Echo:", error);
        }
    };

    const fetchDelivery = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/delivery`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log("Delivery fetched:", data);

                if (data.success && data.delivery) {
                    setDelivery(data.delivery);

                    console.log("Delivery fetched:", data.delivery);

                    // Set delivery options if they exist
                    if (data.delivery.delivery_options) {
                        setDeliveryOptions({
                            delivery_time: data.delivery.delivery_options.delivery_time || "",
                            delivery_instructions: data.delivery.delivery_options.instructions || "",
                            leave_at_door: data.delivery.delivery_options.leave_at_door || false,
                            signature_required: data.delivery.delivery_options.signature_required || false,
                        });
                    } else if (!data.delivery.estimated_arrival_time) {
                        // Set default estimated arrival time if not provided
                        const defaultArrivalTime = new Date();
                        defaultArrivalTime.setDate(defaultArrivalTime.getDate() + 5); // 5 days from now
                        setDeliveryOptions(prev => ({
                            ...prev,
                            delivery_time: defaultArrivalTime.toISOString().slice(0, 16),
                        }));
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch delivery:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDelivery();
    };

    const handleAcceptDelivery = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE_URL}/api/deliveries/${delivery?.id}/accept`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ...deliveryOptions,
                        estimated_arrival_time: deliveryOptions.delivery_time,
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();

                setDelivery(prev => ({
                    ...prev,       // keep existing delivery state
                    ...data.delivery // update only changed fields
                }));

                Swal.fire({
                    position: "top-end", // top-right corner
                    icon: "success",
                    title: "Delivery options accepted!",
                    showConfirmButton: false,
                    timer: 2000, // auto close after 2 seconds
                    toast: true, // makes it a small toast popup
                });
            } else {
                const errorData = await response.json();
                Swal.fire({
                    position: "top-end",
                    icon: "error",
                    title: "Error",
                    text: errorData.message || "Failed to accept delivery options",
                    showConfirmButton: true,
                    toast: true,
                });
            }
        } catch (error) {
            console.error("Error accepting delivery:", error);
            Swal.fire({
                position: "top-end",
                icon: "error",
                title: "Error",
                text: "An error occurred. Please try again.",
                showConfirmButton: true,
                toast: true,
            });
        }
    };

    const handleConfirmReceipt = async () => {
        if (!delivery) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE_URL}/api/deliveries/${delivery.id}/confirm-receipt`,
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
                alert("Receipt confirmed successfully!");
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
            case "assigned":
                return "bg-blue-100 text-blue-800";
            case "picked_up":
                return "bg-yellow-100 text-yellow-800";
            case "out_for_delivery":
                return "bg-purple-100 text-purple-800";
            case "delivered":
                return "bg-green-100 text-green-800";
            case "completed":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "Not available";
        try {
            return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a");
        } catch (error) {
            return "Invalid date";
        }
    };

    const getEstimatedTime = () => {
        if (!delivery?.estimated_arrival_time) return "Not available";

        try {
            const now = new Date();
            const arrivalTime = new Date(delivery.estimated_arrival_time);

            // Check if the date is valid
            if (isNaN(arrivalTime.getTime())) return "Not available";

            const diffMs = arrivalTime.getTime() - now.getTime();
            const diffMins = Math.round(diffMs / (1000 * 60));

            if (diffMins <= 0) return "Arriving anytime now";
            if (diffMins < 60) return `Arriving in ${diffMins} minutes`;

            const diffHours = Math.floor(diffMins / 60);
            const remainingMins = diffMins % 60;
            return `Arriving in ${diffHours}h ${remainingMins}m`;
        } catch (error) {
            return "Not available";
        }
    };

    const getCurrentStepIndex = () => {
        if (!delivery) return 0;
        const stepIndex = statusSteps.findIndex(
            (step) => step.status === delivery.status
        );
        return stepIndex >= 0 ? stepIndex : 0;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t.deliveryTrack.deliveryTracking}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <IoIosClose className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
                        </div>
                    ) : !delivery ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                No delivery information available yet.
                            </p>
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Refresh
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Header Info */}
                            <div className="mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-500">
                                            {t.deliveryTrack.tracking} #: {delivery.tracking_number}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 sm:mt-0 ${getStatusColor(
                                            delivery.status
                                        )}`}
                                    >
                                        {delivery.status.replace(/_/g, " ").toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Delivery Options Form */}
                            {!delivery.customer_accepted_at && delivery.status === "assigned" && (
                                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
                                        {t.deliveryTrack.deliveryOptions}
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                                                {t.deliveryTrack.preferredDeliveryTime}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={deliveryOptions.delivery_time}
                                                onChange={(e) =>
                                                    setDeliveryOptions({ ...deliveryOptions, delivery_time: e.target.value })
                                                }
                                                min={new Date().toISOString().slice(0, 16)}
                                                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                                                {t.deliveryTrack.specialInstructions}
                                            </label>
                                            <textarea
                                                value={deliveryOptions.delivery_instructions}
                                                onChange={(e) =>
                                                    setDeliveryOptions({ ...deliveryOptions, delivery_instructions: e.target.value })
                                                }
                                                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows={3}
                                                placeholder={t.checkOutPage.anySpecialInstructions}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Leave at door */}
                                            <label className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={deliveryOptions.leave_at_door}
                                                    onChange={(e) =>
                                                        setDeliveryOptions({ ...deliveryOptions, leave_at_door: e.target.checked })
                                                    }
                                                    className="hidden peer"
                                                />
                                                <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-400 peer-checked:bg-green-500 peer-checked:border-green-500 transition-colors duration-200"></span>
                                                <span className="text-sm text-gray-900 dark:text-white">{t.deliveryTrack.leaveAtDoor}</span>
                                            </label>

                                            {/* Signature required */}
                                            <label className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={deliveryOptions.signature_required}
                                                    onChange={(e) =>
                                                        setDeliveryOptions({ ...deliveryOptions, signature_required: e.target.checked })
                                                    }
                                                    className="hidden peer"
                                                />
                                                <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-400 peer-checked:bg-green-500 peer-checked:border-green-500 transition-colors duration-200"></span>
                                                <span className="text-sm text-gray-900 dark:text-white">{t.deliveryTrack.signatureRequired}</span>
                                            </label>
                                        </div>

                                        <button
                                            onClick={handleAcceptDelivery}
                                            className="w-full bg-blue-600 cursor-pointer text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            {t.deliveryTrack.acceptDelivery}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Delivery Progress */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.deliveryTrack.deliveryStatus}
                                </h3>

                                {/* Progress Steps */}
                                <div className="relative mb-6">
                                    {/* Progress Line */}
                                    <div
                                        className="absolute left-4 top-4 h-3/4 w-0.5 bg-gray-300 dark:bg-gray-600"
                                        style={{ height: `${(statusSteps.length - 1) * 60}px` }}
                                    ></div>

                                    <div className="space-y-6 relative">
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
                                            <h3 className="font-medium text-blue-800 dark:text-blue-300">
                                                {t.deliveryTrack.estimatedArrival}
                                            </h3>
                                            <p className="text-blue-600 dark:text-blue-400">
                                                {getEstimatedTime()}
                                            </p>
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
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        {t.deliveryTrack.yourDeliveryAgent}
                                    </h3>

                                    <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-600 rounded-lg">
                                        <div className="flex-shrink-0">
                                            {delivery.agent.avatar ? (
                                                <Image
                                                    src={delivery.agent.avatar}
                                                    alt={delivery.agent.name}
                                                    width={48}
                                                    height={48}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <FaUser className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {delivery.agent.name}
                                            </h4>

                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                    <span>{delivery.agent.phone}</span>
                                                </div>

                                                {delivery.agent.vehicle_type &&
                                                    delivery.agent.vehicle_number && (
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <TbTruckDelivery className="w-4 h-4 mr-2" />
                                                            <span>
                                                                {delivery.agent.vehicle_type} (
                                                                {delivery.agent.vehicle_number})
                                                            </span>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
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

                            {/* Confirm Receipt Button */}
                            {delivery.status === "delivered" &&
                                !delivery.received_at && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                                        <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                                            Your order has been marked as delivered. Please confirm that
                                            you have received it.
                                        </p>

                                        <button
                                            onClick={handleConfirmReceipt}
                                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Confirm Receipt of Delivery
                                        </button>
                                    </div>
                                )}

                            {/* Real-time connection indicator */}
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
                        </>
                    )}
                </div>
            </div>

            {/* Chat Modal */}
            {showChatModal && (
                <ChatModal
                    isOpen={showChatModal}
                    onClose={() => setShowChatModal(false)}
                    agent={delivery?.agent!}
                />
            )}

        </div>
    );
}