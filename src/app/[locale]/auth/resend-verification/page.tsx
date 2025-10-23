"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { API_BASE_URL } from "@/lib/config";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

export default function ResendVerificationPage({
    params,
}: {
    params: { locale: "en" | "kh" };
}) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please enter your email address',
            });
            return;
        }

        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });

        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/email/verification-notification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                Toast.fire({
                    icon: 'success',
                    title: 'Verification email sent!',
                });
                setTimeout(() => {
                    router.push(`/${params.locale}/auth/login`);
                }, 3000);
            } else {
                Toast.fire({
                    icon: 'error',
                    title: data.message || 'Failed to send verification email',
                });
            }
        } catch (error) {
            Toast.fire({
                icon: 'error',
                title: 'An error occurred. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-6 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Resend Verification Email</CardTitle>
                    <p className="text-gray-600 mt-2">
                        Enter your email address to receive a new verification link.
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleResend} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-black text-white hover:bg-gray-800"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Resend Verification Email'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/${params.locale}/auth/login`)}
                        >
                            Back to Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}