"use client";

import { useCart } from "@/contexts/CartContext";
import { API_BASE_URL } from "@/lib/config";
import { Address } from "@/types/address";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";

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
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || processing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
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

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: any) => void;
}

// Main CheckoutModal Component
export default function CheckoutModal({
  isOpen,
  onClose,
  onOrderSuccess,
}: CheckoutModalProps) {
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

  // Fetch user addresses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen]);

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

  const completeOrder = async (orderId: number) => {
    try {
      // Update order status to confirmed
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status: "completed",
        }),
      });

      if (!response.ok) throw new Error("Failed to update order status");

      // Clear cart and show success
      await clearCart();
      setStep(3);
      onOrderSuccess(orderSummary);
    } catch (error) {
      console.error("Error completing order:", error);
      setError("Failed to complete order");
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);

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
        onOrderSuccess(updatedOrder);
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

  if (!isOpen) return null;

  // Safely extract values from orderSummary with fallbacks
  const productDiscount = orderSummary?.product_discount ?? 0;
  const couponDiscount = orderSummary?.coupon_discount ?? 0;
  const productSubtotal = orderSummary?.subtotal ?? 0;
  const shippingCost = orderSummary?.shipping_cost ?? 0;
  const taxAmount = orderSummary?.tax_amount ?? 0;
  const total = orderSummary?.total ?? 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 mt-15 p-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 1 && "Shipping Information"}
              {step === 2 && "Payment Method"}
              {step === 3 && "Order Confirmation"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
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

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">
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

                  <button className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add New Address
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Order Notes</h3>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any special instructions for your order?"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Apply Coupon</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                      Apply
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedAddress}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Payment
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
                    <div
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
                        <div>
                          <p className="font-medium">
                            Credit/Debit Card (Stripe)
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Pay securely using your credit or debit card
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
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
                        <div>
                          <p className="font-medium">KHQR Payment</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Scan QR code to pay with your mobile banking app
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
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
                        <div>
                          <p className="font-medium">Cash on Delivery (COD)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Pay when you receive your order
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing..." : "Complete Order"}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Order Placed Successfully!
                </h3>

                {paymentMethod === "cod" ? (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You chose <b>Cash on Delivery</b>. Please prepare payment
                    when your package arrives.
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Payment confirmed successfully. Thank you for your order!
                  </p>
                )}

                <div className="flex justify-center gap-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => {
                      console.log("View order details");
                    }}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Track Delivery
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium mb-4">Order Summary</h3>
            <div className="space-y-4">
              {cart?.items.map((item) => {
                const imageSrc = item.product?.images?.find(
                  (img) => img.is_primary
                )?.path
                  ? `${API_BASE_URL}/${item.product.images.find((img) => img.is_primary)?.path
                  }`
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
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
