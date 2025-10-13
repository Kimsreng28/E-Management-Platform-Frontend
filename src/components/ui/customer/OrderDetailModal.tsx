// components/OrderDetailModal.tsx
"use client";

import { API_BASE_URL } from "@/lib/config";
import { Address } from "@/types/address";
import { Order } from "@/types/order";
import { useTranslations } from "@/utils/useTranslations";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { HiOutlineDownload } from "react-icons/hi";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { PiShareFatDuotone } from "react-icons/pi";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  params?: { locale: "en" | "kh" };
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  params,
}: OrderDetailModalProps) {
  const language = params?.locale || "en";
  const t = useTranslations(language);
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [billingAddress, setBillingAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (order && isOpen) {
      fetchAddresses();
    }
  }, [order, isOpen]);

  const fetchAddresses = async () => {
    if (!order) return;

    try {
      setLoading(true);

      // Fetch shipping address
      if (order.shipping_address_id) {
        const shippingRes = await fetch(
          `${API_BASE_URL}/api/addresses/${order.shipping_address_id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (shippingRes.ok) {
          const resJson = await shippingRes.json();
          setShippingAddress(resJson.data);
        }
      }

      // Fetch billing address
      if (order.billing_address_id) {
        const billingRes = await fetch(
          `${API_BASE_URL}/api/addresses/${order.billing_address_id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (billingRes.ok) {
          const resJson = await billingRes.json();
          setBillingAddress(resJson.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
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
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download invoice: ${errorText}`);
      }

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

  const shareOrder = async () => {
    if (!order) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Order #${order.order_number}`,
          text: `Check out my order #${order.order_number} from ${process.env.NEXT_PUBLIC_APP_NAME}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `Order #${order.order_number}\nStatus: ${order.status}\nTotal: $${order.total}\n\nView details: ${window.location.href}`
        );
        alert("Order details copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to share order:", error);
    }
  };

  const formatAddress = (address: Address | null) => {
    if (!address) return "Not specified";

    return `
      ${address.address_line_1}
      ${address.address_line_2 ? address.address_line_2 + "\n" : ""}
      ${address.city}, ${address.state} ${address.postal_code}
      ${address.country}
      Phone: ${address.phone}
    `.trim();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t.orderDetail.order} #{order.order_number}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t.ordersDetail.placedOn} {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : order.status === "processing"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    : order.status === "shipped"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${order.total}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.ordersDetail.orderItems} ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.product_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t.ordersDetail.model}: {item.product_model}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity} × ${item.unit_price}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Address Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t.checkOutPage.shippingAddress}
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                ) : (
                  <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {formatAddress(shippingAddress)}
                  </pre>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t.checkOutPage.billingAddress}
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                ) : (
                  <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {billingAddress
                      ? formatAddress(billingAddress)
                      : "Same as shipping address"}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.cartPage.orderSummary}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  {t.cartPage.subtotal}:
                </span>
                <span className="font-medium">${order.subtotal}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>{t.createProduct.discount}:</span>
                  <span>-${order.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  {t.footer.shipping}:
                </span>
                <span className="font-medium">${order.shipping_cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t.checkOutPage.tax}:</span>
                <span className="font-medium">${order.tax_amount}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                <span>{t.cartPage.total}:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  ${order.total}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {order.payments && order.payments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t.ordersDetail.paymentInformation}
              </h3>
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium capitalize">
                        {payment.payment_method}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${payment.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                      >
                        {payment.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {t.orderDetail.amount}: ${payment.amount}
                      {payment.paid_at && (
                        <span>
                          {" "}
                          • {t.orderDetail.paidOn} {" "}
                          {new Date(payment.paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {t.ordersDetail.orderNotes}
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-600 dark:text-gray-300">
                  {order.notes}
                </p>
              </div>
            </div>
          )}

          {/* QR Code for Order */}
          <div className="text-center">
            <div className="inline-flex flex-col items-center p-4 bg-white dark:bg-gray-700 rounded-lg">
              <QRCodeSVG
                value={`${window.location.origin}/${language}/customer/orders/${order.id}`}
                size={128}
              />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {t.orderDetail.scanToViewThisOrder}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={shareOrder}
            className="px-4 py-2 flex items-center cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t.orderDetail.shareOrder}
            <PiShareFatDuotone className="ml-2 w-5 h-5" />
          </button>
          <button
            onClick={() => downloadInvoice(order)}
            className={`px-6 flex items-center cursor-pointer justify-center gap-2 py-3 rounded-lg font-medium text-white transition-all duration-300 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black shadow-md hover:shadow-lg`}
          >
            <HiOutlineDownload className="mr-2 w-5 h-5" />
            {t.checkOutPage.downloadInvoice}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 flex items-center cursor-pointer border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t.productDashboard.close}
            <IoMdCloseCircleOutline className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
