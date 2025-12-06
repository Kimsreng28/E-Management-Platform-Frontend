"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";

interface DeliveryAgentRatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    delivery: any;
    onRatingSubmitted: () => void;
    params: { locale: "en" | "kh" };
}

export default function DeliveryAgentRatingModal({
    isOpen,
    onClose,
    delivery,
    onRatingSubmitted,
    params,
}: DeliveryAgentRatingModalProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const language = params.locale || "en";
    const t = useTranslations(language);

    if (!isOpen || !delivery) return null;

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            setError("");
            setSuccess(false);

            const token = localStorage.getItem("token");
            if (!token) {
                setError("Please login to submit rating");
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/deliveries/${delivery.id}/rate-agent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        rating: rating,
                        comment: comment.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setError("");

                // Show success message for 2 seconds before closing
                setTimeout(() => {
                    onRatingSubmitted();
                    handleClose();
                }, 2000);
            } else {
                setError(data.message || "Failed to submit rating");
                setSuccess(false);
            }
        } catch (error) {
            setError("An error occurred while submitting rating");
            setSuccess(false);
            console.error("Rating submission error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(5);
        setComment("");
        setError("");
        setSuccess(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-4">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Rate Delivery Agent
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

                    <div className="mb-4">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Delivery #{delivery.tracking_number}
                        </p>
                        {delivery.agent && (
                            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                                    <span className="text-blue-600 dark:text-blue-300 font-medium">
                                        {delivery.agent.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {delivery.agent.name}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Delivery Agent
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {success ? (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-green-700 dark:text-green-300 font-medium">
                                    Rating submitted successfully!
                                </p>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                Closing in 2 seconds...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    How was your delivery experience?
                                </label>
                                <div className="flex justify-center space-x-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <svg
                                                className={`w-10 h-10 ${star <= rating
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
                                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                    {rating === 5 && "Excellent - Outstanding service!"}
                                    {rating === 4 && "Very Good - Great service"}
                                    {rating === 3 && "Good - Met expectations"}
                                    {rating === 2 && "Fair - Could be better"}
                                    {rating === 1 && "Poor - Needs improvement"}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Additional comments (optional)
                                </label>
                                <textarea
                                    id="comment"
                                    rows={3}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share details about your delivery experience..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded">
                                    {error}
                                </div>
                            )}

                            <div className="flex space-x-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {submitting ? "Submitting..." : "Submit Rating"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}