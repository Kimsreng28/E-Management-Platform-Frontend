"use client";

import RichTextEditor from "@/components/ui/dashboard/RichTextEditor";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, use, useRef, useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { MdAdd } from "react-icons/md";
import Swal from "sweetalert2";

interface CreateBrandPageProps {
  params: Promise<{ locale: "en" | "kh" }>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateBrandPage({
  params,
  onClose,
  onSuccess,
}: CreateBrandPageProps) {
  const { locale } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentLocale = pathname.split("/")[1] || "en";
  const language = locale || "en";
  const t = useTranslations(language);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // File input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (preview && !imageUrl) URL.revokeObjectURL(preview);
    if (file) {
      setPreview(URL.createObjectURL(file));
      setImageUrl("");
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      if (description) formData.append("description", description);
      if (website) formData.append("website", website);
      if (logoFile) {
        formData.append("logo_file", logoFile);
      } else if (imageUrl) {
        formData.append("logo", imageUrl);
      }

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/companies`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        let message = "Failed to create brand";
        if (data?.errors)
          message = Object.values(data.errors).flat().join(", ");
        else if (data?.message) message = data.message;
        throw new Error(message);
      }

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Brand created successfully!",
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });

      onSuccess();
    } catch (err: any) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: err.message || "Failed to create brand",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          onClick={onClose}
          className="bg-gray-100 cursor-pointer border border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow px-2 py-2 transition flex-shrink-0"
        >
          <IoIosArrowBack className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">
            {t.createProduct.newBrand}
          </h1>
          <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
            {t.createProduct.createNewBrand}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Brand Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-1 dark:text-gray-200"
            >
              Brand Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1 dark:text-gray-200"
            >
              Description
            </label>
            <RichTextEditor
              content={description}
              onChange={(content) => setDescription(content)}
              placeholder="e.g. Electronics, Fashion, Home Appliances"
            />
          </div>

          {/* Website */}
          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium mb-1 dark:text-gray-200"
            >
              Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo URL */}
              <div>
                <label
                  htmlFor="logoUrl"
                  className="block mb-1 text-sm sm:text-base font-medium dark:text-white"
                >
                  Logo URL
                </label>
                <input
                  id="logoUrl"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setImageUrl(url);

                    // Accept any URL that starts with http/https
                    if (url && /^https?:\/\/.+/.test(url)) {
                      setPreview(url);
                      setLogoFile(null);
                    } else if (!url) {
                      setPreview(null);
                    }
                  }}
                  placeholder="e.g. https://example.com/logo.png"
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
              </div>

              {/* Logo File Upload */}
              <div>
                <label
                  htmlFor="logoFile"
                  className="block mb-1 text-sm sm:text-base font-medium dark:text-white"
                >
                  Logo File
                </label>
                <input
                  id="logoFile"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="w-full text-xs sm:text-sm dark:text-white rounded-lg file:px-2 file:py-1.5 file:cursor-pointer file:rounded-lg file:border-1 file:border-gray-300 file:bg-gray-200 file:text-gray-800 hover:file:bg-gray-300 dark:file:bg-gray-700 dark:file:text-gray-200 transition-all duration-200 ease-in-out"
                />
              </div>
            </div>

            {/* Logo Preview */}
            {preview && (
              <div className="mt-4 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm sm:text-base font-medium dark:text-white">
                    Logo Preview
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (logoFile && preview) {
                        URL.revokeObjectURL(preview); // cleanup object URL
                      }

                      setPreview(null);
                      setLogoFile(null);
                      setImageUrl("");

                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-sm sm:text-base text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
                  >
                    {t.createProduct.remove}
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain border rounded-lg"
                    />
                    {logoFile && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                        {Math.round(logoFile.size / 1024)} KB
                      </div>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {logoFile ? (
                      <>
                        <p>
                          <span className="font-medium">
                            {t.createCategory.name}:
                          </span>{" "}
                          {logoFile.name.length > 20
                            ? `${logoFile.name.substring(0, 20)}...`
                            : logoFile.name}
                        </p>
                        <p>
                          <span className="font-medium">
                            {t.createCategory.size}:
                          </span>{" "}
                          {Math.round(logoFile.size / 1024)} KB
                        </p>
                        <p>
                          <span className="font-medium">
                            {t.createCategory.type}:
                          </span>{" "}
                          {logoFile.type.split("/")[1]}
                        </p>
                      </>
                    ) : (
                      <p>Using external URL</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-black flex items-center justify-center shadow text-white dark:bg-gray-200 dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <MdAdd className="mr-2 w-5 h-5" />
              {loading ? "Creating..." : "Create Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
