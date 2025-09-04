import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inria_Sans } from "next/font/google";
import "./globals.css";

import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import "flag-icons/css/flag-icons.min.css";
import { ChatProvider } from "@/contexts/ChatContext";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        if (
          localStorage.getItem('darkMode') === 'true' ||
          (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ) {
          document.documentElement.classList.add('dark');
        }
      `,
          }}
        />
      </head>

      <body
        className={`${inriaSans.variable} font-sans antialiased bg-white text-gray-900`}
      >
        <CartProvider>
          <WishlistProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
