// components/ui/customer/DeliveryMap.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import initializeEcho from "@/lib/echo";

// default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
    iconUrl: "/leaflet/images/marker-icon.png",
    shadowUrl: "/leaflet/images/marker-shadow.png",
});

interface DeliveryMarker {
    id: number;
    tracking_number: string;
    status: string;
    agent_lat?: number | null;
    agent_lng?: number | null;
    customer?: {
        name: string;
        phone: string;
        email: string;
    };
    order: {
        shipping_address?: {
            address_line: string;
            city: string;
            state?: string;
            postal_code?: string;
            country?: string;
            latitude: number | null;
            longitude: number | null;
        };
    };
}

interface DeliveryMapProps {
    height?: string;
    deliveries: DeliveryMarker[];
    currentLocation?: {
        lat: number;
        lng: number;
    } | null;
    useCurrentLocationAsFallback?: boolean;
    onLocationUpdate?: (deliveryId: number, lat: number, lng: number) => void;
}

interface RouteData {
    coordinates: [number, number][];
    distance: number;
    duration: number;
    deliveryId: number;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
    height = "500px",
    deliveries,
    currentLocation = null,
    useCurrentLocationAsFallback = true,
    onLocationUpdate
}) => {
    const mapRef = useRef<any>(null);
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [loadingRoutes, setLoadingRoutes] = useState<number[]>([]);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([11.55, 104.9167]);
    const [echo, setEcho] = useState<any>(null);
    const [markers, setMarkers] = useState<DeliveryMarker[]>(deliveries);

    useEffect(() => {
        setMarkers(deliveries);
    }, [deliveries]);

    // Initialize Echo for real-time updates
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token && !echo) {
            const echoInstance = initializeEcho(token);
            setEcho(echoInstance);
            setupEchoListeners(echoInstance);
        }

        return () => {
            if (echo) {
                echo.disconnect();
            }
        };
    }, []);

    const setupEchoListeners = (echoInstance: any) => {
        if (!echoInstance) return;

        // Listen for location updates for all deliveries
        markers.forEach(marker => {
            echoInstance.private(`delivery.${marker.id}`)
                .listen('.delivery.location.updated', (data: any) => {
                    console.log('Location update received in map:', data);

                    // Update the marker location
                    setMarkers(prev => prev.map(m =>
                        m.id === data.delivery_id
                            ? {
                                ...m,
                                agent_lat: data.lat,
                                agent_lng: data.lng
                            }
                            : m
                    ));

                    // Call the parent callback if provided
                    if (onLocationUpdate) {
                        onLocationUpdate(data.delivery_id, data.lat, data.lng);
                    }

                    // Recalculate route for this delivery
                    const updatedMarker = markers.find(m => m.id === data.delivery_id);
                    if (updatedMarker) {
                        const agentLocation = getAgentLocationForDelivery(updatedMarker);
                        const destLat = parseCoordinate(updatedMarker.order.shipping_address?.latitude);
                        const destLng = parseCoordinate(updatedMarker.order.shipping_address?.longitude);

                        if (agentLocation.lat && agentLocation.lng && destLat && destLng) {
                            // Remove old route and fetch new one
                            setRoutes(prev => prev.filter(r => r.deliveryId !== data.delivery_id));
                            getRoute(agentLocation.lat, agentLocation.lng, destLat, destLng, data.delivery_id);
                        }
                    }
                });
        });

        const user = JSON.parse(localStorage.getItem("user") || '{}');
        if (user.id) {
            echoInstance.private(`user.${user.id}`)
                .listen('.delivery.location.updated', (data: any) => {
                    console.log('User channel location update:', data);

                    // Update the marker location
                    setMarkers(prev => prev.map(m =>
                        m.id === data.delivery_id
                            ? {
                                ...m,
                                agent_lat: data.lat,
                                agent_lng: data.lng
                            }
                            : m
                    ));

                    // Recalculate route
                    const updatedMarker = markers.find(m => m.id === data.delivery_id);
                    if (updatedMarker) {
                        const agentLocation = getAgentLocationForDelivery(updatedMarker);
                        const destLat = parseCoordinate(updatedMarker.order.shipping_address?.latitude);
                        const destLng = parseCoordinate(updatedMarker.order.shipping_address?.longitude);

                        if (agentLocation.lat && agentLocation.lng && destLat && destLng) {
                            setRoutes(prev => prev.filter(r => r.deliveryId !== data.delivery_id));
                            getRoute(agentLocation.lat, agentLocation.lng, destLat, destLng, data.delivery_id);
                        }
                    }
                });
        }
    };

    // Find center based on deliveries with location
    const getCenter = (): [number, number] => {
        // First, check if we have deliveries with agent location
        const deliveriesWithAgentLocation = deliveries.filter(d =>
            d.agent_lat && d.agent_lng
        );

        // If we have agent locations, use the first one
        if (deliveriesWithAgentLocation.length > 0) {
            return [
                deliveriesWithAgentLocation[0].agent_lat!,
                deliveriesWithAgentLocation[0].agent_lng!
            ];
        }

        // If no agent locations but we have customer addresses, use the first customer address
        const deliveriesWithCustomerLocation = deliveries.filter(d =>
            d.order.shipping_address?.latitude && d.order.shipping_address?.longitude
        );

        if (deliveriesWithCustomerLocation.length > 0) {
            return [
                parseCoordinate(deliveriesWithCustomerLocation[0].order.shipping_address!.latitude)!,
                parseCoordinate(deliveriesWithCustomerLocation[0].order.shipping_address!.longitude)!
            ];
        }

        // If we have current location, use it
        if (currentLocation) {
            return [currentLocation.lat, currentLocation.lng];
        }

        // Default to Phnom Penh
        return [11.55, 104.9167];
    };

    // Update map center when deliveries or current location change
    useEffect(() => {
        const newCenter = getCenter();
        setMapCenter(newCenter);

        // Also move the map if it's already initialized
        if (mapRef.current) {
            mapRef.current.setView(newCenter, mapRef.current.getZoom());
        }
    }, [deliveries, currentLocation]);

    // SVG for delivery truck icon
    const truckSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="white" width="20" height="20">
            <path d="M368 0C394.5 0 416 21.49 416 48V96H466.7C483.7 96 499.1 102.7 512 114.7L589.3 192C601.3 204 608 220.3 608 237.3V352C625.7 352 640 366.3 640 384C640 401.7 625.7 416 608 416H576C576 469 533 512 480 512C426.1 512 384 469 384 416H256C256 469 213 512 160 512C106.1 512 64 469 64 416H48C21.49 416 0 394.5 0 368V48C0 21.49 21.49 0 48 0H368zM416 160V256H544V237.3L466.7 160H416zM160 368C133.5 368 112 389.5 112 416C112 442.5 133.5 464 160 464C186.5 464 208 442.5 208 416C208 389.5 186.5 368 160 368zM480 464C506.5 464 528 442.5 528 416C528 389.5 506.5 368 480 368C453.5 368 432 389.5 432 416C432 442.5 453.5 464 480 464z"/>
        </svg>
    `;

    // SVG for destination pin icon
    const pinSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="white" width="16" height="16">
            <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192C0 85.961 85.961 0 192 0C298 0 384 85.961 384 192C384 269.413 357.03 291.031 211.732 501.67C202.197 515.444 181.803 515.444 172.268 501.67ZM192 272C227.3 272 256 243.3 256 208C256 172.7 227.3 144 192 144C156.7 144 128 172.7 128 208C128 243.3 156.7 272 192 272Z"/>
        </svg>
    `;

    // Custom icons for agent with location
    const agentIcon = L.divIcon({
        html: `
            <div style="
                width: 36px;
                height: 36px;
                background: #3b82f6;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                position: relative;
            ">
                ${truckSVG}
                <div style="
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    width: 12px;
                    height: 12px;
                    background: #22c55e;
                    border: 2px solid white;
                    border-radius: 50%;
                "></div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        className: "delivery-agent-marker",
    });

    // Custom icon for agent without location (using current location)
    const agentIconNoLocation = L.divIcon({
        html: `
            <div style="
                width: 36px;
                height: 36px;
                background: #f59e0b;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                position: relative;
            ">
                ${truckSVG}
                <div style="
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 24px;
                    height: 24px;
                    background: #f59e0b;
                    border: 2px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                ">?</div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        className: "delivery-agent-marker-no-location",
    });

    // Custom icon for current location (if no agent location)
    const currentLocationIcon = L.divIcon({
        html: `
            <div style="
                width: 32px;
                height: 32px;
                background: #ef4444;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                position: relative;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="white" width="16" height="16">
                    <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192C0 85.961 85.961 0 192 0C298 0 384 85.961 384 192C384 269.413 357.03 291.031 211.732 501.67C202.197 515.444 181.803 515.444 172.268 501.67ZM192 272C227.3 272 256 243.3 256 208C256 172.7 227.3 144 192 144C156.7 144 128 172.7 128 208C128 243.3 156.7 272 192 272Z"/>
                </svg>
                <div style="
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 16px;
                    height: 16px;
                    background: #ef4444;
                    border: 2px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    font-weight: bold;
                ">C</div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: "current-location-marker",
    });

    const destinationIcon = L.divIcon({
        html: `
            <div style="
                width: 32px;
                height: 32px;
                background: #10b981;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                position: relative;
            ">
                ${pinSVG}
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: "destination-marker",
    });

    // Function to parse coordinates
    const parseCoordinate = (coord: any): number | null => {
        if (coord === null || coord === undefined || coord === 'null') {
            return null;
        }

        const num = Number(coord);
        return isNaN(num) ? null : num;
    };

    // Function to get agent location for a delivery
    const getAgentLocationForDelivery = (delivery: DeliveryMarker): { lat: number | null; lng: number | null } => {
        // First try to get agent's stored location
        const agentLat = parseCoordinate(delivery.agent_lat);
        const agentLng = parseCoordinate(delivery.agent_lng);

        if (agentLat !== null && agentLng !== null) {
            return { lat: agentLat, lng: agentLng };
        }

        // If no stored location and we're using current location as fallback
        if (useCurrentLocationAsFallback && currentLocation) {
            return { lat: currentLocation.lat, lng: currentLocation.lng };
        }

        return { lat: null, lng: null };
    };

    // Filter deliveries that have destination location
    const deliveriesWithDestinations = deliveries.filter(delivery => {
        const destLat = delivery.order.shipping_address?.latitude
            ? parseCoordinate(delivery.order.shipping_address.latitude)
            : null;
        const destLng = delivery.order.shipping_address?.longitude
            ? parseCoordinate(delivery.order.shipping_address.longitude)
            : null;

        return destLat !== null && destLng !== null;
    });

    // Get deliveries that can show routes (have both start and end points)
    const deliveriesWithRouteInfo = deliveriesWithDestinations.map(delivery => {
        const agentLocation = getAgentLocationForDelivery(delivery);
        const destLat = parseCoordinate(delivery.order.shipping_address?.latitude)!;
        const destLng = parseCoordinate(delivery.order.shipping_address?.longitude)!;

        return {
            ...delivery,
            agentLocation,
            destination: { lat: destLat, lng: destLng }
        };
    }).filter(d => d.agentLocation.lat !== null && d.agentLocation.lng !== null);

    // Function to get route from OpenRouteService API
    const getRoute = async (startLat: number, startLng: number, endLat: number, endLng: number, deliveryId: number) => {
        try {
            setLoadingRoutes(prev => [...prev, deliveryId]);
            setRouteError(null);

            // OpenRouteService API endpoint (free tier available)
            const apiKey = process.env.NEXT_PUBLIC_OPENROUTE_API_KEY || 'your-api-key-here';

            const response = await fetch(
                `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startLng},${startLat}&end=${endLng},${endLat}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Route API error: ${response.status}`);
            }

            const data = await response.json();

            // Extract coordinates from the route
            if (data.features && data.features.length > 0) {
                const coordinates = data.features[0].geometry.coordinates.map((coord: [number, number]) =>
                    [coord[1], coord[0]] as [number, number] // Convert from [lng, lat] to [lat, lng]
                );

                const routeData: RouteData = {
                    coordinates,
                    distance: data.features[0].properties.segments[0].distance || 0,
                    duration: data.features[0].properties.segments[0].duration || 0,
                    deliveryId
                };

                setRoutes(prev => [...prev.filter(r => r.deliveryId !== deliveryId), routeData]);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            setRouteError('Could not load road routes. Showing straight line path.');

            // Fallback to straight line if API fails
            const fallbackRoute: RouteData = {
                coordinates: [
                    [startLat, startLng],
                    [endLat, endLng]
                ],
                distance: 0,
                duration: 0,
                deliveryId
            };
            setRoutes(prev => [...prev.filter(r => r.deliveryId !== deliveryId), fallbackRoute]);
        } finally {
            setLoadingRoutes(prev => prev.filter(id => id !== deliveryId));
        }
    };

    // Fetch routes when deliveries change
    useEffect(() => {
        const deliveriesWithRouteInfo = markers
            .filter(delivery => {
                const agentLocation = getAgentLocationForDelivery(delivery);
                const destLat = parseCoordinate(delivery.order.shipping_address?.latitude);
                const destLng = parseCoordinate(delivery.order.shipping_address?.longitude);

                return agentLocation.lat !== null && agentLocation.lng !== null &&
                    destLat !== null && destLng !== null;
            })
            .map(delivery => {
                const agentLocation = getAgentLocationForDelivery(delivery);
                const destLat = parseCoordinate(delivery.order.shipping_address?.latitude)!;
                const destLng = parseCoordinate(delivery.order.shipping_address?.longitude)!;

                return {
                    ...delivery,
                    agentLocation,
                    destination: { lat: destLat, lng: destLng }
                };
            })
            .filter(d => d.agentLocation.lat !== null && d.agentLocation.lng !== null);

        if (deliveriesWithRouteInfo.length > 0) {
            deliveriesWithRouteInfo.forEach(delivery => {
                const agentLat = delivery.agentLocation.lat!;
                const agentLng = delivery.agentLocation.lng!;
                const destLat = delivery.destination.lat;
                const destLng = delivery.destination.lng;

                // Check if route already exists
                const existingRoute = routes.find(r => r.deliveryId === delivery.id);
                if (!existingRoute && !loadingRoutes.includes(delivery.id)) {
                    getRoute(agentLat, agentLng, destLat, destLng, delivery.id);
                }
            });
        }
    }, [markers]);

    // Format distance for display
    const formatDistance = (meters: number): string => {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    };

    // Format duration for display
    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // Check if a delivery has its own agent location
    const hasAgentLocation = (delivery: DeliveryMarker): boolean => {
        const agentLat = parseCoordinate(delivery.agent_lat);
        const agentLng = parseCoordinate(delivery.agent_lng);
        return agentLat !== null && agentLng !== null;
    };

    // Check if using current location as fallback
    const isUsingCurrentLocation = (delivery: DeliveryMarker): boolean => {
        return !hasAgentLocation(delivery) && useCurrentLocationAsFallback && currentLocation !== null;
    };

    const totalDeliveries = deliveries.length;
    const deliveriesWithAgentLocation = deliveries.filter(hasAgentLocation).length;
    const deliveriesUsingCurrentLocation = deliveries.filter(isUsingCurrentLocation).length;
    const deliveriesWithoutLocation = totalDeliveries - deliveriesWithAgentLocation - deliveriesUsingCurrentLocation;

    console.log('Delivery stats:', {
        total: totalDeliveries,
        withAgentLocation: deliveriesWithAgentLocation,
        usingCurrentLocation: deliveriesUsingCurrentLocation,
        withoutLocation: deliveriesWithoutLocation
    });

    if (deliveries.length === 0) {
        return (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height }}>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="text-center p-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                            No deliveries available
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Waiting for new delivery assignments
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height }}>
            <style jsx global>{`
                .leaflet-control-attribution {
                    display: none !important;
                }
                
                /* Custom marker tooltips */
                .delivery-agent-marker::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 50%;
                    border: 2px solid rgba(59, 130, 246, 0.3);
                    animation: pulse 2s infinite;
                }
                
                .delivery-agent-marker-no-location::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 50%;
                    border: 2px solid rgba(245, 158, 11, 0.3);
                    animation: pulse 2s infinite;
                }
                
                .current-location-marker::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 50%;
                    border: 2px solid rgba(239, 68, 68, 0.3);
                    animation: pulse 2s infinite;
                }
                
                .destination-marker::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 50%;
                    border: 2px solid rgba(16, 185, 129, 0.3);
                    animation: pulse 2s infinite;
                }
                
                .route-loading {
                    stroke-dasharray: 10, 10;
                    animation: dash 1s linear infinite;
                }
                
                @keyframes pulse {
                    0% {
                        transform: scale(1);
                        opacity: 0.7;
                    }
                    70% {
                        transform: scale(1.3);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 0;
                    }
                }
                
                @keyframes dash {
                    to {
                        stroke-dashoffset: 20;
                    }
                }
            `}</style>

            <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
                scrollWheelZoom={true}
            >
                {/* Remove attribution text */}
                <TileLayer
                    attribution=''  // Empty string removes the attribution
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Show current location marker if available and not used for deliveries */}
                {currentLocation && !useCurrentLocationAsFallback && (
                    <Marker
                        position={[currentLocation.lat, currentLocation.lng]}
                        icon={currentLocationIcon}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="white" width="14" height="14">
                                            <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192C0 85.961 85.961 0 192 0C298 0 384 85.961 384 192C384 269.413 357.03 291.031 211.732 501.67C202.197 515.444 181.803 515.444 172.268 501.67ZM192 272C227.3 272 256 243.3 256 208C256 172.7 227.3 144 192 144C156.7 144 128 172.7 128 208C128 243.3 156.7 272 192 272Z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-red-600">
                                        Your Current Location
                                    </h3>
                                </div>
                                <p className="text-sm mb-2">
                                    <span className="font-medium">Latitude:</span> {currentLocation.lat.toFixed(6)}
                                </p>
                                <p className="text-sm mb-2">
                                    <span className="font-medium">Longitude:</span> {currentLocation.lng.toFixed(6)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    This is your current GPS position
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {deliveriesWithRouteInfo.map((delivery) => {
                    const agentLocation = delivery.agentLocation;
                    const destLat = delivery.destination.lat;
                    const destLng = delivery.destination.lng;
                    const route = routes.find(r => r.deliveryId === delivery.id);
                    const isLoading = loadingRoutes.includes(delivery.id);
                    const hasOwnLocation = hasAgentLocation(delivery);
                    const usingCurrentLocation = isUsingCurrentLocation(delivery);

                    return (
                        <div key={delivery.id}>
                            {/* Route line (road-based if available, otherwise straight line) */}
                            {route && (
                                <Polyline
                                    positions={route.coordinates}
                                    pathOptions={{
                                        color: hasOwnLocation ? '#3b82f6' : usingCurrentLocation ? '#f59e0b' : '#94a3b8',
                                        weight: 4,
                                        opacity: 0.8,
                                        lineCap: 'round',
                                        lineJoin: 'round',
                                        className: isLoading ? 'route-loading' : '',
                                        dashArray: hasOwnLocation ? undefined : '10, 10'
                                    }}
                                />
                            )}

                            {/* Agent location marker */}
                            {agentLocation.lat && agentLocation.lng && (
                                <Marker
                                    position={[agentLocation.lat, agentLocation.lng]}
                                    icon={hasOwnLocation ? agentIcon : agentIconNoLocation}
                                >
                                    <Popup>
                                        <div className="p-2 min-w-[200px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-6 h-6 rounded-full ${hasOwnLocation ? 'bg-blue-500' : 'bg-yellow-500'} flex items-center justify-center`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="white" width="14" height="14">
                                                        <path d="M368 0C394.5 0 416 21.49 416 48V96H466.7C483.7 96 499.1 102.7 512 114.7L589.3 192C601.3 204 608 220.3 608 237.3V352C625.7 352 640 366.3 640 384C640 401.7 625.7 416 608 416H576C576 469 533 512 480 512C426.1 512 384 469 384 416H256C256 469 213 512 160 512C106.1 512 64 469 64 416H48C21.49 416 0 394.5 0 368V48C0 21.49 21.49 0 48 0H368zM416 160V256H544V237.3L466.7 160H416zM160 368C133.5 368 112 389.5 112 416C112 442.5 133.5 464 160 464C186.5 464 208 442.5 208 416C208 389.5 186.5 368 160 368zM480 464C506.5 464 528 442.5 528 416C528 389.5 506.5 368 480 368C453.5 368 432 389.5 432 416C432 442.5 453.5 464 480 464z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-blue-600">
                                                        {delivery.tracking_number}
                                                    </h3>
                                                    {!hasOwnLocation && (
                                                        <span className="text-xs px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                                                            Using your location
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="capitalize text-sm mb-2">
                                                Status: <span className="font-medium">{delivery.status.replace("_", " ")}</span>
                                            </p>
                                            {!hasOwnLocation && (
                                                <div className="mb-2 p-2 bg-yellow-50 rounded">
                                                    <p className="text-xs text-yellow-700">
                                                        📍 Using your current GPS location as starting point
                                                    </p>
                                                </div>
                                            )}
                                            {route && (
                                                <div className="mb-2 p-2 bg-blue-50 rounded">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-medium">Distance:</span>
                                                        <span>{formatDistance(route.distance)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs mt-1">
                                                        <span className="font-medium">Est. Time:</span>
                                                        <span>{formatDuration(route.duration)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {delivery.customer && (
                                                <div className="mb-2">
                                                    <p className="text-sm">
                                                        <span className="font-medium">Customer:</span> {delivery.customer.name}
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="font-medium">Phone:</span> {delivery.customer.phone}
                                                    </p>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">
                                                {hasOwnLocation ? 'Agent Location' : 'Your Current Location'}
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Destination marker */}
                            <Marker
                                position={[destLat, destLng]}
                                icon={destinationIcon}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="white" width="12" height="12">
                                                    <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192C0 85.961 85.961 0 192 0C298 0 384 85.961 384 192C384 269.413 357.03 291.031 211.732 501.67C202.197 515.444 181.803 515.444 172.268 501.67ZM192 272C227.3 272 256 243.3 256 208C256 172.7 227.3 144 192 144C156.7 144 128 172.7 128 208C128 243.3 156.7 272 192 272Z" />
                                                </svg>
                                            </div>
                                            <h3 className="font-bold text-green-600">Delivery Destination</h3>
                                        </div>
                                        <p className="text-sm">{delivery.order.shipping_address?.address_line}</p>
                                        <p className="text-sm text-gray-600">
                                            {delivery.order.shipping_address?.city}
                                            {delivery.order.shipping_address?.state && `, ${delivery.order.shipping_address.state}`}
                                        </p>
                                        <p className="text-sm mt-1">
                                            Tracking: {delivery.tracking_number}
                                        </p>
                                        {route && (
                                            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Route Distance:</span>
                                                    <span>{formatDistance(route.distance)}</span>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            Customer's Address
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        </div>
                    );
                })}
            </MapContainer>

            {/* Route loading indicator */}
            {loadingRoutes.length > 0 && (
                <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md z-[1000]">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        <span className="text-sm font-medium">Loading road routes...</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {loadingRoutes.length} route{loadingRoutes.length > 1 ? 's' : ''} processing
                    </div>
                </div>
            )}

            {/* Map controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
                <button
                    onClick={() => mapRef.current?.setZoom(mapRef.current?.getZoom() + 1)}
                    className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Zoom in"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
                <button
                    onClick={() => mapRef.current?.setZoom(mapRef.current?.getZoom() - 1)}
                    className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Zoom out"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
                <button
                    onClick={() => mapRef.current?.setView(getCenter(), 13)}
                    className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Reset view"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md z-[1000]">
                <h4 className="font-medium text-sm mb-2">Legend</h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="white" width="16" height="16">
                                <path d="M368 0C394.5 0 416 21.49 416 48V96H466.7C483.7 96 499.1 102.7 512 114.7L589.3 192C601.3 204 608 220.3 608 237.3V352C625.7 352 640 366.3 640 384C640 401.7 625.7 416 608 416H576C576 469 533 512 480 512C426.1 512 384 469 384 416H256C256 469 213 512 160 512C106.1 512 64 469 64 416H48C21.49 416 0 394.5 0 368V48C0 21.49 21.49 0 48 0H368zM416 160V256H544V237.3L466.7 160H416zM160 368C133.5 368 112 389.5 112 416C112 442.5 133.5 464 160 464C186.5 464 208 442.5 208 416C208 389.5 186.5 368 160 368zM480 464C506.5 464 528 442.5 528 416C528 389.5 506.5 368 480 368C453.5 368 432 389.5 432 416C432 442.5 453.5 464 480 464z" />
                            </svg>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                            <span className="text-xs font-medium">Agent Location</span>
                            <div className="text-xs text-gray-500">Has stored coordinates</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="white" width="16" height="16">
                                <path d="M368 0C394.5 0 416 21.49 416 48V96H466.7C483.7 96 499.1 102.7 512 114.7L589.3 192C601.3 204 608 220.3 608 237.3V352C625.7 352 640 366.3 640 384C640 401.7 625.7 416 608 416H576C576 469 533 512 480 512C426.1 512 384 469 384 416H256C256 469 213 512 160 512C106.1 512 64 469 64 416H48C21.49 416 0 394.5 0 368V48C0 21.49 21.49 0 48 0H368zM416 160V256H544V237.3L466.7 160H416zM160 368C133.5 368 112 389.5 112 416C112 442.5 133.5 464 160 464C186.5 464 208 442.5 208 416C208 389.5 186.5 368 160 368zM480 464C506.5 464 528 442.5 528 416C528 389.5 506.5 368 480 368C453.5 368 432 389.5 432 416C432 442.5 453.5 464 480 464z" />
                            </svg>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold">?</div>
                        </div>
                        <div>
                            <span className="text-xs font-medium">Using Current Location</span>
                            <div className="text-xs text-gray-500">No stored coordinates</div>
                        </div>
                    </div>
                    {currentLocation && !useCurrentLocationAsFallback && (
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="white" width="14" height="14">
                                    <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192C0 85.961 85.961 0 192 0C298 0 384 85.961 384 192C384 269.413 357.03 291.031 211.732 501.67C202.197 515.444 181.803 515.444 172.268 501.67ZM192 272C227.3 272 256 243.3 256 208C256 172.7 227.3 144 192 144C156.7 144 128 172.7 128 208C128 243.3 156.7 272 192 272Z" />
                                </svg>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold">C</div>
                            </div>
                            <div>
                                <span className="text-xs font-medium">Your Current Location</span>
                                <div className="text-xs text-gray-500">GPS position</div>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="white" width="14" height="14">
                                <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192C0 85.961 85.961 0 192 0C298 0 384 85.961 384 192C384 269.413 357.03 291.031 211.732 501.67C202.197 515.444 181.803 515.444 172.268 501.67ZM192 272C227.3 272 256 243.3 256 208C256 172.7 227.3 144 192 144C156.7 144 128 172.7 128 208C128 243.3 156.7 272 192 272Z" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium">Customer Destination</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-2 bg-blue-500 opacity-80 rounded"></div>
                        <span className="text-xs">Route from Agent Location</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-2 bg-yellow-500 opacity-80 rounded border-dashed border-2 border-transparent"></div>
                        <span className="text-xs">Route from Your Location</span>
                    </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                    {routes.length > 0 ? (
                        <div>
                            Showing {deliveriesWithRouteInfo.length} delivery{deliveriesWithRouteInfo.length > 1 ? 's' : ''}
                            <div className="mt-1 text-gray-400">
                                • {deliveriesWithAgentLocation} with agent location
                                <br />
                                • {deliveriesUsingCurrentLocation} using your location
                                <br />
                                • {deliveriesWithoutLocation} without location
                            </div>
                        </div>
                    ) : (
                        <div>Calculating routes...</div>
                    )}
                </div>
                {routeError && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        ⚠️ {routeError}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryMap;