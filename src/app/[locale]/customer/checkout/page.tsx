// app/[locale]/customer/checkout/page.tsx
"use client";

import DeliveryTrackingModal from "@/components/ui/customer/DeliveryTracking";
import MapSelectionModal from "@/components/ui/customer/MapSelectionModal";
import OrderDetailModal from "@/components/ui/customer/OrderDetailModal";
import { useCart } from "@/contexts/CartContext";
import { API_BASE_URL } from "@/lib/config";
import { Address } from "@/types/address";
import { Order } from "@/types/order";
import { useTranslations } from "@/utils/useTranslations";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import dynamic from 'next/dynamic';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { use, useEffect, useRef, useState } from "react";
import { BsFillHouseAddFill } from "react-icons/bs";
import { FaCheck, FaCreditCard, FaShippingFast } from "react-icons/fa";
import { FaNoteSticky } from "react-icons/fa6";
import { HiOutlineDownload } from "react-icons/hi";
import { IoIosArrowBack, IoIosArrowUp } from "react-icons/io";
import {
  MdOutlineCancel,
  MdOutlineDeliveryDining,
  MdOutlineSaveAlt,
} from "react-icons/md";
import { RiCoupon3Fill } from "react-icons/ri";
import { TbReport } from "react-icons/tb";
import { VscDebugContinue } from "react-icons/vsc";
import { useMapEvents } from "react-leaflet";

import Swal from "sweetalert2";

// Initialize Stripe
const stripePromise = loadStripe(
  "pk_test_51PuwVDRo9UNVikjncEeJvDzuEJY7q4x6f73o9s5r53OILjGqdnecW7DvEmt7pNQM8sOsNbqx1Rh0JEdLhyIvfziQ00j961JlI6"
);



// Stripe Payment Form Component (unchanged)
function StripePaymentForm({
  clientSecret,
  onSuccess,
  onCancel,
  showFullScreenLoading,
  setShowFullScreenLoading,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  showFullScreenLoading?: boolean;
  setShowFullScreenLoading?: (loading: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      if (setShowFullScreenLoading) {
        setShowFullScreenLoading(false);
      }
      setProcessing(false);
      return;
    }

    if (setShowFullScreenLoading) {
      setShowFullScreenLoading(true);
    }

    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      if (setShowFullScreenLoading) {
        setShowFullScreenLoading(false);
      }
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    }

    setProcessing(false);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Enter Card Details</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
              },
            }}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 flex items-center cursor-pointer bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="m14.5 9.5l-5 5m0-5l5 5M7 3.338A9.95 9.95 0 0 1 12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.338-5" /></svg>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || processing}
            className="px-4 py-2 flex items-center cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7H9a5 5 0 0 0 0 10M20 7l-3-3m3 3l-3 3m-1 7h-3" /></svg>
            {processing ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </form>
    </div>
  );
}

