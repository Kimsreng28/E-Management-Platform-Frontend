import { CustomerNavbar } from "@/components/ui/customer/CustomerNavbar";
import { Inria_Sans, Kantumruy_Pro } from "next/font/google";

const inriaSans = Inria_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inria-sans",
});

const kantumruyPro = Kantumruy_Pro({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-kantumruy-pro",
});

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${inriaSans.variable} ${kantumruyPro.variable} font-combo`}
    >
      <CustomerNavbar />
      <main className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 min-h-[calc(100vh-60px)]">
        {children}
      </main>
    </div>
  );
}
