"use client";

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
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { forgotPassword } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Get current locale from URL
  const currentLocale = pathname.split("/")[1] || "en";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setIsLoading(true);
      await forgotPassword(email);
      toast.success("Reset instructions sent! Check your email.");
      router.push(
        `/${currentLocale}/auth/verify-otp?email=${encodeURIComponent(email)}`
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md rounded-3xl border border-gray-300 shadow-lg">
        <CardHeader className="text-center px-10 pt-10">
          <CardTitle className="text-3xl font-semibold text-black/85 font-inria-sans">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1 font-inria-sans">
            Enter your email to receive reset instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pt-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-gray-900 font-medium font-inria-sans"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-900 focus:ring-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Email"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center px-10 pb-10">
          <p className="text-sm text-gray-700 font-inria-sans">
            Remember your password?{" "}
            <a
              href={`/${currentLocale}/auth/login`}
              className="font-semibold text-black hover:underline hover:text-gray-900"
            >
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