// KHQR Modal Component (unchanged)
function KhqrModal({
  qrPayload,
  onSuccess,
  onCancel,
  paymentId,
  md5Hash,
  amount,
  currency = "USD"
}: {
  paymentId: number;
  qrPayload: string;
  md5Hash: string;
  amount: number;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed">(
    "pending"
  );
  const [isChecking, setIsChecking] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);

  const checkPaymentStatus = async (manual = false) => {
    if (isChecking || paymentStatus === "completed") return;

    const now = Date.now();
    if (!manual && now - lastCheckTime < 5000) return; // Rate limit 5s

    setIsChecking(true);
    setLastCheckTime(now);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/check-khqr-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          payment_id: paymentId,
          md5_hash: md5Hash,
        }),
      });

      if (!response.ok) throw new Error("Failed request");

      const result = await response.json();

      // Check completion from multiple indicators
      const isCompleted =
        result.payment_status === "completed" ||
        result.transaction_status === "completed" ||
        result.status === "completed";

      if (isCompleted) {
        setPaymentStatus("completed");

        setTimeout(() => {
          onSuccess();
        }, 1200);

        return;
      }

      setCheckCount((prev) => prev + 1);
      setError(null);

      if (checkCount > 8) {
        setError(
          "Payment is taking longer than expected. Please ensure you've completed payment in your bank app."
        );
      }
    } catch {
      setError("Network error while checking payment status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  // Auto polling
  useEffect(() => {
    if (!paymentId || paymentStatus === "completed") return;

    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    const schedule = () => {
      if (!mounted) return;

      const delay = Math.min(20000, 8000 + checkCount * 4000);

      timeoutId = setTimeout(() => {
        if (mounted && checkCount < 20) {
          checkPaymentStatus();
          schedule();
        } else if (mounted) {
          setError("Payment timeout. Please contact support if payment was completed.");
        }
      }, delay);
    };

    const initialCheck = setTimeout(() => {
      if (mounted) {
        checkPaymentStatus();
        schedule();
      }
    }, 2500);

    return () => {
      mounted = false;
      clearTimeout(initialCheck);
      clearTimeout(timeoutId);
    };
  }, [paymentId, md5Hash, paymentStatus, checkCount]);

  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amt);
  };

  return (
    <div className="p-0 rounded-2xl shadow-2xl bg-white dark:bg-gray-900 overflow-hidden max-w-xs mx-auto border border-gray-200 dark:border-gray-700">
      {/* Header - Red Theme */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1">
            <img
              src="/images/KHQR_logo.png"
              alt="KHQR"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-lg font-bold tracking-wide">KHQR PAYMENT</h2>
        </div>
      </div>

      {/* Amount Section */}
      <div className="px-6 py-4 text-center bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Amount to pay</p>
        <div className="flex items-center justify-center space-x-1">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">$</span>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatAmount(amount)}
          </p>
          <span className="text-lg font-medium text-gray-600 dark:text-gray-400 ml-1">{currency}</span>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="px-4 py-4 bg-white dark:bg-gray-900">
        <div className="relative bg-white p-4 rounded-xl border-2 border-black shadow-lg mx-auto" style={{ width: '240px', height: '240px' }}>
          <QRCodeCanvas
            value={qrPayload}
            size={208}
            includeMargin={false}
            style={{ width: '208px', height: '208px' }}
          />
          {/* Simple Dollar Icon Overlay - No Background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full border-2 border-red-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91 2.56.62 4.18 1.63 4.18 3.71 0 1.76-1.38 2.83-3.13 3.16z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="px-6 pb-6">
        {paymentStatus === "completed" ? (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center text-sm font-medium">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Payment verified successfully!</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-center text-sm">
            {error}
          </div>
        ) : (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-center text-sm">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span>{isChecking ? "Checking payment status..." : "Waiting for payment..."}</span>
            </div>
            <div className="text-xs mt-1 opacity-75">Auto-checking... ({checkCount + 1}/20)</div>
          </div>
        )}
      </div>

      {/* Footer - Minimal action buttons */}
      <div className="px-6 pb-4">
        <button
          onClick={onCancel}
          disabled={isChecking}
          className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Helper function to safely format numbers
const formatCurrency = (value: any): string => {
  if (value === null || value === undefined) return "0.00";

  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const unwrappedParams = use(params);
  const language = unwrappedParams.locale || "en";
  const t = useTranslations(language);
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [couponCode, setCouponCode] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [error, setError] = useState("");
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewAddressDropdown, setShowNewAddressDropdown] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    recipient_name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Cambodia",
    is_default: false,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [delivery, setDelivery] = useState<any>(null);
  const [showDeliveryTracking, setShowDeliveryTracking] = useState(false);
  const [showFullScreenLoading, setShowFullScreenLoading] = useState(false);

  // New states for map functionality
  const [showMapModal, setShowMapModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // Fetch user addresses when page loads
  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!cart?.items?.length) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/preview`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            items: cart.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
            })),
            coupon_code: couponCode || null,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setOrderSummary(data);
        } else {
          console.error("Failed to fetch order preview");
        }
      } catch (error) {
        console.error("Failed to fetch order preview:", error);
      }
    };

    fetchPreview();
  }, [cart, couponCode]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);

        // Set default address if available
        const defaultAddress = (data.addresses || []).find(
          (addr: Address) => addr.is_default
        );
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }

        console.log('Fetched addresses with coordinates:', data.addresses);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  // Function to save address coordinates
  const saveAddressCoordinates = async (addressId: number, lat: number, lng: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/addresses/${addressId}/coordinates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update local addresses state
        setAddresses(prev =>
          prev.map(addr =>
            addr.id === addressId
              ? { ...addr, latitude: lat, longitude: lng }
              : addr
          )
        );

        // Update selected address if it's the one being edited
        if (selectedAddress?.id === addressId) {
          setSelectedAddress((prev: Address | null) =>
            prev
              ? { ...prev, latitude: lat, longitude: lng }
              : null
          );
        }

        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Location saved successfully!',
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });

        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save coordinates');
      }
    } catch (error: any) {
      console.error('Failed to save coordinates:', error);
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Failed to save location',
        text: error.message || 'Please try again',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    }
    return false;
  };

  const fetchDeliveryInfo = async (orderId: number) => {
    try {
      // Fetch delivery information
      const deliveryRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}/delivery`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (deliveryRes.ok) {
        const deliveryData = await deliveryRes.json();
        if (deliveryData.success && deliveryData.delivery) {
          setDelivery(deliveryData.delivery);

          // If delivery exists but no agent is assigned, try to assign one
          if (!deliveryData.delivery.delivery_agent_id) {
            await assignDeliveryAgent(orderId);
          } else {
            setShowDeliveryTracking(true);
          }
          return;
        }
      }

      // If no delivery exists, try to assign one
      await assignDeliveryAgent(orderId);

    } catch (error) {
      console.error("Failed to fetch/assign delivery info:", error);
    }
  };

  const assignDeliveryAgent = async (orderId: number) => {
    try {
      const assignRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}/assign-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ auto_assign: true }),
      });

      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setDelivery(assignData.delivery);
        setShowDeliveryTracking(true);
      }
    } catch (error) {
      console.error("Failed to assign delivery agent:", error);
    }
  };

  const handleSaveNewAddress = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newAddress),
      });
      const data = await response.json();
      if (response.ok) {
        setAddresses((prev) => [...prev, data.data]);
        setSelectedAddress(data.data);
        setShowNewAddressDropdown(false);
        setNewAddress({
          label: "",
          recipient_name: "",
          phone: "",
          address_line_1: "",
          address_line_2: "",
          city: "",
          state: "",
          postal_code: "",
          country: "Cambodia",
          is_default: false,
          latitude: undefined,
          longitude: undefined,
        });

        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Address saved successfully!',
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
      } else {
        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: 'Failed to add address',
          text: data.message || 'Please check your information',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Error creating address',
        text: 'Please try again',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return true;

    try {
      // Calculate current order amount for validation
      const orderAmount = orderSummary?.subtotal || 0;

      const response = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          code: couponCode,
          order_amount: orderAmount
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Invalid or expired coupon code");
        return false;
      }

      return true;
    } catch (err) {
      setError("Failed to validate coupon");
      return false;
    }
  };

  const downloadInvoice = async (order: any) => {
    try {
      if (!order) return;

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(
        `${API_BASE_URL}/api/orders/${order.id}/invoice`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download invoice: ${response.statusText}`);
      }

      // Get the file as a Blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Invoice download error:", error);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      setError("Please select a shipping address");
      return;
    }

    // Warn if address has no coordinates
    if (!selectedAddress.latitude || !selectedAddress.longitude) {
      const result = await Swal.fire({
        title: 'Address Missing Location',
        text: 'Your address does not have precise coordinates. This may affect delivery accuracy. Would you like to set your exact location on a map?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Set Location',
        cancelButtonText: 'Continue Anyway',
      });

      if (result.isConfirmed) {
        setEditingAddressId(selectedAddress.id);
        setSelectedCoordinates(null);
        setShowMapModal(true);
        return;
      }
    }

    if (couponCode) {
      const valid = await validateCoupon();
      if (!valid) return;
    }

    setLoading(true);
    setShowFullScreenLoading(true);
    setError("");

    try {
      const orderData = {
        shipping_address_id: selectedAddress.id,
        billing_address_id: selectedAddress.id,
        notes: orderNotes,
        coupon_code: couponCode || null,
        items: cart?.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          options: item.options || {},
        })),
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setOrderSummary(result.order);
        setOrderId(result.order.id);

        if (paymentMethod === "cod") {
          // For COD, mark as paid and show success immediately
          await completeOrder(result.order.id);
          await fetchDeliveryInfo(result.order.id);
          setShowFullScreenLoading(false);
        } else {
          // For online payments, process payment
          await processPayment(result.order.id, result.order.total);
        }
      } else {
        setError(result.message || "Failed to create order");
        setLoading(false);
        setShowFullScreenLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError("An error occurred during checkout");
      setLoading(false);
      setShowFullScreenLoading(false);
    }
  };

  const processPayment = async (orderId: number, amount: number) => {
    const paymentData = {
      order_id: orderId,
      payment_method: paymentMethod,
      amount,
      currency: "USD",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Payment failed");
      }

      // Store payment data and show the appropriate payment modal
      setPaymentData(result);
      setShowPaymentModal(true);
      setShowFullScreenLoading(false);
    } catch (error: any) {
      setError(error.message || "Payment initialization failed");
      setLoading(false);
      setShowFullScreenLoading(false);
    }
  };

  const completeOrder = async (orderId: number, paymentId?: number) => {
    try {
      setShowFullScreenLoading(true);

      // 1. Handle payment creation for COD
      if (paymentMethod === "cod") {
        const codPaymentData = {
          order_id: orderId,
          payment_method: "cod",
          amount: total,
          currency: "USD",
          status: "pending",
        };

        const paymentRes = await fetch(`${API_BASE_URL}/api/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(codPaymentData),
        });

        if (!paymentRes.ok) {
          const errorData = await paymentRes.json();
          throw new Error(errorData.message || "Failed to create COD payment");
        }
      } else if (paymentId) {
        // For online payments, mark as completed
        const paymentRes = await fetch(
          `${API_BASE_URL}/api/payments/${paymentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              status: "completed",
              paid_at: new Date().toISOString(),
            }),
          }
        );

        if (!paymentRes.ok) {
          const errorData = await paymentRes.json();
          throw new Error(errorData.message || "Failed to update payment status");
        }
      }

      // 2. Use the dedicated completeOrder endpoint
      const orderRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.message || "Failed to complete order");
      }

      const result = await orderRes.json();

      // 3. Try to assign delivery agent
      try {
        const deliveryRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}/assign-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ auto_assign: true }),
        });

        if (deliveryRes.ok) {
          const deliveryData = await deliveryRes.json();
          setDelivery(deliveryData.delivery);
        }
      } catch (deliveryError) {
        console.warn("Delivery assignment failed, but order was created:", deliveryError);
      }

      // 4. Clear cart and show success
      await clearCart();
      setStep(3);

      // Show success message
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: result.message || "Order completed successfully!",
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });

    } catch (error: any) {
      console.error("Error completing order:", error);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Failed to complete order",
        text: error.message || "Please try again",
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
      setError(error.message || "Failed to complete order");
    } finally {
      setShowFullScreenLoading(false);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setShowFullScreenLoading(true);

    try {
      if (orderId && paymentData?.payment?.id) {
        await completeOrder(orderId, paymentData.payment.id);

        // Fetch delivery info after successful payment
        try {
          await fetchDeliveryInfo(orderId);
        } catch (deliveryError) {
          console.warn("Delivery info fetch failed:", deliveryError);
          // Don't block success for delivery info issues
        }
      } else {
        throw new Error("Missing order ID or payment data");
      }
    } catch (error: any) {
      console.error("Payment success handling error:", error);

      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Payment completed but order update failed",
        text: error.message || "Please contact support",
        showConfirmButton: false,
        timer: 4000,
        toast: true,
      });

      setError("Payment completed but order update failed");
    } finally {
      setShowFullScreenLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setLoading(false);
    setShowFullScreenLoading(false);
  };

  const handleContinueShopping = () => {
    router.push(`/${language}/customer/products`);
  };

  // Safely extract values from orderSummary with fallbacks
  const productDiscount = orderSummary?.product_discount ?? 0;
  const couponDiscount = orderSummary?.coupon_discount ?? 0;
  const productSubtotal = orderSummary?.subtotal ?? 0;
  const shippingCost = orderSummary?.shipping_cost ?? 0;
  const taxAmount = orderSummary?.tax_amount ?? 0;
  const total = orderSummary?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">

      {/* Full-screen loading overlay */}
      {showFullScreenLoading && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 bg-opacity-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-700"></div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.checkOutPage.checkout}
          </h1>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
              {t.checkOutPage.step} {step} {t.categoryPage.of} 3
            </span>
            <button
              onClick={() => router.back()}
              className="text-blue-600 cursor-pointer hover:underline dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              {t.checkOutPage.backToCart}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {step === 1 && (
                  <div className="flex items-center">
                    <FaShippingFast className="mr-2" />
                    <span>{t.checkOutPage.shippingAddress}</span>
                  </div>
                )}
                {step === 2 && (
                  <div className="flex items-center">
                    <FaCreditCard className="mr-2" />
                    {t.checkOutPage.paymentMethod}
                  </div>
                )}
                {step === 3 && (
                  <div className="flex items-center">
                    <FaCheck className="mr-2" />
                    {t.cartPage.orderSummary}
                  </div>
                )}
              </h2>

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-4">
                      {t.checkOutPage.selectShippingAddress}
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Location Required
                      </span>
                    </h3>

                    {addresses.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-gray-600 dark:text-gray-400">No addresses saved yet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Add your first address to continue</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {addresses.map((address) => {
                          const hasCoordinates = address.latitude && address.longitude;
                          const coordinatesStatus = hasCoordinates ? 'good' : 'missing';

                          return (
                            <div
                              key={address.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAddress?.id === address.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                              onClick={() => setSelectedAddress(address)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <div
                                      className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${selectedAddress?.id === address.id
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-gray-300"
                                        }`}
                                    >
                                      {selectedAddress?.id === address.id && (
                                        <svg
                                          className="w-3 h-3 text-white"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">
                                            {address.address_line_1}
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {address.address_line_2}, {address.city},{" "}
                                            {address.state} {address.postal_code}
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {address.country}
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t.checkOutPage.phone}: {address.phone}
                                          </p>
                                        </div>

                                        {/* Coordinates Status Indicator */}
                                        <div className="flex items-center ml-4">
                                          {hasCoordinates ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                              Location Set
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                              </svg>
                                              Needs Location
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Show coordinates if available */}
                                      {hasCoordinates && (
                                        <div className="mt-6">
                                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                            <span className="font-mono">
                                              {Number(address.latitude)?.toFixed(6)}, {Number(address.longitude)?.toFixed(6)}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Map Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAddressId(address.id);

                                    setSelectedCoordinates(
                                      address.latitude != null && address.longitude != null
                                        ? { lat: address.latitude, lng: address.longitude }
                                        : null
                                    );

                                    setShowMapModal(true);
                                  }}
                                  className="ml-4 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
                                  title="Set exact location on map"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                  </svg>
                                  <span className="ml-1 hidden sm:inline">Map</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      className="mt-4 cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                      onClick={() =>
                        setShowNewAddressDropdown(!showNewAddressDropdown)
                      }
                    >
                      {showNewAddressDropdown ? (
                        <IoIosArrowUp className="mr-2" />
                      ) : (
                        <BsFillHouseAddFill className="mr-2" />
                      )}
                      {t.checkOutPage.addNewAddress}
                    </button>
                  </div>

                  {showNewAddressDropdown && (
                    <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md space-y-4 transition-all duration-300">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Add New Address
                        <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                          (Coordinates will be auto-detected)
                        </span>
                      </h4>

                      {/* Address Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Label *
                          </label>
                          <input
                            type="text"
                            placeholder="Home, Office, etc."
                            value={newAddress.label}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                label: e.target.value,
                              })
                            }
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Recipient Name *
                          </label>
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={newAddress.recipient_name}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                recipient_name: e.target.value,
                              })
                            }
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="text"
                            placeholder="012 345 678"
                            value={newAddress.phone}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                phone: e.target.value,
                              })
                            }
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Address Line 1 *
                          </label>
                          <input
                            type="text"
                            placeholder="Street address, building, house number"
                            value={newAddress.address_line_1}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                address_line_1: e.target.value,
                              })
                            }
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Apartment, suite, unit, etc."
                          value={newAddress.address_line_2}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              address_line_2: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      {/* City / State / Postal / Country */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            placeholder="City"
                            value={newAddress.city}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                city: e.target.value,
                              })
                            }
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            State/Province *
                          </label>
                          <input
                            type="text"
                            placeholder="State"
                            value={newAddress.state}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                state: e.target.value,
                              })
                            }
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            placeholder="Postal Code"
                            value={newAddress.postal_code}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                postal_code: e.target.value,
                              })
                            }
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Country *
                          </label>
                          <input
                            type="text"
                            placeholder="Country"
                            value={newAddress.country}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                country: e.target.value,
                              })
                            }
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                      </div>

                      {/* Manual Coordinates Input (Optional) */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Manual Coordinates (Optional)
                          </h5>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddressId(null);
                              setSelectedCoordinates(newAddress.latitude && newAddress.longitude
                                ? { lat: newAddress.latitude, lng: newAddress.longitude }
                                : null
                              );
                              setShowMapModal(true);
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Select on Map
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Latitude
                            </label>
                            <input
                              type="number"
                              step="any"
                              placeholder="e.g., 11.5564"
                              value={newAddress.latitude || ''}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Longitude
                            </label>
                            <input
                              type="number"
                              step="any"
                              placeholder="e.g., 104.9282"
                              value={newAddress.longitude || ''}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          </div>
                        </div>

                        {newAddress.latitude && newAddress.longitude && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Coordinates set: {newAddress.latitude.toFixed(6)}, {newAddress.longitude.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Default Address */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newAddress.is_default}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              is_default: e.target.checked,
                            })
                          }
                          id="defaultAddress"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="defaultAddress"
                          className="text-sm dark:text-gray-300"
                        >
                          Set as default address
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setShowNewAddressDropdown(false);
                            setNewAddress({
                              label: "",
                              recipient_name: "",
                              phone: "",
                              address_line_1: "",
                              address_line_2: "",
                              city: "",
                              state: "",
                              postal_code: "",
                              country: "Cambodia",
                              is_default: false,
                              latitude: undefined,
                              longitude: undefined,
                            });
                          }}
                          className="px-4 py-2 flex items-center cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 hover:text-red-500 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                        >
                          <MdOutlineCancel className="mr-2 w-5 h-5" /> Cancel
                        </button>
                        <button
                          onClick={handleSaveNewAddress}
                          className="px-4 py-2 flex items-center cursor-pointer bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-lg shadow-md transition-all"
                        >
                          <MdOutlineSaveAlt className="mr-2 w-5 h-5" /> Save Address
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg flex items-center font-medium mb-4">
                      <FaNoteSticky className="mr-2" />
                      {t.checkOutPage.orderNotes}
                    </h3>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder={t.checkOutPage.anySpecialInstructions}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg flex items-center font-medium mb-4">
                      <RiCoupon3Fill className="mr-2" />
                      {t.checkOutPage.applyCoupon}
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder={t.checkOutPage.enterCouponCode}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button className="px-4 py-3 cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        {t.checkOutPage.apply}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!selectedAddress}
                      className={`px-6 flex items-center cursor-pointer py-3 rounded-lg text-white font-medium transition-all duration-300 justify-center gap-2 ${!selectedAddress
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                        : "bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg"
                        }`}
                    >
                      {t.checkOutPage.continueToPayment}
                      <VscDebugContinue className="ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      {t.checkOutPage.selectPaymentMethod}
                    </h3>
                    <div className="grid gap-4">
                      <button
                        className={`p-4 border rounded-lg cursor-pointer ${paymentMethod === "stripe"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700"
                          }`}
                        onClick={() => setPaymentMethod("stripe")}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === "stripe"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                              }`}
                          >
                            {paymentMethod === "stripe" && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center">
                              <img
                                src="/images/stripe.png"
                                alt="Stripe"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-col items-start">
                              <p className="font-medium">
                                Credit/Debit Card (Stripe)
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t.checkOutPage.PaySecurely}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        className={`p-4 border rounded-lg cursor-pointer ${paymentMethod === "khqr"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700"
                          }`}
                        onClick={() => setPaymentMethod("khqr")}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === "khqr"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                              }`}
                          >
                            {paymentMethod === "khqr" && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center">
                              <img
                                src="/images/KHQR_logo.png"
                                alt="KHQR"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-col items-start">
                              <p className="font-medium">KHQR Payment</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t.checkOutPage.scanToPay}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        className={`p-4 border rounded-lg cursor-pointer ${paymentMethod === "cod"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700"
                          }`}
                        onClick={() => setPaymentMethod("cod")}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === "cod"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                              }`}
                          >
                            {paymentMethod === "cod" && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center">
                              <MdOutlineDeliveryDining className="w-8 h-8" />
                            </div>
                            <div className="flex flex-col items-start">
                              <p className="font-medium">
                                Cash on Delivery (COD)
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t.checkOutPage.payWhenYouReceive}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className=" flex items-center cursor-pointer px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <IoIosArrowBack className="mr-2 w-5 h-5" />
                      {t.checkOutPage.back}
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className={`px-6 flex cursor-pointer items-center justify-center gap-2 py-3 rounded-lg font-medium text-white transition-all duration-300 ${loading
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                        : "bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg"
                        }`}
                    >
                      {loading ? (
                        "Processing..."
                      ) : (
                        <>
                          {t.checkOutPage.completedOrder}{" "}
                          <VscDebugContinue className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && orderSummary && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600 dark:text-green-400" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M21 7v-.63c0-1.193 0-1.79-.158-2.27a3.05 3.05 0 0 0-1.881-1.937C18.493 2 17.914 2 16.755 2h-9.51c-1.159 0-1.738 0-2.206.163a3.05 3.05 0 0 0-1.881 1.936C3 4.581 3 5.177 3 6.37V15m18-4v9.374c0 .858-.985 1.314-1.608.744a.946.946 0 0 0-1.284 0l-.483.442a1.657 1.657 0 0 1-2.25 0a1.657 1.657 0 0 0-2.25 0a1.657 1.657 0 0 1-2.25 0a1.657 1.657 0 0 0-2.25 0a1.657 1.657 0 0 1-2.25 0l-.483-.442a.946.946 0 0 0-1.284 0c-.623.57-1.608.114-1.608-.744V19" /><path stroke-linejoin="round" d="m9.5 10.4l1.429 1.6L14.5 8" /><path d="M7.5 15.5H9m7.5 0H12" /></g></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {t.checkOutPage.orderPlacedSuccessful}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {t.checkOutPage.thankYou} {" "}
                      <span className="font-semibold">
                        #{orderSummary.order_number}
                      </span>
                    </p>
                  </div>

                  {/* Order Details */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {t.ordersDetail.orderDetails}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shipping Information */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          {t.checkOutPage.shippingAddress}
                        </h5>
                        <div className="space-y-2">
                          <p className="text-gray-600 dark:text-gray-400">
                            {selectedAddress?.address_line_1}
                            {selectedAddress?.address_line_2 && <>, {selectedAddress.address_line_2}</>}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {selectedAddress?.city}, {selectedAddress?.state}{" "}
                            {selectedAddress?.postal_code}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {selectedAddress?.country}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {t.checkOutPage.phone}: {selectedAddress?.phone}
                          </p>

                          {selectedAddress?.latitude && selectedAddress?.longitude && (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Location coordinates set for accurate delivery tracking
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {parseFloat(selectedAddress.latitude).toFixed(6)}, {parseFloat(selectedAddress.longitude).toFixed(6)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          {t.cartPage.orderSummary}
                        </h5>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              {t.checkOutPage.orderNumber}:
                            </span>
                            <span className="font-medium">
                              #{orderSummary.order_number}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              {t.checkOutPage.orderDate}:
                            </span>
                            <span className="font-medium">
                              {new Date(
                                orderSummary.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              {t.checkOutPage.paymentMethod}:
                            </span>
                            <span className="font-medium capitalize">
                              {paymentMethod === "cod"
                                ? "Cash on Delivery"
                                : paymentMethod}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              {t.coupon.status}:
                            </span>
                            <span
                              className={`font-medium capitalize ${orderSummary.status === "completed"
                                ? "text-green-600 dark:text-green-400"
                                : orderSummary.status === "pending"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-gray-600 dark:text-gray-300"
                                }`}
                            >
                              {orderSummary.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {t.ordersDetail.orderItems}
                    </h4>

                    <div className="space-y-4">
                      {orderSummary.items?.map((item: any) => {
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center">
                              <div className="ml-4">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {item.product_name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {item.product_model}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              $
                              {(
                                Number(item.unit_price) * item.quantity
                              ).toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {t.ordersDetail.orderTotal}
                    </h4>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t.cartPage.subtotal}:
                        </span>
                        <span className="font-medium">
                          ${formatCurrency(orderSummary.subtotal)}
                        </span>
                      </div>

                      {Number(orderSummary.product_discount) > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>{t.checkOutPage.productDiscount}:</span>
                          <span className="font-medium">
                            -${formatCurrency(orderSummary.product_discount)}
                          </span>
                        </div>
                      )}

                      {Number(orderSummary.coupon_discount) > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>{t.checkOutPage.couponDiscount}:</span>
                          <span className="font-medium">
                            -${formatCurrency(orderSummary.coupon_discount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t.footer.shipping}:
                        </span>
                        <span className="font-medium">
                          ${formatCurrency(orderSummary.shipping_cost)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t.checkOutPage.tax}:
                        </span>
                        <span className="font-medium">
                          ${formatCurrency(orderSummary.tax_amount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                        <span>{t.cartPage.total}:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          ${formatCurrency(orderSummary.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {t.checkOutPage.whatNext}
                    </h4>

                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-1">
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            1
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {t.checkOutPage.orderConfirmation}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t.checkOutPage.youllReceive}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-1">
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            2
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {paymentMethod === "cod"
                              ? t.checkOutPage.orderProcessing
                              : t.checkOutPage.paymentProcessing}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {paymentMethod === "cod"
                              ? t.checkOutPage.yourOrder
                              : t.checkOutPage.yourPayment}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-1">
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            3
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {t.checkOutPage.shippingUpdates}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t.checkOutPage.wellSend}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleContinueShopping}
                      className={`px-6 flex items-center cursor-pointer justify-center gap-2 py-3 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
                    >
                      {t.cartPage.continueShopping}
                      <VscDebugContinue className="ml-2 w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleViewOrderDetails(orderSummary)}
                      className={`px-6 flex items-center cursor-pointer justify-center gap-2 py-3 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
                    >
                      <TbReport className="mr-2 w-5 h-5" />
                      {t.checkOutPage.viewOrderDetails}
                    </button>

                    <button
                      onClick={() => downloadInvoice(orderSummary)}
                      className="px-6 flex items-center cursor-pointer py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <HiOutlineDownload className="mr-2 w-5 h-5" />
                      {t.checkOutPage.downloadInvoice}
                    </button>

                    {delivery && delivery.status !== 'completed' && (
                      <button
                        onClick={() => setShowDeliveryTracking(true)}
                        className={`px-6 flex items-center cursor-pointer justify-center gap-2 py-3 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
                      >
                        <MdOutlineDeliveryDining className="mr-2" />
                        {t.checkOutPage.trackDelivery}
                      </button>
                    )}
                  </div>

                  {/* Support Information */}
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center">
                      {t.checkOutPage.needHelp}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                      {t.checkOutPage.ourSupport}
                    </p>

                    <div className="space-y-3">
                      {/* Email */}
                      <a
                        href="mailto:support@example.com"
                        className="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2  text-gray-800 dark:text-gray-200" viewBox="0 0 24 24"><g fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M10.5 22v-2m4 2v-2" /><path fill="currentColor" d="M11 20v.75h.75V20zm-9.75-8a.75.75 0 0 0 1.5 0zm1.5 4a.75.75 0 0 0-1.5 0zM14 19.25a.75.75 0 0 0 0 1.5zm7.25-8a.75.75 0 0 0 1.5 0zm-3.75-6a.75.75 0 0 0 0 1.5zM22.75 15a.75.75 0 0 0-1.5 0zM7 5.25a.75.75 0 0 0 0 1.5zm2 14a.75.75 0 0 0 0 1.5zm6 1.5a.75.75 0 0 0 0-1.5zm-4-1.5H4.233v1.5H11zm-6.767 0c-.715 0-1.483-.718-1.483-1.855h-1.5c0 1.74 1.231 3.355 2.983 3.355zM6.5 6.75c1.967 0 3.75 1.902 3.75 4.5h1.5c0-3.201-2.246-6-5.25-6zm0-1.5c-3.004 0-5.25 2.799-5.25 6h1.5c0-2.598 1.783-4.5 3.75-4.5zM10.25 17v3h1.5v-3zm0-5.75V17h1.5v-5.75zm-7.5.75v-.75h-1.5V12zm0 5.395V16h-1.5v1.395zm17.043 1.855H14v1.5h5.793zm1.457-1.825c0 1.12-.757 1.825-1.457 1.825v1.5c1.738 0 2.957-1.601 2.957-3.325zm1.5-6.175c0-3.201-2.246-6-5.25-6v1.5c1.967 0 3.75 1.902 3.75 4.5zM21.25 15v2.425h1.5V15zM7 6.75h11v-1.5H7zm2 14h6v-1.5H9z" /><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M5 16h3m8-6.116V5.411m0 0V2.635c0-.236.168-.439.4-.484l.486-.093a3.2 3.2 0 0 1 1.755.156l.08.03c.554.214 1.16.254 1.737.115a.44.44 0 0 1 .542.427v2.221a.51.51 0 0 1-.393.499l-.066.016a3.2 3.2 0 0 1-1.9-.125a3.2 3.2 0 0 0-1.755-.156z" /></g></svg>
                        support@emp-platform.com
                      </a>

                      {/* Phone */}
                      <a
                        href="tel:+1234567890"
                        className="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2 text-gray-800 dark:text-gray-200" viewBox="0 0 24 24"><g fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M13.5 2s2.334.212 5.303 3.182c2.97 2.97 3.182 5.303 3.182 5.303m-7.778-4.949s.99.282 2.475 1.767s1.768 2.475 1.768 2.475" /><path fill="currentColor" d="m15.1 15.027l.545.517zm.456-.48l-.544-.516zm2.417-.335l-.374.65zm1.91 1.1l-.374.65zm.539 3.446l.543.517zm-1.42 1.496l-.545-.517zm-1.326.71l.074.745zm-9.86-4.489l.543-.516zm-4.064-9.55a.75.75 0 1 0-1.498.081zm5.439 1.88l.544.517zm.287-.302l.543.517zm.156-2.81l.613-.433zM8.374 3.91l-.613.433zm-3.656-.818a.75.75 0 0 0 1.087 1.033zm6.345 9.964l.544-.517zm-.399 6.756a.75.75 0 1 0 .798-1.27zm4.449.246a.75.75 0 0 0-.307 1.469zm.532-4.514l.455-.48l-1.088-1.033l-.455.48zm1.954-.682l1.91 1.1l.749-1.3l-1.911-1.1zm2.279 3.38l-1.42 1.495l1.087 1.034l1.42-1.496zM8.359 15.959c-3.876-4.081-4.526-7.523-4.607-9.033l-1.498.08c.1 1.85.884 5.634 5.018 9.986zm1.376-6.637l.286-.302l-1.087-1.033l-.287.302zm.512-4.062L8.986 3.477l-1.225.866l1.26 1.783zM9.19 8.805a38 38 0 0 0-.545-.515l-.002.002l-.003.003l-.05.058a1.6 1.6 0 0 0-.23.427c-.098.275-.15.639-.084 1.093c.13.892.715 2.091 2.242 3.7l1.088-1.034c-1.428-1.503-1.78-2.428-1.846-2.884c-.032-.22 0-.335.013-.372l.008-.019l-.028.037l-.018.02zm1.328 4.767c1.523 1.604 2.673 2.234 3.55 2.377c.451.073.816.014 1.092-.095a1.5 1.5 0 0 0 .422-.25l.035-.034l.014-.014l.007-.006l.003-.003l.001-.002s.002-.001-.542-.518c-.544-.516-.543-.517-.543-.518l.002-.001l.002-.003l.006-.005l.047-.042q.014-.008-.005.001c-.02.008-.11.04-.3.009c-.402-.066-1.27-.42-2.703-1.929zM8.986 3.477C7.972 2.043 5.944 1.8 4.718 3.092l1.087 1.033c.523-.55 1.444-.507 1.956.218zm9.471 16.26c-.279.294-.57.452-.854.48l.147 1.492c.747-.073 1.352-.472 1.795-.939zM10.021 9.02c.968-1.019 1.036-2.613.226-3.76l-1.225.866c.422.597.357 1.392-.088 1.86zm9.488 6.942c.821.473.982 1.635.369 2.28l1.087 1.033c1.305-1.374.925-3.673-.707-4.613zm-3.409-.898c.385-.406.986-.497 1.499-.202l.748-1.3c-1.099-.632-2.46-.45-3.335.47zm-4.638 3.478c-.983-.618-2.03-1.454-3.103-2.583l-1.087 1.033c1.154 1.215 2.297 2.132 3.392 2.82zm6.14 1.675a8.3 8.3 0 0 1-2.489-.159l-.307 1.469a9.8 9.8 0 0 0 2.944.182z" /></g></svg>
                        +855 12 345 678
                      </a>

                      {/* Chat */}
                      <Link
                        href={`/${language}/customer/chat`}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M8 10.5h8M8 14h5.5M17 3.338A9.95 9.95 0 0 0 12 2C6.477 2 2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10c0-1.821-.487-3.53-1.338-5" /></svg>
                        Live Chat
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <OrderDetailModal
                isOpen={showOrderDetail}
                onClose={() => setShowOrderDetail(false)}
                order={selectedOrder}
                params={{ locale: language }}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-medium mb-4">{t.cartPage.orderSummary}</h3>
              <div className="space-y-4">
                {cart?.items.map((item) => {
                  const primaryImage = item.product?.images?.find((img) => img.is_primary);
                  const fallbackImage = item.product?.images?.[0];
                  const imageSrc = primaryImage
                    ? `${API_BASE_URL}/${primaryImage.path}`
                    : fallbackImage
                      ? `${API_BASE_URL}/${fallbackImage.path}`
                      : "/images/placeholder.png";

                  return (
                    <div key={item.id} className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={imageSrc}
                          alt={item.product?.name ?? "Product Image"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-3 flex-grow">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.product?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        $
                        {(
                          Number(item.product?.price ?? 0) * item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t.cartPage.subtotal}
                  </span>
                  <span className="font-medium">
                    ${formatCurrency(productSubtotal)}
                  </span>
                </div>

                {Number(productDiscount) > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>{t.checkOutPage.productDiscount}</span>
                    <span className="font-medium">
                      -${formatCurrency(productDiscount)}
                    </span>
                  </div>
                )}

                {Number(couponDiscount) > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>{t.checkOutPage.couponDiscount}</span>
                    <span className="font-medium">
                      -${formatCurrency(couponDiscount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t.footer.shipping}
                  </span>
                  <span className="font-medium">
                    ${formatCurrency(shippingCost)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t.checkOutPage.tax}</span>
                  <span className="font-medium">
                    ${formatCurrency(taxAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>{t.cartPage.total}</span>
                  <span>${formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modals */}
      {showPaymentModal && paymentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold">Complete Payment</h3>
              <button
                onClick={handlePaymentCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {paymentMethod === "stripe" && paymentData.client_secret && (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret: paymentData.client_secret }}
                >
                  <StripePaymentForm
                    clientSecret={paymentData.client_secret}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                    showFullScreenLoading={showFullScreenLoading}
                    setShowFullScreenLoading={setShowFullScreenLoading}
                  />
                </Elements>
              )}

              {paymentMethod === "khqr" && (
                <KhqrModal
                  paymentId={paymentData.payment?.id || paymentData.id}
                  qrPayload={paymentData.khqr_payload}
                  md5Hash={paymentData.md5_hash}
                  amount={paymentData.payment?.amount || paymentData.amount}
                  currency={paymentData.payment?.currency || "USD"}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Selection Modal */}
      {showMapModal && (
        <MapSelectionModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setEditingAddressId(null);
            setSelectedCoordinates(null);
          }}
          onSelect={async (lat, lng) => {
            if (editingAddressId) {
              // Update existing address
              await saveAddressCoordinates(editingAddressId, lat, lng);
            } else {
              // Update new address being created
              setNewAddress({
                ...newAddress,
                latitude: lat,
                longitude: lng,
              });
            }
          }}
          initialLat={selectedCoordinates?.lat || (newAddress.latitude || 11.5564)}
          initialLng={selectedCoordinates?.lng || (newAddress.longitude || 104.9282)}
        />
      )}

      {showDeliveryTracking && orderId && (
        <DeliveryTrackingModal
          isOpen={showDeliveryTracking}
          onClose={() => setShowDeliveryTracking(false)}
          orderId={orderId}
          params={{ locale: language }}
        />
      )}
    </div>
  );
}