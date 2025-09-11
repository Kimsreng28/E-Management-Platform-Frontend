// app/[locale]/customer/checkout/page.tsx
"use client";

import DeliveryTrackingModal from "@/components/ui/customer/DeliveryTracking";
import DeliveryTracking from "@/components/ui/customer/DeliveryTracking";
import OrderDetailModal from "@/components/ui/customer/OrderDetailModal";
import { useCart } from "@/contexts/CartContext";
import { API_BASE_URL } from "@/lib/config";
import { Address } from "@/types/address";
import { Order } from "@/types/order";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { use, useEffect, useState } from "react";
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

// Initialize Stripe
const stripePromise = loadStripe(
  "pk_test_51PuwVDRo9UNVikjncEeJvDzuEJY7q4x6f73o9s5r53OILjGqdnecW7DvEmt7pNQM8sOsNbqx1Rh0JEdLhyIvfziQ00j961JlI6"
);

// Stripe Payment Form Component
function StripePaymentForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
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
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    }
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
            className="px-4 py-2 flex items-center cursor-pointer bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7H9a5 5 0 0 0 0 10M20 7l-3-3m3 3l-3 3m-1 7h-3" /></svg>
            {processing ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </form>
    </div>
  );
}

// KHQR Modal Component
function KhqrModal({
  qrPayload,
  onSuccess,
  onCancel,
  paymentId,
}: {
  paymentId: number;
  qrPayload: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [paymentVerified, setPaymentVerified] = useState(false);

  // Polling mechanism to verify payment status
  useEffect(() => {
    if (!paymentId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch payment status");

        const data = await res.json();
        const payment = data.payment || data;

        if (payment.status === "completed") {
          clearInterval(interval);
          setPaymentVerified(true);
          onSuccess();
        }
      } catch (err) {
        console.error("Error checking payment:", err);
      }
    }, 5000); // check every 5s

    return () => clearInterval(interval);
  }, [paymentId, onSuccess]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg text-center">
      <h3 className="text-lg font-medium mb-4">Scan KHQR Code to Pay</h3>
      <div className="mb-4 p-4 bg-white flex justify-center">
        {qrPayload ? (
          <QRCodeCanvas value={qrPayload} size={192} />
        ) : (
          <span>QR Code would appear here</span>
        )}
      </div>

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Open your mobile banking app and scan the QR code to complete your
        payment.
      </p>

      {paymentVerified ? (
        <div className="p-3 bg-green-100 text-green-700 rounded-lg mb-4">
          Payment verified successfully!
        </div>
      ) : (
        <div className="p-3 bg-blue-100 text-blue-700 rounded-lg mb-4">
          Waiting for payment confirmation...
        </div>
      )}

      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
      >
        Cancel
      </button>
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
    country: "",
    is_default: false,
  });
  const [delivery, setDelivery] = useState<any>(null);
  const [showDeliveryTracking, setShowDeliveryTracking] = useState(false);

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
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
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
          country: "",
          is_default: false,
        });
      } else {
        alert(data.message || "Failed to add address");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating address");
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ code: couponCode }),
      });
      const result = await response.json();
      if (!result.valid) {
        setError("Invalid or expired coupon code");
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

    if (couponCode) {
      const valid = await validateCoupon();
      if (!valid) return;
    }

    setLoading(true);
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
        } else {
          // For online payments, process payment
          await processPayment(result.order.id, result.order.total);
        }
      } else {
        setError(result.message || "Failed to create order");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError("An error occurred during checkout");
      setLoading(false);
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
    } catch (error: any) {
      setError(error.message || "Payment initialization failed");
      setLoading(false);
    }
  };

  const completeOrder = async (orderId: number, paymentId?: number) => {
    try {
      // 1. Update payment status for COD (create a payment record if needed)
      if (paymentMethod === "cod" && !paymentId) {
        // Create a COD payment record
        const codPaymentData = {
          order_id: orderId,
          payment_method: "cod",
          amount: total,
          currency: "USD",
          status: "pending", // COD is pending until delivered
        };

        const paymentRes = await fetch(`${API_BASE_URL}/api/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(codPaymentData),
        });

        if (!paymentRes.ok) throw new Error("Failed to create COD payment");
      }
      // If payment ID was provided, update existing payment
      else if (paymentId) {
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

        if (!paymentRes.ok) throw new Error("Failed to update payment status");
      }

      // 2. Update order status
      //   const orderRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      //     method: "PUT",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${localStorage.getItem("token")}`,
      //     },
      //     body: JSON.stringify({
      //       status: "completed",
      //     }),
      //   });

      const deliveryRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}/assign-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ auto_assign: true }),
      });

      // Show delivery tracking modal
      setShowDeliveryTracking(true);

      if (deliveryRes.ok) {
        const deliveryData = await deliveryRes.json();
        setDelivery(deliveryData.delivery);
      }

      // 3. Clear cart and show success
      await clearCart();
      setStep(3);
    } catch (error) {
      console.error("Error completing order:", error);
      setError("Failed to complete order");
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);

    if (orderId && paymentData?.payment?.id) {
      await completeOrder(orderId, paymentData.payment.id);

      await fetchDeliveryInfo(orderId);
    }

    try {
      if (paymentData?.id) {
        // Update payment status to completed
        const res = await fetch(
          `${API_BASE_URL}/api/payments/${paymentData.id}`,
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

        if (!res.ok) throw new Error("Failed to update payment");
      }

      if (orderId) {
        // Fetch the updated order after payment
        const orderRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!orderRes.ok) throw new Error("Failed to fetch updated order");

        const updatedOrder = await orderRes.json();

        // Clear cart and show success
        await clearCart();
        setOrderSummary(updatedOrder);
        setStep(3);
      }
    } catch (err) {
      console.error("Payment success handling error:", err);
      setError("Failed to complete order after payment");
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setLoading(false);
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
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Checkout
          </h1>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
              Step {step} of 3
            </span>
            <button
              onClick={() => router.back()}
              className="text-blue-600 cursor-pointer hover:underline dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              Back to Cart
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
                    <span>Shipping Address</span>
                  </div>
                )}
                {step === 2 && (
                  <div className="flex items-center">
                    <FaCreditCard className="mr-2" />
                    Payment Method
                  </div>
                )}
                {step === 3 && (
                  <div className="flex items-center">
                    <FaCheck className="mr-2" />
                    Order Summary
                  </div>
                )}
              </h2>

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-4">
                      Select Shipping Address
                    </h3>
                    <div className="grid gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-4 border rounded-lg cursor-pointer ${selectedAddress?.id === address.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700"
                            }`}
                          onClick={() => setSelectedAddress(address)}
                        >
                          <div className="flex items-center">
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
                                Phone: {address.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

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
                      Add New Address
                    </button>
                  </div>

                  {showNewAddressDropdown && (
                    <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md space-y-4 transition-all duration-300">
                      {/* Address Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Label (Home, Office)"
                          value={newAddress.label}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              label: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Recipient Name"
                          value={newAddress.recipient_name}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              recipient_name: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Phone"
                          value={newAddress.phone}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              phone: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 1"
                          value={newAddress.address_line_1}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              address_line_1: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        value={newAddress.address_line_2}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            address_line_2: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />

                      {/* City / State / Postal / Country */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
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
                          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
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
                          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
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
                          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
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
                          onClick={() => setShowNewAddressDropdown(false)}
                          className="px-4 py-2 flex items-center cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 hover:text-red-500 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                        >
                          <MdOutlineCancel className="mr-2 w-5 h-5" /> Cancel
                        </button>
                        <button
                          onClick={handleSaveNewAddress}
                          className="px-4 py-2 flex  items-center cursor-pointer bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-lg shadow-md transition-all"
                        >
                          <MdOutlineSaveAlt className="mr-2 w-5 h-5" /> Save
                          Address
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg flex items-center font-medium mb-4">
                      <FaNoteSticky className="mr-2" />
                      Order Notes
                    </h3>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Any special instructions for your order?"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg flex items-center font-medium mb-4">
                      <RiCoupon3Fill className="mr-2" />
                      Apply Coupon
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button className="px-4 py-3 cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        Apply
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
                      Continue to Payment
                      <VscDebugContinue className="ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Select Payment Method
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
                                Pay securely using your credit or debit card
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
                                Scan QR code to pay with your mobile banking app
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
                                Pay when you receive your order
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
                      Back
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
                          Completed Order{" "}
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
                      Order Placed Successfully!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Thank you for your order. Your order number is{" "}
                      <span className="font-semibold">
                        #{orderSummary.order_number}
                      </span>
                    </p>
                  </div>

                  {/* Order Details */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Order Details
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shipping Information */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          Shipping Address
                        </h5>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedAddress?.address_line_1}
                          {selectedAddress?.address_line_2}
                          <br />
                          {selectedAddress?.city}, {selectedAddress?.state}{" "}
                          {selectedAddress?.postal_code}
                          <br />
                          {selectedAddress?.country}
                          <br />
                          Phone: {selectedAddress?.phone}
                        </p>
                      </div>

                      {/* Order Summary */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          Order Summary
                        </h5>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Order Number:
                            </span>
                            <span className="font-medium">
                              #{orderSummary.order_number}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Order Date:
                            </span>
                            <span className="font-medium">
                              {new Date(
                                orderSummary.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Payment Method:
                            </span>
                            <span className="font-medium capitalize">
                              {paymentMethod === "cod"
                                ? "Cash on Delivery"
                                : paymentMethod}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Status:
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
                      Order Items
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
                      Order Total
                    </h4>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Subtotal:
                        </span>
                        <span className="font-medium">
                          ${formatCurrency(orderSummary.subtotal)}
                        </span>
                      </div>

                      {Number(orderSummary.product_discount) > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Product Discount:</span>
                          <span className="font-medium">
                            -${formatCurrency(orderSummary.product_discount)}
                          </span>
                        </div>
                      )}

                      {Number(orderSummary.coupon_discount) > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Coupon Discount:</span>
                          <span className="font-medium">
                            -${formatCurrency(orderSummary.coupon_discount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Shipping:
                        </span>
                        <span className="font-medium">
                          ${formatCurrency(orderSummary.shipping_cost)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Tax:
                        </span>
                        <span className="font-medium">
                          ${formatCurrency(orderSummary.tax_amount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                        <span>Total:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          ${formatCurrency(orderSummary.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      What's Next?
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
                            Order Confirmation
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            You'll receive an email confirmation shortly with
                            your order details.
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
                              ? "Order Processing"
                              : "Payment Processing"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {paymentMethod === "cod"
                              ? "Your order is being prepared for shipment. You'll pay when it arrives."
                              : "Your payment has been processed successfully."}
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
                            Shipping Updates
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            We'll send you tracking information once your order
                            ships.
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
                      Continue Shopping
                      <VscDebugContinue className="ml-2 w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleViewOrderDetails(orderSummary)}
                      className={`px-6 flex items-center cursor-pointer justify-center gap-2 py-3 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
                    >
                      <TbReport className="mr-2 w-5 h-5" />
                      View Order Details
                    </button>

                    <button
                      onClick={() => downloadInvoice(orderSummary)}
                      className="px-6 flex items-center cursor-pointer py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <HiOutlineDownload className="mr-2 w-5 h-5" />
                      Download Invoice
                    </button>

                    {delivery && delivery.status !== 'completed' && (
                      <button
                        onClick={() => setShowDeliveryTracking(true)}
                        className={`px-6 flex items-center cursor-pointer justify-center gap-2 py-3 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
                      >
                        <MdOutlineDeliveryDining className="mr-2" />
                        Track Delivery
                      </button>
                    )}
                  </div>

                  {/* Support Information */}
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center">
                      Need Help?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                      Our support team is here for you. Reach out by email, phone, or chat.
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
                language={language}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-medium mb-4">Order Summary</h3>
              <div className="space-y-4">
                {cart?.items.map((item) => {
                  const imageSrc = item.product?.images?.find(
                    (img) => img.is_primary
                  )?.path
                    ? `${API_BASE_URL}/${item.product.images.find((img) => img.is_primary)?.path
                    }`
                    : "/placeholder.png";

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
                    Subtotal
                  </span>
                  <span className="font-medium">
                    ${formatCurrency(productSubtotal)}
                  </span>
                </div>

                {Number(productDiscount) > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Product Discount</span>
                    <span className="font-medium">
                      -${formatCurrency(productDiscount)}
                    </span>
                  </div>
                )}

                {Number(couponDiscount) > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Coupon Discount</span>
                    <span className="font-medium">
                      -${formatCurrency(couponDiscount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Shipping
                  </span>
                  <span className="font-medium">
                    ${formatCurrency(shippingCost)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="font-medium">
                    ${formatCurrency(taxAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
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
                  />
                </Elements>
              )}

              {paymentMethod === "khqr" && paymentData.khqr_payload && (
                <KhqrModal
                  paymentId={paymentData.id}
                  qrPayload={paymentData.khqr_payload}
                  onSuccess={() => {
                    if (orderId && paymentData?.payment?.id) {
                      completeOrder(orderId, paymentData.payment.id);
                    }
                  }}
                  onCancel={handlePaymentCancel}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showDeliveryTracking && orderId && (
        <DeliveryTrackingModal
          isOpen={showDeliveryTracking}
          onClose={() => setShowDeliveryTracking(false)}
          orderId={orderId}
        />
      )}
    </div>
  );
}
