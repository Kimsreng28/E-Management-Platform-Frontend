"use client";

import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { MdAdd } from "react-icons/md";

export default function ProductsPage({
  params,
}: {
  params: { locale: "en" | "kh" };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const language = params.locale || "en";

  // get current locale from url
  const currentLocale = pathname.split("/")[1] || "en";

  // translate function
  const t = useTranslations(language);

  const handleAddCategory = () => {
    router.push(`/${currentLocale}/dashboard/products/new/category`);
  };

  const handleAddProduct = () => {
    // Add your product creation navigation logic here
    // router.push(`/${currentLocale}/dashboard/products/new/product`);
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6 sm:space-y-6 md:px-6 sm:py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 dark:text-white">
            {t.productDashboard.products}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300">
            {t.productDashboard.manageYourProducts}
          </p>
        </div>

        {/* Buttons Section */}
        <div className="flex xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Add Category Button */}
          <button
            onClick={handleAddCategory}
            className="flex items-center justify-center shadow-md border border-gray-300 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all duration-200 rounded-lg py-2 px-3 sm:py-2 sm:px-4 text-sm sm:text-base"
          >
            <MdAdd className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">
              {t.productDashboard.addCategory}
            </span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={handleAddProduct}
            className="flex items-center justify-center shadow-md bg-black text-white hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-gray-300 transition-all duration-200 rounded-lg py-2 px-3 sm:py-2 sm:px-4 text-sm sm:text-base"
          >
            <MdAdd className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">
              {t.productDashboard.addProduct}
            </span>
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-4 sm:mt-6">
        {/* Your products content will go here */}
      </div>
    </div>
  );
}
