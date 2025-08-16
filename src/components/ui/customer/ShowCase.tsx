import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/utils/useTranslations";
import Link from "next/link";
import { FaCartShopping } from "react-icons/fa6";

interface HomeProps {
  language: "en" | "kh";
}

export default function ShowCase({ language }: HomeProps) {
  const t = useTranslations(language);

  return (
    <section className="relative bg-gradient-to-br from-gray-900 to-blue-900 dark:from-gray-800 dark:to-gray-900 py-20 sm:py-24 md:py-32 transition-all duration-500">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl"></div>
      </div>

      <div className="container relative px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Title with gradient text */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 leading-tight mb-4 sm:mb-6 animate-fade-in">
            {t.showCase.title}
          </h1>

          {/* Subtitle with better readability */}
          <p className="text-xl sm:text-2xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.showCase.subtitle}
          </p>

          {/* Enhanced buttons with hover effects */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={`/${language}/customer/products`}
              className="w-full sm:w-auto group"
            >
              <Button
                variant="black"
                className="w-full sm:w-auto px-8 py-5 hover:bg-white/30 text-gray-900 rounded-xl transition-all duration-500 transform group-hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>{t.showCase.shopNow}</span>
                <FaCartShopping className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <Link
              href={`/${language}/customer/categories`}
              className="w-full sm:w-auto group"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto px-8 py-5 border-1 border-white text-white hover:bg-white/10 rounded-xl transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {t.showCase.browseCategories}
              </Button>
            </Link>
          </div>

          {/* Trust badges (optional) */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400"></span>
              <span>{t.showCase.highlights.secure}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400"></span>
              <span>{t.showCase.highlights.payment}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400"></span>
              <span>{t.showCase.highlights.support}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
