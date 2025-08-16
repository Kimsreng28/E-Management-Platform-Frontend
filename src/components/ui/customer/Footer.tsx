"use client";

import { useTranslations } from "@/utils/useTranslations";
import Link from "next/link";
import { FaAddressCard } from "react-icons/fa";
import { IoMdCall, IoMdMail } from "react-icons/io";

interface FooterProps {
  language: "en" | "kh";
}

export default function Footer({ language }: FooterProps) {
  const t = useTranslations(language);

  return (
    <footer className="bg-black text-white dark:bg-gray-100 dark:text-gray-900 py-8 sm:py-10 lg:py-12 mt-12 sm:mt-16 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid layout - responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          {/* Logo & Description */}
          <div className="text-center  sm:text-left">
            <Link
              href={`/${language}/customer`}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2 font-bold text-xl"
            >
              <img
                src="/images/logoPlus.png"
                alt="EMP Logo"
                className="h-14 w-14 rounded-2xl mx-auto sm:mx-0"
              />
              <span className="mt-2 sm:mt-0">EMP</span>
            </Link>
            <p className="mt-3 text-sm text-white dark:text-black max-w-xs mx-auto sm:mx-0">
              {t.footer.description}
            </p>
          </div>

          {/* Products */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-3 sm:mb-4">{t.footer.products}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products/multimeter"
                  className="hover:text-primary transition-colors"
                >
                  {t.footer.multimeter}
                </Link>
              </li>
              <li>
                <Link
                  href="/products/clamp-meter"
                  className="hover:text-primary transition-colors"
                >
                  {t.footer.clampMeter}
                </Link>
              </li>
              <li>
                <Link
                  href="/products/oscilloscope"
                  className="hover:text-primary transition-colors"
                >
                  {t.footer.oscilloscope}
                </Link>
              </li>
              <li>
                <Link
                  href="/products/power-supply"
                  className="hover:text-primary transition-colors"
                >
                  {t.footer.powerSupply}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-3 sm:mb-4">{t.footer.support}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors"
                >
                  {t.footer.contactUs}
                </Link>
              </li>
              <li>
                <Link
                  href="/warranty"
                  className="hover:text-primary transition-colors"
                >
                  {t.footer.warranty}
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-primary transition-colors"
                >
                  {t.footer.shipping}
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="hover:text-primary transition-colors"
                >
                  {t.footer.returns}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-3 sm:mb-4">{t.footer.contact}</h3>
            <div className="space-y-2 text-sm text-white dark:text-black">
              <p className="flex items-center gap-2">
                {" "}
                <IoMdCall /> +855 12 345 678
              </p>
              <p className="flex items-center gap-2">
                <IoMdMail />
                info@emp-platform.com
              </p>
              <p className="flex items-center gap-2">
                <FaAddressCard />
                Phnom Penh, Cambodia
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-gray-300 dark:border-gray-700 mt-8 pt-6 text-center text-xs sm:text-sm text-white dark:text-black">
          <p>&copy; 2025 EMP Platform. {t.footer.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  );
}
