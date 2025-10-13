"use client";

import { API_BASE_URL } from "@/lib/config";
import { useState } from "react";
import Swal from "sweetalert2";

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export default function ContactForm({ language }: { language: "en" | "kh" }) {
    const [formData, setFormData] = useState<ContactFormData>({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus({ type: null, message: "" });

        try {
            const response = await fetch(`${API_BASE_URL}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: "success",
                    title:
                        language === "en"
                            ? "Your message has been sent successfully!"
                            : "សាររបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ!",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    background: "#f0fdf4",
                });
                setFormData({ name: "", email: "", subject: "", message: "" });
            } else {
                throw new Error(result.message);
            }
        } catch {
            Swal.fire({
                icon: "error",
                title:
                    language === "en"
                        ? "Failed to send message."
                        : "មិនអាចផ្ញើសារបានទេ។",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: "#fef2f2",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Status Message */}
            {submitStatus.type && (
                <div className={`p-4 rounded-lg ${submitStatus.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                    : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                    }`}>
                    {submitStatus.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {language === "en" ? "Full Name" : "ឈ្មោះពេញ"}
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder={language === "en" ? "Your name" : "ឈ្មោះរបស់អ្នក"}
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="your.email@example.com"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === "en" ? "Subject" : "ប្រធានបទ"}
                </label>
                <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder={language === "en" ? "What is this regarding?" : "តើនេះគឺទាក់ទងនឹងអ្វី?"}
                />
            </div>

            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === "en" ? "Message" : "សារ"}
                </label>
                <textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder={language === "en" ? "How can we help you?" : "តើយើងអាចជួយអ្នកបានយ៉ាងដូចម្តេច?"}
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting
                    ? (language === "en" ? "Sending..." : "កំពុងផ្ញើ...")
                    : (language === "en" ? "Send Message" : "ផ្ញើសារ")
                }
            </button>
        </form>
    );
}
