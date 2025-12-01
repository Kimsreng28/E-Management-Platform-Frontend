"use client";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { TrashIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { MdCheck, MdDeleteOutline, MdPendingActions, MdRateReview, MdReply } from "react-icons/md";
import Swal from "sweetalert2";

interface Review {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    product: {
        id: number;
        name: string;
        vendor_id: number;
    };
    rating: number;
    comment: string;
    is_approved: boolean;
    created_at: string;
    replies: ReviewReply[];
}

interface ReviewReply {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    comment: string;
    is_vendor_reply: boolean;
    created_at: string;
}

interface ReviewStats {
    total_reviews: number;
    pending_reviews: number;
    average_rating: number;
}

export default function CommentPage({
    params,
}: {
    params: Promise<{ locale: "en" | "kh" }>;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const unwrappedParams = use(params);
    const language = unwrappedParams.locale || "en";
    const currentLocale = pathname.split("/")[1] || "en";
    const t = useTranslations(language);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'replied'>('all');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        fetchReviews();
        fetchStats();
    }, [activeTab]);

    const getUserRoleId = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                console.error('No token found');
                return null;
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('User data:', userData);

                // Adjust based on your actual API response structure
                return userData.role_id || userData.data?.role_id || userData.user?.role_id;
            } else {
                console.error('Failed to fetch user data:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    };

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const userRoleId = await getUserRoleId();
            let url = '';

            // Use role_id to determine the endpoint
            if (userRoleId === 4) { // Vendor
                url = `${API_BASE_URL}/api/vendor/reviews`;
            } else if (userRoleId === 1) { // Admin
                url = `${API_BASE_URL}/api/reviews`;
            } else {
                throw new Error('Unauthorized access - Invalid role');
            }

            if (activeTab === 'pending') {
                url += '?is_approved=false';
            }

            console.log('Fetching from URL:', url);

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch reviews: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Reviews response:', data);

            // Handle the standardized response structure
            if (userRoleId === 4) { // Vendor response structure
                if (data.success && data.data) {
                    setReviews(data.data);
                } else {
                    console.warn('Unexpected vendor response structure:', data);
                    setReviews([]);
                }
            } else if (userRoleId === 1) { // Admin response structure (paginated)
                if (data.data && Array.isArray(data.data)) {
                    // Direct paginated response (like your API example)
                    setReviews(data.data);
                } else if (data.success && data.data) {
                    // Standardized success response
                    setReviews(data.data);
                } else {
                    console.warn('Unexpected admin response structure:', data);
                    setReviews([]);
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            Swal.fire({
                icon: 'error',
                title: t.commentsPage.errorFetching,
                text: (error as Error).message || t.commentsPage.tryAgain,
            });
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const userRoleId = await getUserRoleId();
            let url = '';

            // Use appropriate stats endpoint based on role
            if (userRoleId === 4) { // Vendor
                url = `${API_BASE_URL}/api/vendor/reviews/stats`;
            } else if (userRoleId === 1) { // Admin
                url = `${API_BASE_URL}/api/admin/reviews/stats`;
            } else {
                console.error('Invalid role for stats:', userRoleId);
                // Fallback to empty stats
                setStats({
                    total_reviews: 0,
                    pending_reviews: 0,
                    average_rating: 0
                });
                return;
            }

            console.log('Fetching stats from:', url);

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Stats response:', data);

                // Handle the standardized response structure
                if (data.success && data.data) {
                    setStats(data.data);
                } else {
                    console.warn('Unexpected stats response structure:', data);
                    // Fallback to empty stats
                    setStats({
                        total_reviews: 0,
                        pending_reviews: 0,
                        average_rating: 0
                    });
                }
            } else {
                console.error('Failed to fetch stats:', response.status);
                // Fallback to empty stats
                setStats({
                    total_reviews: 0,
                    pending_reviews: 0,
                    average_rating: 0
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Fallback to empty stats
            setStats({
                total_reviews: 0,
                pending_reviews: 0,
                average_rating: 0
            });
        }
    };

    const handleApproveReview = async (reviewId: number) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_approved: true }),
            });

            if (!response.ok) throw new Error('Failed to approve review');

            Swal.fire({
                icon: 'success',
                title: t.commentsPage.reviewApproved,
                text: t.commentsPage.reviewNowVisible,
            });

            fetchReviews();
            fetchStats();
        } catch (error) {
            console.error('Error approving review:', error);
            Swal.fire({
                icon: 'error',
                title: t.commentsPage.approvalFailed,
                text: t.commentsPage.tryAgain,
            });
        }
    };

    const handleSubmitReply = async (reviewId: number) => {
        if (!replyText.trim()) {
            Swal.fire({
                icon: 'warning',
                title: t.commentsPage.emptyReply,
                text: t.commentsPage.pleaseEnterReply,
            });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ comment: replyText }),
            });

            // Check if response is not ok
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to submit reply: ${response.status}`);
            }

            const result = await response.json();

            // Check if the API response indicates success
            if (!result.success) {
                throw new Error(result.message || 'Failed to submit reply');
            }

            Swal.fire({
                icon: 'success',
                title: t.commentsPage.replySubmitted,
                text: t.commentsPage.replySuccess,
            });

            setReplyingTo(null);
            setReplyText('');
            fetchReviews(); // Refresh the reviews to show the new reply
        } catch (error) {
            console.error('Error submitting reply:', error);
            Swal.fire({
                icon: 'error',
                title: t.commentsPage.replyFailed,
                text: (error as Error).message || t.commentsPage.tryAgain,
            });
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        const result = await Swal.fire({
            title: t.commentsPage.deleteReview,
            text: t.commentsPage.deleteConfirm,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t.commentsPage.yesDelete,
            cancelButtonText: t.commentsPage.cancel,
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to delete review');

                Swal.fire({
                    icon: 'success',
                    title: t.commentsPage.deleted,
                    text: t.commentsPage.reviewDeleted,
                });

                fetchReviews();
                fetchStats();
            } catch (error) {
                console.error('Error deleting review:', error);
                Swal.fire({
                    icon: 'error',
                    title: t.commentsPage.deleteFailed,
                    text: t.commentsPage.tryAgain,
                });
            }
        }
    };

    const handleDeleteReply = async (reviewId: number, replyId: number) => {
        const result = await Swal.fire({
            title: t.commentsPage.deleteReply,
            text: t.commentsPage.deleteReplyConfirm,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t.commentsPage.yesDelete,
            cancelButtonText: t.commentsPage.cancel,
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/replies/${replyId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to delete reply');

                Swal.fire({
                    icon: 'success',
                    title: t.commentsPage.deleted,
                    text: t.commentsPage.replyDeleted,
                });

                fetchReviews();
            } catch (error) {
                console.error('Error deleting reply:', error);
                Swal.fire({
                    icon: 'error',
                    title: t.commentsPage.deleteFailed,
                    text: t.commentsPage.tryAgain,
                });
            }
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.commentsPage.manageReviews}</h1>
                    <p className="text-gray-600">{t.commentsPage.manageCustomerReviews}</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24">
                                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 9h6m-6 4h4m-1 7l-4-4H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-2l-4 4z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-600">{t.commentsPage.totalReviews}</h3>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total_reviews}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-600">{t.commentsPage.pendingReviews}</h3>
                                <p className="text-2xl font-semibold text-gray-900">{stats.pending_reviews}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-100 text-green-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-600">{t.commentsPage.averageRating}</h3>
                                <p className="text-2xl font-semibold text-gray-900">{stats.average_rating}/5</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'all'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <MdRateReview className="inline-block mr-1" />
                            {t.commentsPage.allReviews}
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'pending'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <MdPendingActions className="inline-block mr-1" />
                            {t.commentsPage.pendingApproval}
                        </button>
                        <button
                            onClick={() => setActiveTab('replied')}
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'replied'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <MdReply className="inline-block mr-1" />
                            {t.commentsPage.replied}
                        </button>
                    </nav>
                </div>

                {/* Reviews List */}
                <div className="p-6">
                    {reviews.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">{t.commentsPage.noReviews}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t.commentsPage.noReviewsDesc}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                                    {/* Review Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {review.user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900">{review.user.name}</h4>
                                                <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {renderStars(review.rating)}
                                            {!review.is_approved && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    {t.commentsPage.pending}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Review Content */}
                                    <div className="mb-4">
                                        <p className="text-gray-700">{review.comment}</p>
                                    </div>

                                    {/* Product Info */}
                                    <div className="mb-4 p-3 bg-gray-50 rounded">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">{t.commentsPage.product}:</span> {review.product.name}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex space-x-2">
                                            {!review.is_approved && (
                                                <button
                                                    onClick={() => handleApproveReview(review.id)}
                                                    className="inline-flex items-center cursor-pointer px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                >
                                                    <MdCheck className="w-4 h-4 mr-1" />
                                                    {t.commentsPage.approve}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                                                className="inline-flex items-center cursor-pointer px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <MdReply className="w-4 h-4 mr-1" />
                                                {t.commentsPage.reply}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteReview(review.id)}
                                            className="inline-flex items-center cursor-pointer px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <MdDeleteOutline className="w-4 h-4 mr-1" />
                                            {t.commentsPage.delete}
                                        </button>
                                    </div>

                                    {/* Reply Form */}
                                    {replyingTo === review.id && (
                                        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder={t.commentsPage.writeReply}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <div className="mt-2 flex justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyText('');
                                                    }}
                                                    className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    {t.commentsPage.cancel}
                                                </button>
                                                <button
                                                    onClick={() => handleSubmitReply(review.id)}
                                                    className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    {t.commentsPage.submitReply}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Existing Replies */}
                                    {review.replies && review.replies.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {review.replies.map((reply) => (
                                                <div key={reply.id} className="pl-6 border-l-2 border-gray-200">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-xs font-medium text-blue-700">
                                                                    {reply.user.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h5 className="text-sm font-semibold text-gray-900">
                                                                    {reply.user.name}
                                                                    {reply.is_vendor_reply && (
                                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {t.commentsPage.vendor}
                                                                        </span>
                                                                    )}
                                                                </h5>
                                                                <p className="text-xs text-gray-500">{formatDate(reply.created_at)}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteReply(review.id, reply.id)}
                                                            className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                                                        >

                                                            <MdDeleteOutline className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-700">{reply.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}