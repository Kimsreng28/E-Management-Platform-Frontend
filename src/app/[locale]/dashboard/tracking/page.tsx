// app/[locale]/dashboard/tracking/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { use } from "react";
import {
    FiMap,
    FiPackage,
    FiTruck,
    FiClock,
    FiUser,
    FiPhone,
    FiNavigation,
    FiCheckCircle,
    FiStar,
    FiCalendar,
    FiTrendingUp,
    FiHash
} from "react-icons/fi";
import { TbHistory, TbMapPin } from "react-icons/tb";
import Swal from "sweetalert2";

// Dynamically import the map component
import dynamic from 'next/dynamic';
import initializeEcho from "@/lib/echo";
const DeliveryMap = dynamic(() => import('@/components/ui/customer/DeliveryMap'), {
    ssr: false,
    loading: () => <div className="h-[500px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"></div>,
});

interface Delivery {
    id: number;
    tracking_number: string;
    status: string;
    estimated_arrival_time: string | null;
    delivery_notes: string | null;
    customer_accepted_at: string | null;
    agent_lat?: number | null;
    agent_lng?: number | null;
    delivered_at?: string | null;
    customer: {
        name: string;
        phone: string;
        email: string;
    };
    order: {
        id: number;
        order_number: string;
        total: string;
        status: string;
        shipping_address: {
            address_line: string;
            city: string;
            state?: string;
            postal_code?: string;
            country?: string;
            latitude: number | null;
            longitude: number | null;
        };
        items?: Array<{
            product_name: string;
            quantity: number;
            unit_price: string;
            total?: string;
        }>;
    };
}

interface DeliveryHistory {
    id: number;
    tracking_number: string;
    status: string;
    delivered_at: string;
    estimated_arrival_time: string | null;
    agent_rating: number | null;
    customer_reviews: Array<{
        product_name: string;
        rating: number;
        comment: string;
        created_at: string;
        customer_name: string;
    }>;
    review_count: number;
    customer: {
        name: string;
        phone: string;
        email: string;
    };
    order: {
        id: number;
        order_number: string;
        total: string;
        status: string;
        shipping_address: {
            address_line: string;
            city: string;
            state?: string;
            postal_code?: string;
            country?: string;
        };
        items: Array<{
            product_name: string;
            quantity: number;
            unit_price: string;
            total: number;
        }>;
    };
}

