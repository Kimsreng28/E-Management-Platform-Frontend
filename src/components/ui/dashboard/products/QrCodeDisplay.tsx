import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { HiMiniQrCode } from "react-icons/hi2";
import { MdOutlineCancel } from "react-icons/md";

interface QrCodeDisplayProps {
  params: Promise<{ locale: "en" | "kh" }>;
  productSlug: string;
  productName: string;
  onClose: () => void;
}

export default function QrCodeDisplay({
  params,
  productSlug,
  productName,
  onClose,
}: QrCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const { locale } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split("/")[1] || "en";
  const language = locale || "en";
  const t = useTranslations(language);
  const productUrl = `http://127.0.0.1:3000/${currentLocale}/dashboard/products/view/product/${productSlug}`;

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/products/${productSlug}/qr-code/${currentLocale}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setQrCodeUrl(url);
        }
      } catch (error) {
        console.error("Error fetching QR code:", error);
      }
    };

    fetchQrCode();
  }, [productSlug, currentLocale]);

  const downloadQrCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${productName.replace(/\s+/g, "_")}_qrcode.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-3">
        <h3 className="text-lg flex items-center font-semibold text-gray-800 dark:text-gray-100">
          <HiMiniQrCode className="w-6 h-6 mr-2" />
          Product QR Code
        </h3>
        <button
          onClick={onClose}
          className="p-2 cursor-pointer  rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          <MdOutlineCancel className="w-5 h-5 text-red-500 dark:text-red-200" />
        </button>
      </div>

      {/* QR Code */}
      {qrCodeUrl ? (
        <div className="flex flex-col items-center">
          <img
            src={qrCodeUrl}
            alt={`QR Code for ${productName}`}
            title={productUrl}
            className="w-56 h-56 cursor-pointer object-contain mb-4"
          />
          <button
            onClick={downloadQrCode}
            className="flex items-center cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow transition"
          >
            <FiDownload className="w-4 h-4" />
            Download QR Code
          </button>
        </div>
      ) : (
        <div className="flex justify-center items-center h-56">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-blue-500 border-gray-200"></div>
        </div>
      )}
    </div>
  );
}
