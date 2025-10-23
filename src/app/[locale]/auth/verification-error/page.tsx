"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerificationErrorPage({
    params,
}: {
    params: { locale: "en" | "kh" };
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState("Verification failed");

    useEffect(() => {
        const urlMessage = searchParams.get('message');
        if (urlMessage) {
            setMessage(urlMessage);
        }
    }, [searchParams]);

    const handleRedirect = () => {
        router.push(`/${params.locale}/auth/login`);
    };

    const handleResend = () => {
        // You can implement resend verification logic here
        router.push(`/${params.locale}/auth/resend-verification`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-6 py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <XCircle className="h-16 w-16 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl">Verification Failed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        {message}
                    </p>
                    <div className="space-y-2">
                        <Button
                            onClick={handleRedirect}
                            className="w-full bg-black text-white hover:bg-gray-800"
                        >
                            Back to Login
                        </Button>
                        <Button
                            onClick={handleResend}
                            variant="outline"
                            className="w-full"
                        >
                            Resend Verification Email
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}