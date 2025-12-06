// components/ui/customer/MapSelectionModal.tsx
"use client";

import L from 'leaflet';
import dynamic from 'next/dynamic';
import { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";

// Dynamically import leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

// Create a custom icon since Leaflet's default icons may not load
const createCustomIcon = () => {
    return {
        iconUrl: `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="25" height="41">
                <path fill="%23dc2626" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>
            </svg>
        `)}`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -41],
    };
};

export default function MapSelectionModal({
    isOpen,
    onClose,
    onSelect,
    initialLat = 11.5564,
    initialLng = 104.9282,
}: MapModalProps) {
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number }>({
        lat: initialLat,
        lng: initialLng,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [mapKey, setMapKey] = useState(Date.now()); // Force re-render of map
    const mapRef = useRef<any>(null);

    // Reset location when modal opens or initial values change
    useEffect(() => {
        if (isOpen) {
            setSelectedLocation({ lat: initialLat, lng: initialLng });
            setIsLoading(true);
            setMapKey(Date.now()); // Force new map instance
        }
    }, [isOpen, initialLat, initialLng]);

    const handleMapClick = (e: any) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });
    };

    const handleConfirm = () => {
        onSelect(selectedLocation.lat, selectedLocation.lng);
        onClose();
    };

    const handleMapReady = () => {
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Select Your Exact Delivery Location</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-4">
                    {/* Info */}
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click on the map to select your exact delivery location. This helps our delivery agents find you easily and ensures accurate tracking.
                        </p>
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                <div>
                                    <span className="font-medium">Selected Coordinates:</span>
                                    <span className="ml-2 text-blue-600 dark:text-blue-400 font-mono">
                                        {Number(selectedLocation.lat).toFixed(6)}, {Number(selectedLocation.lng).toFixed(6)}
                                    </span>
                                </div>
                                <div className="mt-2 sm:mt-0">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Accuracy: <span className="font-medium text-green-600">High</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                        )}

                        <div style={{ height: "100%", width: "100%" }} key={mapKey}>
                            <MapContainer
                                center={[selectedLocation.lat, selectedLocation.lng]}
                                zoom={15}
                                style={{ height: "100%", width: "100%" }}
                                ref={mapRef}
                                whenReady={handleMapReady}
                                className="z-0"
                            >
                                <TileLayer
                                    attribution=''  // Empty attribution removes the text
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {/* Click handler component */}
                                <ClickHandler onMapClick={handleMapClick} />

                                <Marker
                                    position={[selectedLocation.lat, selectedLocation.lng]}
                                    icon={L.icon(createCustomIcon() as any)}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <p className="font-medium">Selected Location</p>
                                            <p className="text-sm">Latitude: {Number(selectedLocation.lat).toFixed(6)}</p>
                                            <p className="text-sm">Longitude: {Number(selectedLocation.lng).toFixed(6)}</p>
                                            <p className="text-xs text-gray-500 mt-1">Click anywhere to change</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>

                        {/* Add some custom attribution styling if needed */}
                        <style jsx global>{`
                            /* Hide leaflet attribution */
                            .leaflet-control-attribution {
                                display: none !important;
                            }
                            
                            /* Alternative: make it minimal and styled */
                            .leaflet-control-attribution.leaflet-control {
                                background: rgba(255, 255, 255, 0.7);
                                padding: 2px 5px;
                                font-size: 10px;
                                border-radius: 3px;
                            }
                            
                            .leaflet-control-attribution a {
                                color: #0066cc;
                                text-decoration: none;
                            }
                        `}</style>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (navigator.geolocation) {
                                    Swal.fire({
                                        title: 'Getting current location...',
                                        text: 'Please allow location access for more accuracy',
                                        icon: 'info',
                                        showCancelButton: true,
                                        confirmButtonText: 'Use Current Location',
                                        cancelButtonText: 'Keep Selected',
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            navigator.geolocation.getCurrentPosition(
                                                (position) => {
                                                    const { latitude, longitude } = position.coords;
                                                    setSelectedLocation({ lat: latitude, lng: longitude });
                                                    if (mapRef.current) {
                                                        mapRef.current.setView([latitude, longitude], 15);
                                                    }
                                                    Swal.fire({
                                                        icon: 'success',
                                                        title: 'Location updated!',
                                                        text: 'Using your current GPS location',
                                                        timer: 1500,
                                                        showConfirmButton: false,
                                                    });
                                                },
                                                () => {
                                                    Swal.fire({
                                                        icon: 'error',
                                                        title: 'Location access denied',
                                                        text: 'Using manually selected location instead',
                                                        timer: 2000,
                                                        showConfirmButton: false,
                                                    });
                                                    handleConfirm();
                                                }
                                            );
                                        } else {
                                            handleConfirm();
                                        }
                                    });
                                } else {
                                    handleConfirm();
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Separate click handler component that's inside MapContainer
const ClickHandler = dynamic(
    () =>
        Promise.resolve(({ onMapClick }: { onMapClick: (e: any) => void }) => {
            const L = require('leaflet');
            const { useMapEvents } = require('react-leaflet');

            useMapEvents({
                click: (e: any) => {
                    onMapClick(e);
                },
            });

            return null;
        }),
    { ssr: false }
);