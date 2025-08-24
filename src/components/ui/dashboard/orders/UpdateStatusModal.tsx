import { API_BASE_URL } from "@/lib/config";
import { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";
import { MdOutlineCancel } from "react-icons/md";
import Swal from "sweetalert2";

interface UpdateStatusModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  statusOptions: { label: string; value: string }[];
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  total: string;
  created_at: string;
  user: { name: string; email: string };
  items: OrderItem[];
  payments: Payment[];
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Payment {
  id: number;
  payment_method: string;
  amount: string;
  status: string;
}

const UpdateStatusModal = ({
  order,
  isOpen,
  onClose,
  onSave,
  statusOptions,
}: UpdateStatusModalProps) => {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStatus(order.status);
      setNote("");
    }
  }, [isOpen, order]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // if you use auth token
      const response = await fetch(`${API_BASE_URL}/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: status,
          notes: note,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      const data = await response.json();
      console.log("Updated order:", data);

      Swal.fire({
        icon: "success",
        title: "The order has been updated successfully!",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });

      // Close modal
      onClose();

      // Refresh your order list in parent
      setTimeout(() => {
        window.location.reload(); // or call fetchOrders()
      }, 2000);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Failed to update order. Please try again.",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 relative">
        <h2 className="text-lg font-semibold mb-2">Update Order Status</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Update the status and tracking information for order{" "}
          {order.order_number}.
        </p>

        {/* Status dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Note text area */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Note:</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
            rows={3}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 flex items-center cursor-pointer rounded bg-gray-200 dark:bg-gray-600 text-red-500 dark:text-red-200"
            disabled={loading}
          >
            <MdOutlineCancel className="mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 flex items-center cursor-pointer rounded bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            <FiSave className="mr-2" />
            {loading ? "Saving..." : "Save Change"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatusModal;
