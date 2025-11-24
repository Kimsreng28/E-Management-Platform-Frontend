// components/ui/customer/ReviewModal.tsx
"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { Order, OrderItem } from "@/types/order";
import { useTranslations } from "@/utils/useTranslations";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onReviewSubmitted: () => void;
    params: { locale: "en" | "kh" };
}

interface ReviewData {
    product_id: number;
    order_id: number;
    rating: number;
    comment: string;
}

export default function ReviewModal({
    isOpen,
    onClose,
    order,
    onReviewSubmitted,
    params,
}: ReviewModalProps) {
    const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const language = params.locale || "en";
    const t = useTranslations(language);

    if (!isOpen || !order) return null;

    const canReviewItems = order.items.filter(item =>
        order.status === 'completed' || order.status === 'delivered'
    );

    const handleSubmitReview = async () => {
        if (!selectedProduct) return;

        try {
            setSubmitting(true);
            setError("");

            const token = localStorage.getItem("token");
            if (!token) {
                setError("Please login to submit review");
                return;
            }

            const reviewData: ReviewData = {
                product_id: selectedProduct.product_id,
                order_id: order.id,
                rating: rating,
                comment: comment,
            };

            const response = await fetch(`${API_BASE_URL}/api/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(reviewData),
            });

            if (response.ok) {
                onReviewSubmitted();
                handleClose();
            } else {
                const errorData = await response.json();
                setError(errorData.message || "Failed to submit review");
            }
        } catch (error) {
            setError("An error occurred while submitting review");
            console.error("Review submission error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedProduct(null);
        setRating(5);
        setComment("");
        setError("");
        onClose();
    };

    const handleProductSelect = (item: OrderItem) => {
        setSelectedProduct(item);
        setRating(5);
        setComment("");
        setError("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {selectedProduct ? t.ordersDetail.writeReview : t.ordersDetail.selectProduct}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {!selectedProduct ? (
                        // Product Selection View
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {t.ordersDetail.selectProductToReview}
                            </p>
                            <div className="space-y-3">
                                {canReviewItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleProductSelect(item)}
                                        className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {item.product_name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Quantity: {item.quantity} × ${item.unit_price}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Review Form View
                        <div>
                            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    {selectedProduct.product_name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Order #{order.order_number}
                                </p>
                            </div>

                            {/* Rating Stars */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.ordersDetail.yourRating}
                                </label>
                                <div className="flex space-x-1">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setRating(i + 1)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <svg
                                                className={`w-6 h-6 ${i < rating
                                                    ? "text-yellow-400"
                                                    : "text-gray-300"
                                                    }`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.967c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.285-3.967a1 1 0 00-.364-1.118L2.049 9.394c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.967z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {rating === 5 && t.ordersDetail.excellent}
                                    {rating === 4 && t.ordersDetail.veryGood}
                                    {rating === 3 && t.ordersDetail.good}
                                    {rating === 2 && t.ordersDetail.fair}
                                    {rating === 1 && t.ordersDetail.poor}
                                </p>
                            </div>

                            {/* Comment */}
                            <div className="mb-4">
                                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.ordersDetail.yourReview}
                                </label>
                                <textarea
                                    id="comment"
                                    rows={4}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t.ordersDetail.shareExperience}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {t.ordersDetail.back}
                                </button>
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={submitting || !comment.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {submitting ? t.ordersDetail.submitting : t.ordersDetail.submitReview}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}