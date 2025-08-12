import type { Metadata } from "next";
import { Geist, Geist_Mono, Inria_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inriaSans = Inria_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inria-sans",
});

export const metadata: Metadata = {
  title: "E-Management Platform",
  description: "Professional equipment management and e-commerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inriaSans.variable} font-sans antialiased bg-white text-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}
