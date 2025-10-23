"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerificationSuccessPage({
    params,
}: {
    params: { locale: "en" | "kh" };
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState("Email verified successfully");

    useEffect(() => {
        const urlMessage = searchParams.get('message');
        if (urlMessage) {
            setMessage(urlMessage);
        }
    }, [searchParams]);

    const handleRedirect = () => {
        router.push(`/${params.locale}/auth/login`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-6 py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Email Verification Successful</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        {message}
                    </p>
                    <Button
                        onClick={handleRedirect}
                        className="w-full bg-black text-white hover:bg-gray-800"
                    >
                        Continue to Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}