export default function DeliveryAgentDashboard({
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

    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
    const [locationUpdating, setLocationUpdating] = useState(false);
    const [echo, setEcho] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [historyStats, setHistoryStats] = useState({
        total_deliveries: 0,
        average_rating: 0,
        total_reviews: 0
    });
    const [historyPagination, setHistoryPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        per_page: 10
    });

    const echoRef = useRef<any>(null);

    useEffect(() => {
        if (activeTab === 'active') {
            fetchActiveDeliveries();
        } else {
            fetchDeliveryHistory();
        }

        // Initialize Echo for real-time updates
        const initEcho = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const echoInstance = initializeEcho(token);
                    echoRef.current = echoInstance;
                    setEcho(echoInstance);
                    setupEchoListeners(echoInstance);
                } catch (error) {
                    console.error("Failed to initialize Echo:", error);
                }
            }
        };

        initEcho();

        // Get initial location
        updateInitialLocation();

        return () => {
            if (echoRef.current) {
                echoRef.current.disconnect();
            }
        };
    }, [activeTab]);

    const updateInitialLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('Got initial location:', { latitude, longitude });
                    setCurrentLocation({ lat: latitude, lng: longitude });

                    // Update location in backend
                    updateAllDeliveriesLocation(latitude, longitude);
                },
                (error) => {
                    console.error("Error getting initial location:", error);
                    // Set default location (Phnom Penh)
                    setCurrentLocation({ lat: 11.5564, lng: 104.9282 });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            console.warn('Geolocation is not supported by this browser');
            setCurrentLocation({ lat: 11.5564, lng: 104.9282 });
        }
    }, []);

    const setupEchoListeners = useCallback((echoInstance: any) => {
        if (!echoInstance) return;

        // Listen for delivery updates for the current user
        const user = JSON.parse(localStorage.getItem("user") || '{}');
        if (user.id) {
            echoInstance.private(`user.${user.id}`)
                .listen('.delivery.location.updated', (data: any) => {
                    console.log('Real-time location update:', data);
                    handleRealTimeLocationUpdate(data);
                })
                .listen('.delivery.status.updated', (data: any) => {
                    console.log('Real-time status update:', data);
                    handleRealTimeStatusUpdate(data);
                })
                .listen('.delivery.assigned', (data: any) => {
                    console.log('New delivery assigned:', data);
                    fetchActiveDeliveries();
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'New Delivery Assigned!',
                        showConfirmButton: false,
                        timer: 2000,
                        toast: true
                    });
                });
        }

        // Listen for general delivery channel updates
        echoInstance.channel('deliveries')
            .listen('.delivery.updated', (data: any) => {
                console.log('General delivery update:', data);
                handleRealTimeStatusUpdate(data);
            });
    }, []);

    const handleRealTimeLocationUpdate = useCallback((data: any) => {
        setDeliveries(prev => prev.map(d =>
            d.id === data.delivery_id
                ? {
                    ...d,
                    agent_lat: data.lat,
                    agent_lng: data.lng
                }
                : d
        ));

        if (selectedDelivery?.id === data.delivery_id) {
            setSelectedDelivery(prev => prev ? {
                ...prev,
                agent_lat: data.lat,
                agent_lng: data.lng
            } : null);
        }

        // Update current location if it's the current user
        const user = JSON.parse(localStorage.getItem("user") || '{}');
        if (user.id === data.user_id) {
            setCurrentLocation({ lat: data.lat, lng: data.lng });
        }
    }, [selectedDelivery]);

    const handleRealTimeStatusUpdate = useCallback((data: any) => {
        setDeliveries(prev => prev.map(d =>
            d.id === data.delivery_id
                ? { ...d, status: data.status }
                : d
        ));

        if (selectedDelivery?.id === data.delivery_id) {
            setSelectedDelivery(prev => prev ? { ...prev, status: data.status } : null);
        }

        // If delivery is completed, remove from active list
        if (data.status === 'delivered') {
            setDeliveries(prev => prev.filter(d => d.id !== data.delivery_id));
        }
    }, [selectedDelivery]);

    const fetchActiveDeliveries = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/auth/login");
                return;
            }

            setLoading(true);
            console.log('Fetching active deliveries...');

            const response = await fetch(`${API_BASE_URL}/api/delivery-agent/dashboard/deliveries`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Deliveries data received:', data.deliveries);
                setDeliveries(data.deliveries || []);

                // If no delivery selected, select first one
                if (!selectedDelivery && data.deliveries?.length > 0) {
                    setSelectedDelivery(data.deliveries[0]);
                }

                // Update location for deliveries without location
                const deliveriesWithoutLocation = data.deliveries?.filter((d: Delivery) =>
                    d.agent_lat === null || d.agent_lng === null
                );

                if (deliveriesWithoutLocation?.length > 0 && currentLocation) {
                    updateAllDeliveriesLocation(currentLocation.lat, currentLocation.lng);
                }
            } else {
                console.error('Failed to fetch deliveries:', response.status);
                setDeliveries([]);
            }
        } catch (error) {
            console.error("Error fetching active deliveries:", error);
            setDeliveries([]);
        } finally {
            setLoading(false);
        }
    }, [router, selectedDelivery, currentLocation]);

    const fetchDeliveryHistory = useCallback(async (page = 1) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/auth/login");
                return;
            }

            setLoadingHistory(true);

            const response = await fetch(`${API_BASE_URL}/api/delivery-agent/delivery-history?page=${page}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDeliveryHistory(data.deliveries || []);
                setHistoryStats(data.stats || {});
                setHistoryPagination(data.pagination || {
                    current_page: 1,
                    total_pages: 1,
                    total_items: 0,
                    per_page: 10
                });
            }
        } catch (error) {
            console.error("Error fetching delivery history:", error);
        } finally {
            setLoadingHistory(false);
        }
    }, [router]);

    const updateAllDeliveriesLocation = useCallback(async (lat: number, lng: number) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/delivery-agent/update-location`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lat, lng }),
            });

            if (response.ok) {
                // Local state will be updated via WebSocket
                console.log('Location updated for all deliveries');
            }
        } catch (error) {
            console.error("Error updating location:", error);
        }
    }, []);

    const updateCurrentLocation = useCallback(async () => {
        setLocationUpdating(true);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    setCurrentLocation({ lat, lng });
                    await updateAllDeliveriesLocation(lat, lng);

                    setLocationUpdating(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    Swal.fire({
                        position: 'top-end',
                        icon: 'error',
                        title: 'Location Error',
                        text: `Failed to get location: ${error.message}`,
                        showConfirmButton: false,
                        timer: 3000,
                        toast: true
                    });
                    setLocationUpdating(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: 'Not Supported',
                text: 'Geolocation is not supported by your browser',
                showConfirmButton: false,
                timer: 3000,
                toast: true
            });
            setLocationUpdating(false);
        }
    }, [updateAllDeliveriesLocation]);

    const updateDeliveryStatus = useCallback(async (deliveryId: number, status: string) => {
        try {
            setUpdatingStatus(deliveryId);

            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/deliveries/${deliveryId}/update-status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status,
                    notes: `Status updated to ${status}`
                }),
            });

            if (response.ok) {
                // Status will be updated via WebSocket
                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: 'Status Updated!',
                    showConfirmButton: false,
                    timer: 1500,
                    toast: true
                });
            } else {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            console.error("Error updating status:", error);
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: 'Update Failed',
                text: 'Failed to update delivery status',
                showConfirmButton: false,
                timer: 3000,
                toast: true
            });
        } finally {
            setUpdatingStatus(null);
        }
    }, []);

    const getStatusColor = useCallback((status: string) => {
        switch (status.toLowerCase()) {
            case 'assigned':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'picked_up':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'out_for_delivery':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'in_transit':
                return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
            case 'delivered':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    }, []);

    const getNextStatusAction = useCallback((currentStatus: string) => {
        switch (currentStatus) {
            case 'assigned':
                return { status: 'picked_up', label: 'Mark as Picked Up', color: 'bg-yellow-600 hover:bg-yellow-700' };
            case 'picked_up':
                return { status: 'out_for_delivery', label: 'Start Delivery', color: 'bg-purple-600 hover:bg-purple-700' };
            case 'out_for_delivery':
                return { status: 'in_transit', label: 'Mark as In Transit', color: 'bg-indigo-600 hover:bg-indigo-700' };
            case 'in_transit':
                return { status: 'delivered', label: 'Mark as Delivered', color: 'bg-green-600 hover:bg-green-700' };
            default:
                return null;
        }
    }, []);

    const calculateETA = useCallback((estimatedTime: string | null) => {
        if (!estimatedTime) return "Unknown";

        const now = new Date();
        const eta = new Date(estimatedTime);
        const diffMs = eta.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / (1000 * 60));

        if (diffMins <= 0) return "Arriving now";
        if (diffMins < 60) return `${diffMins} min`;

        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    }, []);

    const getProgressPercentage = useCallback((status: string): number => {
        const steps = ['assigned', 'picked_up', 'out_for_delivery', 'delivered'];
        const currentStep = steps.indexOf(status);
        const totalSteps = steps.length - 1;

        if (currentStep === -1) return 0;
        return (currentStep / totalSteps) * 100;
    }, []);

    const hasLocation = useCallback((delivery: Delivery): boolean => {
        const lat = delivery.agent_lat;
        const lng = delivery.agent_lng;

        if (lat === null || lat === undefined || lng === null || lng === undefined) {
            return false;
        }

        const latNum = Number(lat);
        const lngNum = Number(lng);

        return !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);

    const handlePageChange = useCallback((page: number) => {
        fetchDeliveryHistory(page);
    }, [fetchDeliveryHistory]);

    if (loading && activeTab === 'active') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            Delivery Agent Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Manage your deliveries and track your route
                        </p>
                    </div>

                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        {activeTab === 'active' && (
                            <button
                                onClick={updateCurrentLocation}
                                disabled={locationUpdating}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                <FiNavigation className={`mr-2 ${locationUpdating ? 'animate-spin' : ''}`} />
                                {locationUpdating ? 'Updating...' : 'Update Location'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex items-center px-4 py-3 font-medium text-sm ${activeTab === 'active'
                            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                            }`}
                    >
                        <FiPackage className="mr-2" />
                        Active Deliveries ({deliveries.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center px-4 py-3 font-medium text-sm ${activeTab === 'history'
                            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                            }`}
                    >
                        <TbHistory className="mr-2" />
                        Delivery History
                        {historyStats.total_deliveries > 0 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                                {historyStats.total_deliveries}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'active' ? (
                <>
                    {/* Current Location */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Current Location</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {currentLocation ? (
                                        <>
                                            Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                                            <br />
                                            <small className="text-gray-500">
                                                {echo ? 'Connected to real-time updates' : 'Connecting...'}
                                            </small>
                                        </>
                                    ) : (
                                        "Location not available. Please enable location services."
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center text-green-600 dark:text-green-400">
                                {echo ? (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                                        <span className="text-sm">Live</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-pulse"></div>
                                        <span className="text-sm">Connecting...</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Map View */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Delivery Route Map
                                    </h2>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Real-time tracking enabled
                                    </div>
                                </div>
                                <DeliveryMap
                                    height="500px"
                                    deliveries={deliveries}
                                    currentLocation={currentLocation}
                                    useCurrentLocationAsFallback={true}
                                />
                            </div>

                            {/* Deliveries List */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            Your Deliveries ({deliveries.length})
                                        </h2>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Updates in real-time
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {deliveries.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                <FiPackage className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400">No deliveries assigned</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                                New deliveries will appear automatically
                                            </p>
                                        </div>
                                    ) : (
                                        deliveries.map((delivery) => {
                                            const nextAction = getNextStatusAction(delivery.status);
                                            const customer = delivery.customer;
                                            const shippingAddress = delivery.order.shipping_address;
                                            const items = delivery.order.items || [];
                                            const deliveryHasLocation = hasLocation(delivery);

                                            return (
                                                <div
                                                    key={delivery.id}
                                                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${selectedDelivery?.id === delivery.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                        }`}
                                                    onClick={() => setSelectedDelivery(delivery)}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                                                                    {delivery.status.replace('_', ' ')}
                                                                </span>
                                                                <div className={`ml-2 w-2 h-2 rounded-full ${deliveryHasLocation ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                                                            </div>
                                                            <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                                                {delivery.tracking_number}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Order #{delivery.order.order_number}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                                                            <p className="font-medium">
                                                                {customer?.name || 'Customer name not available'}
                                                            </p>
                                                            {customer?.phone && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                                                    <FiPhone className="w-3 h-3 mr-1" />
                                                                    {customer.phone}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Address</p>
                                                            {shippingAddress ? (
                                                                <div className="flex items-center text-sm">
                                                                    <TbMapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                                                    {shippingAddress.address_line}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-400">Address not available</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">ETA</p>
                                                            <div className="flex items-center">
                                                                <FiClock className="w-4 h-4 mr-2 text-gray-400" />
                                                                <span className="font-medium">
                                                                    {calculateETA(delivery.estimated_arrival_time)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Location Status */}
                                                    {deliveryHasLocation ? (
                                                        <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                                                                <FiNavigation className="w-3 h-3 mr-1" />
                                                                Location active
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                                            <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
                                                                <FiNavigation className="w-3 h-3 mr-1" />
                                                                Waiting for location update
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Order Items Summary */}
                                                    {items.length > 0 && (
                                                        <div className="mb-4">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Items</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {items.slice(0, 3).map((item, index) => (
                                                                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                                                        {item.product_name} × {item.quantity}
                                                                    </span>
                                                                ))}
                                                                {items.length > 3 && (
                                                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                                                        +{items.length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action Button */}
                                                    {nextAction && (
                                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateDeliveryStatus(delivery.id, nextAction.status);
                                                                }}
                                                                disabled={updatingStatus === delivery.id}
                                                                className={`w-full py-2 text-white rounded-lg transition-colors ${nextAction.color} disabled:opacity-50`}
                                                            >
                                                                {updatingStatus === delivery.id ? (
                                                                    <div className="flex items-center justify-center">
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                                        Updating...
                                                                    </div>
                                                                ) : (
                                                                    nextAction.label
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Selected Delivery Details */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden sticky top-6">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Delivery Details
                                    </h2>
                                </div>

                                <div className="p-4">
                                    {selectedDelivery ? (
                                        <>
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{selectedDelivery.tracking_number}</h3>
                                                        <p className="text-gray-600 dark:text-gray-400">
                                                            Order #{selectedDelivery.order.order_number}
                                                        </p>
                                                    </div>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDelivery.status)}`}>
                                                        {selectedDelivery.status.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {/* Location Status Card */}
                                                <div className={`mb-4 p-3 rounded-lg ${hasLocation(selectedDelivery) ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-sm mb-1 flex items-center">
                                                                {hasLocation(selectedDelivery) ? (
                                                                    <>
                                                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                                                                        📍 Location Active
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                                                                        📍 Location Needed
                                                                    </>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                {hasLocation(selectedDelivery)
                                                                    ? 'Real-time tracking enabled'
                                                                    : 'Update status to enable tracking'
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Progress */}
                                                <div className="mb-6">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Delivery Progress</p>
                                                    <div className="relative px-4">
                                                        <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2">
                                                            <div
                                                                className="h-full bg-green-500 transition-all duration-500"
                                                                style={{
                                                                    width: `${getProgressPercentage(selectedDelivery.status)}%`
                                                                }}
                                                            ></div>
                                                        </div>

                                                        <div className="flex justify-between relative z-10">
                                                            {['assigned', 'picked_up', 'out_for_delivery', 'delivered'].map((status, index) => {
                                                                const isActive = status === selectedDelivery.status;
                                                                const isCompleted = getProgressPercentage(selectedDelivery.status) >= ((index + 1) * 25);

                                                                return (
                                                                    <div key={status} className="flex flex-col items-center">
                                                                        <div className={`
                                                                            w-8 h-8 rounded-full flex items-center justify-center
                                                                            transition-all duration-300
                                                                            ${isActive
                                                                                ? 'bg-blue-600 text-white border-2 border-blue-600 shadow-lg scale-110'
                                                                                : isCompleted
                                                                                    ? 'bg-green-500 text-white border-2 border-green-500'
                                                                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600'
                                                                            }
                                                                        `}>
                                                                            {isCompleted ? (
                                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                </svg>
                                                                            ) : (
                                                                                <span className="text-sm font-medium">{index + 1}</span>
                                                                            )}
                                                                        </div>

                                                                        <span className={`
                                                                            mt-2 text-xs font-medium capitalize text-center min-w-[80px]
                                                                            ${isActive
                                                                                ? 'text-blue-600 dark:text-blue-400'
                                                                                : isCompleted
                                                                                    ? 'text-green-600 dark:text-green-400'
                                                                                    : 'text-gray-500 dark:text-gray-400'
                                                                            }
                                                                        `}>
                                                                            {status.replace('_', ' ')}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Customer Information</h4>
                                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                        {selectedDelivery.customer ? (
                                                            <>
                                                                <p className="font-medium">{selectedDelivery.customer.name}</p>
                                                                {selectedDelivery.customer.phone && (
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                                                        <FiPhone className="w-3 h-3 mr-2" />
                                                                        {selectedDelivery.customer.phone}
                                                                    </p>
                                                                )}
                                                                {selectedDelivery.customer.email && (
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                        {selectedDelivery.customer.email}
                                                                    </p>
                                                                )}
                                                                {selectedDelivery.customer.phone && (
                                                                    <button
                                                                        onClick={() => window.open(`tel:${selectedDelivery.customer.phone}`)}
                                                                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                                    >
                                                                        Call Customer
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <p className="text-gray-500">Customer information not available</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Delivery Address</h4>
                                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                        {selectedDelivery.order.shipping_address ? (
                                                            <>
                                                                <div className="flex items-start">
                                                                    <TbMapPin className="w-4 h-4 mt-1 mr-2 text-gray-400 flex-shrink-0" />
                                                                    <div>
                                                                        <p>{selectedDelivery.order.shipping_address.address_line}</p>
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                            {selectedDelivery.order.shipping_address.city}
                                                                            {selectedDelivery.order.shipping_address.state && `, ${selectedDelivery.order.shipping_address.state}`}
                                                                            {selectedDelivery.order.shipping_address.postal_code && ` ${selectedDelivery.order.shipping_address.postal_code}`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {selectedDelivery.order.shipping_address.latitude &&
                                                                    selectedDelivery.order.shipping_address.longitude && (
                                                                        <button
                                                                            onClick={() => {
                                                                                const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedDelivery.order.shipping_address.latitude},${selectedDelivery.order.shipping_address.longitude}`;
                                                                                window.open(url, '_blank');
                                                                            }}
                                                                            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                                                        >
                                                                            <FiNavigation className="w-3 h-3 mr-1" />
                                                                            Open in Google Maps
                                                                        </button>
                                                                    )}
                                                            </>
                                                        ) : (
                                                            <p className="text-gray-500">Delivery address not available</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {selectedDelivery.delivery_notes && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Delivery Notes</h4>
                                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                                            <p className="text-sm">{selectedDelivery.delivery_notes}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedDelivery.order.items && selectedDelivery.order.items.length > 0 && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Order Items</h4>
                                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                            <div className="space-y-2">
                                                                {selectedDelivery.order.items.map((item, index) => (
                                                                    <div key={index} className="flex justify-between text-sm">
                                                                        <span className="truncate max-w-[70%]">{item.product_name}</span>
                                                                        <span className="font-medium whitespace-nowrap">
                                                                            {item.quantity} × ${item.unit_price}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quick Actions */}
                                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {selectedDelivery?.customer?.phone && (
                                                            <button
                                                                onClick={() => window.open(`tel:${selectedDelivery.customer.phone}`)}
                                                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                                                            >
                                                                <FiPhone className="w-4 h-4 mr-2" />
                                                                Call
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={updateCurrentLocation}
                                                            disabled={locationUpdating}
                                                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                                                        >
                                                            <FiNavigation className={`w-4 h-4 mr-2 ${locationUpdating ? 'animate-spin' : ''}`} />
                                                            Update Location
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const nextAction = getNextStatusAction(selectedDelivery.status);
                                                                if (nextAction) {
                                                                    updateDeliveryStatus(selectedDelivery.id, nextAction.status);
                                                                }
                                                            }}
                                                            disabled={!getNextStatusAction(selectedDelivery.status) || updatingStatus === selectedDelivery.id}
                                                            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center col-span-2"
                                                        >
                                                            <FiCheckCircle className="w-4 h-4 mr-2" />
                                                            {getNextStatusAction(selectedDelivery.status)?.label || 'Completed'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                <FiPackage className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400">Select a delivery to view details</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* History Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                                    <FiTrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Deliveries</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{historyStats.total_deliveries}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                                    <FiStar className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {historyStats.average_rating ? historyStats.average_rating.toFixed(1) : 'N/A'}
                                        {historyStats.average_rating && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/5</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                                    <FiStar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{historyStats.total_reviews}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery History List */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Delivery History ({historyPagination.total_items})
                                </h2>
                                <div className="flex items-center space-x-2">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Page {historyPagination.current_page} of {historyPagination.total_pages}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {loadingHistory ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700 mx-auto mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading delivery history...</p>
                            </div>
                        ) : deliveryHistory.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <TbHistory className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">No delivery history found</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                    Your completed deliveries will appear here
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {deliveryHistory.map((delivery) => (
                                        <div key={delivery.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {delivery.tracking_number}
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        Order #{delivery.order.order_number} • Delivered on {formatDate(delivery.delivered_at)}
                                                    </p>
                                                    {delivery.customer && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            Customer: {delivery.customer.name}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-4">
                                                    {delivery.agent_rating && (
                                                        <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                                                            <FiStar className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
                                                            <span className="font-medium text-green-700 dark:text-green-300">
                                                                {Number(delivery.agent_rating) % 1 === 0
                                                                    ? Number(delivery.agent_rating).toFixed(0)
                                                                    : Number(delivery.agent_rating).toFixed(1)}
                                                            </span>
                                                            <span className="text-xs text-green-600 dark:text-green-400 ml-1">/5</span>
                                                        </div>
                                                    )}
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                            ${delivery.order.total}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {delivery.review_count} review{delivery.review_count !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="mb-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Delivered Items</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {delivery.order.items.slice(0, 3).map((item, index) => (
                                                        <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                                            {item.product_name} × {item.quantity}
                                                        </span>
                                                    ))}
                                                    {delivery.order.items.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                                            +{delivery.order.items.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Customer Reviews */}
                                            {delivery.customer_reviews.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Customer Reviews</h4>
                                                    <div className="space-y-4">
                                                        {delivery.customer_reviews.map((review, index) => (
                                                            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center">
                                                                        <div className="flex items-center mr-3">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <FiStar
                                                                                    key={i}
                                                                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                                            {review.customer_name}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {formatDate(review.created_at)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {review.product_name}
                                                                </p>
                                                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                                                    {review.comment}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Delivery Address */}
                                            {delivery.order.shipping_address && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-start">
                                                        <TbMapPin className="w-4 h-4 mt-1 mr-2 text-gray-400 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                Delivery Address
                                                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {delivery.order.shipping_address.address_line}, {delivery.order.shipping_address.city}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {historyPagination.total_pages > 1 && (
                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Showing {((historyPagination.current_page - 1) * historyPagination.per_page) + 1} to {Math.min(historyPagination.current_page * historyPagination.per_page, historyPagination.total_items)} of {historyPagination.total_items} deliveries
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handlePageChange(historyPagination.current_page - 1)}
                                                    disabled={historyPagination.current_page === 1}
                                                    className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                    Page {historyPagination.current_page} of {historyPagination.total_pages}
                                                </span>
                                                <button
                                                    onClick={() => handlePageChange(historyPagination.current_page + 1)}
                                                    disabled={historyPagination.current_page === historyPagination.total_pages}
                                                    className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}