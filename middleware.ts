// middleware.ts
import { verifyToken } from "@/lib/api/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const locales = ["en", "kh"];
const protectedAdminRoutes = ["/dashboard", "/admin"];
const protectedCustomerRoutes = ["/customer"];

// Define role-based route access
const roleBasedRoutes = {
  1: ["/dashboard", "/admin"], // Admin - full access
  4: ["/dashboard"], // Vendor - limited dashboard access
  5: ["/dashboard"], // Delivery - limited dashboard access
  2: ["/customer"], // Customer - customer routes
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Skip static files and API routes
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // Handle root redirect
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/en/customer", request.url));
  }

  // Check for valid locale format
  const pathParts = pathname.split("/").filter(Boolean);

  if (pathParts.length === 0) return NextResponse.next();

  // Case 1: Valid locale path (/en/customer)
  if (locales.includes(pathParts[0])) {
    const locale = pathParts[0];
    const route = `/${pathParts.slice(1).join("/")}`;

    // Check if route is protected
    const isAdminRoute = protectedAdminRoutes.some((r) => route.startsWith(r));
    const isCustomerRoute = protectedCustomerRoutes.some((r) =>
      route.startsWith(r)
    );

    if (isAdminRoute || isCustomerRoute) {
      if (!token) {
        // Redirect to login if no token
        return NextResponse.redirect(
          new URL(`/${locale}/auth/login`, request.url)
        );
      }

      try {
        // Verify token and get user role
        const user = await verifyToken(token);
        const userRole = user.role_id;

        // Check if user has access to the requested route based on role
        let hasAccess = false;

        if (isAdminRoute) {
          // For admin routes, check if user role is allowed
          hasAccess = [1, 4, 5].includes(userRole); // admin, vendor, delivery
        } else if (isCustomerRoute) {
          // For customer routes, only customers allowed
          hasAccess = userRole === 2;
        }

        if (!hasAccess) {
          // Redirect to appropriate dashboard based on role
          if ([1, 4, 5].includes(userRole)) {
            return NextResponse.redirect(
              new URL(`/${locale}/dashboard`, request.url)
            );
          } else if (userRole === 2) {
            return NextResponse.redirect(
              new URL(`/${locale}/customer`, request.url)
            );
          } else {
            // Fallback for unknown roles
            return NextResponse.redirect(
              new URL(`/${locale}/auth/login`, request.url)
            );
          }
        }
      } catch (error) {
        // Invalid token - clear cookie and redirect to login
        const response = NextResponse.redirect(
          new URL(`/${locale}/auth/login`, request.url)
        );
        response.cookies.delete("token");
        return response;
      }
    }

    return NextResponse.next();
  }

  // Case 2: Path without locale (/customer)
  return NextResponse.redirect(new URL(`/en${pathname}`, request.url));
}
