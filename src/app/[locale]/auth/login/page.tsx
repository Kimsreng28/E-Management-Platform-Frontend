"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { Separator } from "@/components/ui/Separator";
import { loginUser } from "@/lib/api/auth";
import { Inria_Sans, Kantumruy_Pro } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";

const inriaSans = Inria_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inria-sans",
});

const kantumruyPro = Kantumruy_Pro({
  subsets: ["latin", "khmer"],
  weight: ["400", "700"],
  variable: "--font-kantumruy-pro",
});

export default function LoginPage({
  params,
}: {
  params: { locale: "en" | "kh" };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState("");
  const pathname = usePathname();

  // get current locale from url
  const currentLocale = pathname.split("/")[1] || "en";

  // translate
  const language = params.locale || "en";
  const t = useTranslations(language);

  // Validation error states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const validateForm = () => {
    let valid = true;
    let newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      background: "#fff",
      customClass: {
        popup: "swal2-sm-toast",
      },
      didOpen: (toast) => {
        toast.style.fontSize = "0.85rem";
        toast.style.fontFamily = "Inria Sans, Kantumruy Pro, sans-serif";
        toast.style.minWidth = "200px";
        toast.style.padding = "8px 12px";
        toast.style.borderRadius = "10px";
        toast.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
        toast.style.opacity = "0";
        toast.animate([{ opacity: "0" }, { opacity: "1" }], {
          duration: 300,
          fill: "forwards",
        });
      },
      willClose: (toast) => {
        toast.animate([{ opacity: "1" }, { opacity: "0" }], {
          duration: 300,
          fill: "forwards",
        });
      },
    });

    try {
      setIsLoading(true);
      const response = await loginUser({ email, password });

      if (response.token) {
        Toast.fire({
          icon: "success",
          title: t.login.loginSuccess,
        });

        setTimeout(() => {
          router.replace("/");
        }, 2500); // wait until toast closes
      } else {
        Toast.fire({
          icon: "error",
          title: t.login.loginFailed,
        });
      }
    } catch (error: any) {
      Toast.fire({
        icon: "error",
        title: error.message || "Login failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${inriaSans.variable} ${kantumruyPro.variable} font-combo min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-6 py-12`}
    >
      <Card className="w-full max-w-md rounded-3xl border border-gray-300 shadow-lg">
        <CardHeader className="text-center px-10 pt-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/images/logo.png" alt="" className="h-25 w-25" />
          </div>
          <CardTitle className="text-3xl font-semibold text-black/85 font-combo ">
            {t.login.welcomeBack}
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1 font-combo ">
            {t.login.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pt-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-gray-900 font-medium font-combo "
              >
                {t.login.emailAddress}
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-12 ${errors.email ? "border-red-500" : ""}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-gray-900 font-medium font-combo"
              >
                {t.login.password}
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-12 pr-12 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  className="border-gray-400 checked:bg-black checked:border-black"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-gray-900 font-combo"
                >
                  {t.login.rememberMe}
                </Label>
              </div>
              <Link
                href={`/${currentLocale}/auth/forgot-password`}
                className="text-sm font-combo font-medium text-black hover:underline hover:text-gray-700"
              >
                {t.login.forgotPassword}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer bg-black text-white hover:bg-gray-900 focus:ring-black font-combo font-semibold"
              disabled={isLoading}
            >
              {isLoading ? t.login.signingIn : t.login.signIn}
            </Button>
          </form>

          {/* Social login */}
          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase text-gray-600 font-semibold tracking-wider font-combo">
                <span className="bg-white px-3">{t.login.orContinueWith}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full font-combo flex items-center justify-center border-black text-black hover:bg-black hover:text-white"
                onClick={() => {
                  window.open(`${API_BASE_URL}/auth/google/redirect`, "_self");
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M20.66 10.2c.096 0 .179.067.195.161c.094.526.145 1.092.145 1.639a8.97 8.97 0 0 1-2.293 6.001a.197.197 0 0 1-.274.018l-2.445-2.07a.206.206 0 0 1-.016-.297a5.4 5.4 0 0 0 1.114-1.852H12.2a.2.2 0 0 1-.2-.2v-3.2c0-.11.09-.2.2-.2zm-6.187 6.6a.21.21 0 0 1 .226.024l2.568 2.173a.196.196 0 0 1-.01.309A8.96 8.96 0 0 1 12 21a9 9 0 0 1-7.548-4.097a.197.197 0 0 1 .046-.263l2.545-1.962a.207.207 0 0 1 .303.062a5.4 5.4 0 0 0 7.127 2.06M6.68 12.926a.2.2 0 0 1-.076.197L3.869 15.23a.196.196 0 0 1-.304-.084A9 9 0 0 1 3 12c0-1.152.217-2.254.612-3.267a.196.196 0 0 1 .299-.085l2.732 2.004c.065.047.095.13.078.208a5.4 5.4 0 0 0-.042 2.066m.468-3.765c.096.07.231.042.295-.058A5.4 5.4 0 0 1 12 6.6a5.37 5.37 0 0 1 3.44 1.245a.205.205 0 0 0 .276-.01l2.266-2.267a.197.197 0 0 0-.007-.286A8.95 8.95 0 0 0 12 3a8.99 8.99 0 0 0-7.484 4a.197.197 0 0 0 .049.267z"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full font-combo flex items-center justify-center border-black text-black hover:bg-black hover:text-white"
                onClick={() =>
                  (window.location.href = `${API_BASE_URL}/auth/telegram/redirect`)
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19c-.14.75-.42 1-.68 1.03c-.58.05-1.02-.38-1.58-.75c-.88-.58-1.38-.94-2.23-1.5c-.99-.65-.35-1.01.22-1.59c.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02c-.09.02-1.49.95-4.22 2.79c-.4.27-.76.41-1.08.4c-.36-.01-1.04-.2-1.55-.37c-.63-.2-1.12-.31-1.08-.66c.02-.18.27-.36.74-.55c2.92-1.27 4.86-2.11 5.83-2.51c2.78-1.16 3.35-1.36 3.73-1.36c.08 0 .27.02.39.12c.1.08.13.19.14.27c-.01.06.01.24 0 .38"
                  />
                </svg>
                Telegram
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-center px-10 pb-10 relative">
          {/* Loading overlay */}
          <LoadingOverlay show={isLoading} />

          <p className="text-sm text-gray-700 font-combo flex items-center justify-center gap-2 relative z-10">
            {t.login.doNotHaveAnAccount}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  router.push(`/${currentLocale}/auth/register`);
                }, 300); // small delay for smooth UX
              }}
              className="font-semibold text-black hover:underline hover:text-gray-900"
              disabled={isLoading}
            >
              {t.login.signUp}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
