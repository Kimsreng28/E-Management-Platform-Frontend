"use client";

import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiCopy,
  FiDollarSign,
  FiEdit,
  FiPercent,
  FiPlus,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import Swal from "sweetalert2";

interface Coupon {
  id: number;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  min_order_amount?: number;
  start_date: string;
  end_date: string;
  usage_limit?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateCouponForm {
  code: string;
  type: "fixed" | "percentage";
  value: number;
  min_order_amount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  is_active: boolean;
}

export default function TopCouponsPage({ locale }: { locale: "en" | "kh" }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [previewCoupon, setPreviewCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CreateCouponForm>({
    code: "",
    type: "fixed",
    value: 0,
    min_order_amount: null,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    usage_limit: null,
    is_active: true,
  });
  const t = useTranslations(locale);

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) throw new Error("No authentication token found");

      const res = await fetch(`${API_BASE_URL}/api/coupons`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch coupons");

      const data = await res.json();
      setCoupons(data);
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        text: err.message || "Failed to load coupons",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? parseFloat(value) || 0
            : value,
    }));
  };

  // Create or update coupon
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const url = editingCoupon
        ? `${API_BASE_URL}/api/coupons/${editingCoupon.code}`
        : `${API_BASE_URL}/api/coupons`;

      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok)
        throw new Error(
          `Failed to ${editingCoupon ? "update" : "create"} coupon`
        );

      const data = await res.json();

      Swal.fire({
        icon: "success",
        title: "Success!",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        text:
          data.message ||
          `Coupon ${editingCoupon ? "updated" : "created"} successfully`,
      });

      setShowCreateModal(false);
      setEditingCoupon(null);
      setFormData({
        code: "",
        type: "fixed",
        value: 0,
        min_order_amount: null,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        usage_limit: null,
        is_active: true,
      });

      fetchCoupons();
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        text:
          err.message ||
          `Failed to ${editingCoupon ? "update" : "create"} coupon`,
      });
    }
  };

  // Delete coupon
  const handleDelete = async (code: string) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (!result.isConfirmed) return;

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const res = await fetch(`${API_BASE_URL}/api/coupons/${code}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete coupon");

      Swal.fire({
        icon: "success",
        title: "Deleted! Coupon has been deleted.",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });

      fetchCoupons();
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        text: err.message || "Failed to delete coupon",
      });
    }
  };

  // Edit coupon
  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order_amount: coupon.min_order_amount || null,
      start_date: coupon.start_date.split("T")[0],
      end_date: coupon.end_date.split("T")[0],
      usage_limit: coupon.usage_limit || null,
      is_active: coupon.is_active || true,
    });
    setShowCreateModal(true);
  };

  // Copy coupon code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    Swal.fire({
      icon: "success",
      title: "Copied! Coupon code copied to clipboard",
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      toast: true,
    });
  };

  // Calculate discount value display
  const getDiscountDisplay = (coupon: Coupon) => {
    return coupon.type === "fixed"
      ? `$${coupon.value} OFF`
      : `${coupon.value}% OFF`;
  };

  // Check if coupon is active
  const isCouponActive = (coupon: Coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);
    return coupon.is_active && now >= startDate && now <= endDate;
  };

  return (
    <div className="p-1 space-y-3 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.coupon.couponManagement}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t.coupon.createAndManage}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiPlus size={18} />
          {t.coupon.createCoupons}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-gray-400 text-lg">
                {t.coupon.totalCoupons}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {coupons.length}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FiTag className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-gray-400 text-lg">
                {t.coupon.activeCoupons}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {coupons.filter(isCouponActive).length}
              </h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <FiCalendar
                className="text-green-600 dark:text-green-400"
                size={20}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-gray-400 text-lg">
                {t.coupon.fixDiscounts}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {coupons.filter((c) => c.type === "fixed").length}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <FiDollarSign
                className="text-purple-600 dark:text-purple-400"
                size={20}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800 dark:text-gray-400 text-lg">
                {t.coupon.percentageDiscount}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {coupons.filter((c) => c.type === "percentage").length}
              </h3>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <FiPercent
                className="text-orange-600 dark:text-orange-400"
                size={20}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-100"></div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <FiTag size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No coupons yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first coupon to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t.coupon.createCoupons}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-l-4 ${isCouponActive(coupon)
                ? "border-green-500"
                : "border-gray-300 dark:border-gray-600 opacity-80"
                }`}
            >
              {/* Coupon Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-lg font-bold ${isCouponActive(coupon)
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                    >
                      {isCouponActive(coupon) ? t.coupon.active : t.coupon.inactive}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-lg font-bold ml-2 ${coupon.type === "fixed"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        }`}
                    >
                      {coupon.type === "fixed" ? t.coupon.fix : t.coupon.percentage}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(coupon.code)}
                    className="text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy code"
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
              </div>

              {/* Coupon Body */}
              <div className="p-5">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {getDiscountDisplay(coupon)}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 py-1 px-2 rounded inline-block">
                    {coupon.code}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {coupon.min_order_amount && (
                    <div className="flex items-center">
                      <FiDollarSign size={14} className="mr-2" />
                      <span>{t.coupon.minOrder}: ${coupon.min_order_amount}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <FiCalendar size={14} className="mr-2" />
                    <span>
                      {t.coupon.valid}: {new Date(coupon.start_date).toLocaleDateString()}{" "}
                      - {new Date(coupon.end_date).toLocaleDateString()}
                    </span>
                  </div>

                  {coupon.usage_limit && (
                    <div className="flex items-center">
                      <FiTag size={14} className="mr-2" />
                      <span>{t.coupon.limit}: {coupon.usage_limit} {t.coupon.uses}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Coupon Footer */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex justify-end space-x-2">
                <button
                  onClick={() => setPreviewCoupon(coupon)}
                  className="text-blue-600 cursor-pointer hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  {t.coupon.preview}
                </button>
                <button
                  onClick={() => handleEdit(coupon)}
                  className="text-gray-600 cursor-pointer hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Edit"
                >
                  <FiEdit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(coupon.code)}
                  className="text-red-600 cursor-pointer hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.coupon.couponCode} *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                  disabled={!!editingCoupon}
                  placeholder="SUMMER2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.coupon.discountType} *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.coupon.value} *
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                  min="0"
                  step={formData.type === "percentage" ? "1" : "0.01"}
                  placeholder={formData.type === "percentage" ? "10" : "5.00"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.coupon.minimumOrderAmount}
                </label>
                <input
                  type="number"
                  name="min_order_amount"
                  value={formData.min_order_amount || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.coupon.startDate} *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.coupon.endDate} *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.coupon.usageLimit}
                </label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  id="is_active"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  {t.coupon.active}
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCoupon(null);
                  }}
                  className="px-4 py-2 border cursor-pointer border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t.coupon.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 cursor-pointer bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingCoupon ? t.coupon.updateCoupon : t.coupon.createCoupons}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t.coupon.couponPreview}
              </h2>
            </div>

            <div className="p-6">
              <div
                className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white text-center mb-6`}
              >
                <h3 className="text-2xl font-bold mb-2">
                  {getDiscountDisplay(previewCoupon)}
                </h3>
                <p className="text-lg font-mono bg-white/20 py-1 px-3 rounded-md inline-block">
                  {previewCoupon.code}
                </p>
                <p className="text-lg mt-3 opacity-90">
                  {previewCoupon.min_order_amount
                    ? `${t.coupon.onOrderOver} $${previewCoupon.min_order_amount}`
                    : `${t.coupon.onOrderOver}`}
                </p>
              </div>

              <div className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>{t.coupon.discountType}:</span>
                  <span className="font-bold">
                    {previewCoupon.type === "fixed"
                      ? t.coupon.fix
                      : t.coupon.percentage}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>{t.coupon.value}:</span>
                  <span className="font-bold">
                    {previewCoupon.type === "fixed"
                      ? `$${previewCoupon.value}`
                      : `${previewCoupon.value}%`}
                  </span>
                </div>

                {previewCoupon.min_order_amount && (
                  <div className="flex justify-between">
                    <span>{t.coupon.minimumOrder}:</span>
                    <span className="font-bold">
                      ${previewCoupon.min_order_amount}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{t.coupon.validFrom}:</span>
                  <span className="font-bold">
                    {new Date(previewCoupon.start_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>{t.coupon.validUntil}:</span>
                  <span className="font-bold">
                    {new Date(previewCoupon.end_date).toLocaleDateString()}
                  </span>
                </div>

                {previewCoupon.usage_limit && (
                  <div className="flex justify-between">
                    <span>{t.coupon.usageLimit}:</span>
                    <span className="font-bold">
                      {previewCoupon.usage_limit} {t.coupon.times}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{t.coupon.status}:</span>
                  <span
                    className={`font-bold ${isCouponActive(previewCoupon)
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                      }`}
                  >
                    {isCouponActive(previewCoupon) ? t.coupon.active : t.coupon.inactive}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setPreviewCoupon(null)}
                className="px-4 py-2 bg-blue-600 cursor-pointer border border-transparent rounded-md shadow-sm text-lg font-medium text-white hover:bg-blue-700"
              >
                {t.coupon.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
