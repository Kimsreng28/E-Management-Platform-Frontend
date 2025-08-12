"use client";

import { useRouter, useSearchParams } from "next/navigation";
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

import { resetPassword } from "@/lib/api/auth";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "";
  const otp = searchParams.get("otp") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email || !otp) {
      toast.error("Invalid access. Please try again.");
      router.push("/auth/forgot-password");
    }
  }, [email, otp, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !passwordConfirmation) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== passwordConfirmation) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email, otp, password, passwordConfirmation);
      toast.success("Password reset successful! You can now log in.");
      router.push("/auth/login");
    } catch (error: any) {
      toast.error(error.message || "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md rounded-3xl border border-gray-300 shadow-lg">
        <CardHeader className="text-center px-10 pt-10">
          <CardTitle className="text-3xl font-semibold text-black/85 font-inria-sans">
            Reset Password
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1 font-inria-sans">
            Set a new password for <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pt-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-gray-900 font-medium font-inria-sans"
              >
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="passwordConfirmation"
                className="text-gray-900 font-medium font-inria-sans"
              >
                Confirm New Password
              </Label>
              <Input
                id="passwordConfirmation"
                type="password"
                placeholder="Confirm new password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-900 focus:ring-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center px-10 pb-10">
          <p className="text-sm text-gray-700 font-inria-sans">
            Remembered your password?{" "}
            <a
              href="/auth/login"
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
