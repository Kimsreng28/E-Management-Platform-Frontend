"use client";

import { useTranslations } from "@/utils/useTranslations";
import Link from "next/link";

interface FooterProps {
  language: "en" | "kh";
}

export default function Footer({ language }: FooterProps) {
  const t = useTranslations(language);

  return (
    <footer className="bg-black text-white py-12 mt-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div>
            <Link
              href={`/${language}/customer`}
              className="flex items-center space-x-2 space-y-2 font-bold text-xl text-white dark:text-white"
            >
              <img
                src="/images/logoPlus.png"
                alt="EMP Logo"
                className="h-15 w-15 rounded-2xl"
              />
              <span>EMP</span>
            </Link>
            <p className="text-sm text-gray-300">{t.footer.description}</p>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.products}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products/multimeter"
                  className="hover:text-primary"
                >
                  {t.footer.multimeter}
                </Link>
              </li>
              <li>
                <Link
                  href="/products/clamp-meter"
                  className="hover:text-primary"
                >
                  {t.footer.clampMeter}
                </Link>
              </li>
              <li>
                <Link
                  href="/products/oscilloscope"
                  className="hover:text-primary"
                >
                  {t.footer.oscilloscope}
                </Link>
              </li>
              <li>
                <Link
                  href="/products/power-supply"
                  className="hover:text-primary"
                >
                  {t.footer.powerSupply}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.support}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="hover:text-primary">
                  {t.footer.contactUs}
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="hover:text-primary">
                  {t.footer.warranty}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary">
                  {t.footer.shipping}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary">
                  {t.footer.returns}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.contact}</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>+855 12 345 678</p>
              <p>info@emp-platform.com</p>
              <p>Phnom Penh, Cambodia</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 EMP Platform. {t.footer.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  );
}
