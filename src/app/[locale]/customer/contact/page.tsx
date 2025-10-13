import ContactForm from "@/components/ui/customer/ContactForm";
import { API_BASE_URL } from "@/lib/config";
import { FAQ } from "@/types/faq";

// Add this type definition if you don't have it already
interface FAQCategory {
  id: number;
  name_en: string;
  name_kh: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  faqs_count?: number;
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: "en" | "kh" }>;
}) {
  const { locale } = await params;
  const language = locale || "en";

  // Fetch FAQs from the API
  let faqs: FAQ[] = [];
  let categories: FAQCategory[] = [];
  let error = null;

  try {
    // Fetch FAQs
    const faqsResponse = await fetch(`${API_BASE_URL}/api/faqs`, {
      cache: "no-store",
    });

    if (faqsResponse.ok) {
      const faqsData = await faqsResponse.json();
      faqs = faqsData.data || [];
    } else {
      error = "Failed to fetch FAQs";
    }

    // Fetch categories
    const categoriesResponse = await fetch(
      `${API_BASE_URL}/api/faqs/categories`,
      {
        cache: "no-store",
      }
    );

    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      categories = categoriesData.data || [];
    }
  } catch (err) {
    error = "Failed to connect to the server";
    console.error("API Error:", err);
  }

  // Get FAQs for display (you might want to filter or limit them)
  const displayFaqs = faqs.slice(0, 4);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {language === "en" ? "Contact Us" : "ទាក់ទងពួកយើង"}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {language === "en"
            ? "Get in touch with our team for product inquiries, technical support, or business partnerships"
            : "ទាក់ទងក្រុមរបស់យើងសម្រាប់ការស្វែងរកផលិតផល, ជំនួយបច្ចេកទេស, ឬ អាជីវកម្ម"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
            {language === "en" ? "Contact Information" : "ព័ត៌មានទំនាក់ទំនង"}
          </h2>

          <div className="space-y-5">
            <div className="flex items-start">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  {language === "en" ? "Phone" : "ទូរស័ព្ទ"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  +855 12 345 678
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  +855 987 654 321
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Email
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  info@emp-platform.com
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  support@emp-platform.com
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  {language === "en" ? "Address" : "អាសយដ្ឋាន"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  123 Street, Phnom Penh
                </p>
                <p className="text-gray-600 dark:text-gray-400">Cambodia</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
              {language === "en" ? "Follow Us" : "តាមដានពួកយើង"}
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
            {language === "en" ? "Send us a message" : "ផ្ញើសារមកពួកយើង"}
          </h2>

          <ContactForm language={language} />
        </div>
      </div>

      {/* FAQ Section */}
      <section className="mt-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
            {language === "en"
              ? "Frequently Asked Questions"
              : "សំណួរដែលសួរញឹកញាប់"}
          </h2>
          <p className="text-muted-foreground">
            {language === "en"
              ? "Quick answers to common questions"
              : "ចម្លើយរហ័សទៅនឹងសំណួរទូទៅ"}
          </p>
        </div>

        {error ? (
          <div className="text-center text-red-500 mb-8">
            {language === "en"
              ? "Unable to load FAQs. Please try again later."
              : "មិនអាចផ្ទុក FAQ បានទេ។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។"}
          </div>
        ) : displayFaqs.length === 0 ? (
          <div className="text-center text-gray-500 mb-8">
            {language === "en"
              ? "No FAQs available at the moment."
              : "មិនមាន FAQ ដែលអាចប្រើបាននាពេលបច្ចុប្បន្ននេះទេ។"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {displayFaqs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-white">
                  {language === "en" ? faq.question_en : faq.question_kh}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === "en" ? faq.answer_en : faq.answer_kh}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Map Section */}
      <div className="mt-16 rounded-2xl overflow-hidden shadow-lg">
        <div className="relative w-full h-96">
          {/* Google Map iframe */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.914719756717!2d104.90564341533556!3d11.551975888352156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31095135f8a27da9%3A0x3dafcb904e8468cf!2sE1-38%20STREET%20199%2C%20Chamkarmon%2C%20Phnom%20Penh!5e0!3m2!1sen!2skh!4v1693056430000!5m2!1sen!2skh"
            className="absolute top-0 left-0 w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>

          {/* Overlay for text & button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/70 to-purple-50/70 dark:from-gray-700/70 dark:to-gray-800/70 p-6 text-center rounded-2xl">
            <div className="flex items-center justify-center mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-gray-800 dark:text-white"
                viewBox="0 0 576 512"
              >
                <path
                  fill="currentColor"
                  d="M302.8 312C334.9 271.9 408 174.6 408 120C408 53.7 354.3 0 288 0S168 53.7 168 120c0 54.6 73.1 151.9 105.2 192c7.7 9.6 22 9.6 29.6 0M416 503l144.9-58c9.1-3.6 15.1-12.5 15.1-22.3V152c0-17-17.1-28.6-32.9-22.3l-116 46.4c-.5 1.2-1 2.5-1.5 3.7c-2.9 6.8-6.1 13.7-9.6 20.6zM15.1 187.3C6 191 0 199.8 0 209.6v270.8c0 17 17.1 28.6 32.9 22.3L160 451.8V200.4c-3.5-6.9-6.7-13.8-9.6-20.6c-5.6-13.2-10.4-27.4-12.8-41.5L15 187.3zM384 255c-20.5 31.3-42.3 59.6-56.2 77c-20.5 25.6-59.1 25.6-79.6 0c-13.9-17.4-35.7-45.7-56.2-77v194.4l192 54.9z"
                />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {language === "en" ? "Our Location" : "ទីតាំងរបស់យើង"}
            </h3>

            <a
              href="https://www.google.com/maps/place/E1-38+STREET+199+CHAMKARMON+PHNOMPENH/@11.5525732,104.8970525,2842m/data=!3m1!1e3!4m14!1m7!3m6!1s0x31095135f8a27da9:0x3dafcb904e8468cf!2sE1-38+STREET+199+CHAMKARMON+PHNOMPENH!8m2!3d11.5519759!4d104.907832!16s%2Fg%2F11sx8146_0!3m5!1s0x31095135f8a27da9:0x3dafcb904e8468cf!8m2!3d11.5519759!4d104.907832!16s%2Fg%2F11sx8146_0?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full"
            >
              {language === "en" ? "Open in Google Maps" : "បើកនៅ Google Maps"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
