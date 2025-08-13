// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const locales = ["en", "kh"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
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
    return NextResponse.next();
  }

  // Case 2: Path without locale (/customer)
  return NextResponse.redirect(new URL(`/en${pathname}`, request.url));
}
