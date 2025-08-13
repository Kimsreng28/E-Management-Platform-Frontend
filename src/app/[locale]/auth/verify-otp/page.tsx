"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

import { verifyOtp } from "@/lib/api/auth";

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get current locale from URL
  const currentLocale = pathname.split("/")[1] || "en";
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Email is required");
      router.push(`/${currentLocale}/auth/forgot-password`);
    }
  }, [email, router, currentLocale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the OTP code");
      return;
    }

    try {
      setIsLoading(true);
      await verifyOtp(email, otp);
      toast.success("OTP verified! Please reset your password.");
      router.push(
        `/${currentLocale}/auth/reset-password?email=${encodeURIComponent(
          email
        )}&otp=${encodeURIComponent(otp)}`
      );
    } catch (error: any) {
      toast.error(error.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md rounded-3xl border border-gray-300 shadow-lg">
        <CardHeader className="text-center px-10 pt-10">
          <CardTitle className="text-3xl font-semibold text-black/85 font-inria-sans">
            Verify OTP
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1 font-inria-sans">
            Enter the code sent to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pt-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label
                htmlFor="otp"
                className="text-gray-900 font-medium font-inria-sans"
              >
                OTP Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter your OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoComplete="one-time-code"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-900 focus:ring-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center px-10 pb-10">
          <p className="text-sm text-gray-700 font-inria-sans">
            Didn't receive the code?{" "}
            <a
              href={`/${currentLocale}/auth/forgot-password1`}
              className="font-semibold text-black hover:underline hover:text-gray-900"
            >
              Resend
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
