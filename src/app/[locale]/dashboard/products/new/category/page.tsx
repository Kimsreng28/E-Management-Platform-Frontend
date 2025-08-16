"use client";

import RichTextEditor from "@/components/ui/dashboard/RichTextEditor";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { IoIosArrowBack, IoIosArrowDown } from "react-icons/io";
import { MdAdd, MdOutlineViewInAr } from "react-icons/md";
import Swal from "sweetalert2";

interface Category {
  id: number;
  name: string;
}

export default function CreateCategoryPage({
  params,
}: {
  params: { locale: "en" | "kh" };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split("/")[1] || "en";

  const language = params.locale || "en";

  // translate function
  const t = useTranslations(language);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [order, setOrder] = useState<number>(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        const data = await res.json();
        if (Array.isArray(data.data)) setCategories(data.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Preview uploaded image
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (preview) URL.revokeObjectURL(preview); // cleanup previous preview
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("parent_id", parentId !== null ? String(parentId) : "");
      formData.append("order", order ? String(order) : "0");
      formData.append("is_featured", isFeatured ? "1" : "0");

      if (imageFile) formData.append("image_file", imageFile);
      else if (imageUrl) formData.append("image", imageUrl);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      let data: any = null;
      if (contentType?.includes("application/json")) data = await res.json();
      else {
        const text = await res.text();
        throw new Error("Server error: " + text);
      }

      if (!res.ok) {
        let message = "Failed to create category";
        if (data?.errors)
          message = Object.values(data.errors).flat().join(", ");
        else if (data?.message) message = data.message;
        throw new Error(message);
      }

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Category created successfully!",
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });

      router.push(`/${currentLocale}/dashboard/products`);
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: err.message || "Failed to create category",
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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${currentLocale}/dashboard/products`)}
          className="bg-gray-100 border border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow px-2 py-2 transition flex-shrink-0"
        >
          <IoIosArrowBack className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">
            {t.createCategory.addNewCategory}
          </h1>
          <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
            {t.createCategory.createNewProductCategory}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              router.push(`/${currentLocale}/dashboard/products/view`)
            }
            className="bg-gray-100 flex items-center border border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow px-4 py-2 text-sm sm:text-base transition"
          >
            <MdOutlineViewInAr className="mr-2 w-5 h-5" />
            {t.createCategory.viewCategories}
          </button>
        </div>
      </div>

      {/* Card Form */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="categoryName"
              className="block mb-1 text-sm sm:text-base font-medium dark:text-white"
            >
              <span className="text-red-500">*</span> {t.createCategory.name}
            </label>
            <input
              id="categoryName"
              type="text"
              placeholder="e.g. Electronics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="categoryDescription"
              className="block mb-1 text-sm sm:text-base font-medium dark:text-white"
            >
              {t.createCategory.description}
            </label>

            <RichTextEditor
              content={description}
              onChange={(content) => setDescription(content)}
              placeholder="e.g. Electronics, Fashion, Home Appliances"
            />
          </div>

          {/* Image Card */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image URL */}
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block mb-1 text-sm sm:text-base font-medium dark:text-white"
                >
                  {t.createCategory.imageUrl}
                </label>
                <input
                  id="imageUrl"
                  type="text"
                  value={imageUrl}
                  placeholder="e.g. https://example.com/image.jpg"
                  onChange={(e) => {
                    const url = e.target.value;
                    setImageUrl(url);
                    if (
                      url &&
                      /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg)$/i.test(
                        url
                      )
                    ) {
                      setPreview(url);
                      setImageFile(null);
                    } else if (!url) {
                      setPreview(null);
                    }
                  }}
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
              </div>

              {/* File Upload */}
              <div>
                <label
                  htmlFor="imageFile"
                  className="block mb-1 text-sm sm:text-base font-medium dark:text-white"
                >
                  {t.createCategory.uploadImage}
                </label>
                <input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs sm:text-sm dark:text-white rounded-lg file:px-2 file:py-1.5 file:cursor-pointer file:rounded-lg file:border-1 file:border-gray-300 file:bg-gray-200 file:text-gray-800 hover:file:bg-gray-300 dark:file:bg-gray-700 dark:file:text-gray-200 transition-all duration-200 ease-in-out"
                />
              </div>
            </div>

            {/* Image Preview */}
            {preview && (
              <div className="mt-4 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm sm:text-base font-medium dark:text-white">
                    {t.createCategory.imagePreview}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setImageFile(null);
                      setImageUrl("");
                    }}
                    className="text-sm sm:text-base text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
                  >
                    {t.createCategory.remove}
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain border rounded-lg"
                    />
                    {imageFile && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                        {Math.round(imageFile.size / 1024)} KB
                      </div>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {imageFile && (
                      <>
                        <p>
                          <span className="font-medium">
                            {t.createCategory.nameImage}:
                          </span>{" "}
                          {imageFile.name.length > 20
                            ? `${imageFile.name.substring(0, 20)}...`
                            : imageFile.name}
                        </p>
                        <p>
                          <span className="font-medium">
                            {t.createCategory.size}:
                          </span>{" "}
                          {Math.round(imageFile.size / 1024)} KB
                        </p>
                        <p>
                          <span className="font-medium">
                            {t.createCategory.type}:
                          </span>{" "}
                          {imageFile.type.split("/")[1]}
                        </p>
                      </>
                    )}
                    {!imageFile && imageUrl && <p>Using external image URL</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent Category */}
            <div>
              <label
                htmlFor="parentCategory"
                className="block mb-1 text-sm sm:text-base font-medium dark:text-white"
              >
                {t.createCategory.parentCategory}
              </label>
              <div className="relative">
                <select
                  id="parentCategory"
                  value={parentId ?? ""}
                  onChange={(e) =>
                    setParentId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full text-sm sm:text-base appearance-none border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 pr-8"
                >
                  <option value="">{t.createCategory.none}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <IoIosArrowDown className="w-4 h-4 text-gray-400 dark:text-gray-300 transition-transform duration-200" />
                </div>
              </div>
            </div>

            {/* Order */}
            <div>
              <label
                htmlFor="order"
                className="block mb-1 text-sm sm:text-base font-medium dark:text-white"
              >
                {t.createCategory.order}
              </label>
              <input
                type="number"
                id="order"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center mt-4">
            <label
              htmlFor="isFeatured"
              className="relative flex items-center cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                id="isFeatured"
                className="sr-only peer"
              />
              <div
                className="w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner relative transition-colors duration-300
            peer-checked:bg-green-500 dark:peer-checked:bg-green-400
            after:content-[''] after:absolute after:top-0.5 after:left-0.5
            after:w-5 after:h-5 after:bg-white dark:after:bg-gray-200 after:rounded-full
            after:shadow-md after:transition-transform after:duration-300 ease-in-out
            peer-checked:after:translate-x-6"
              ></div>
              <span className="ml-3 text-sm sm:text-base font-medium text-gray-900 dark:text-gray-300 select-none">
                {t.createCategory.featured}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-black flex items-center justify-center shadow text-white dark:bg-gray-200 dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <MdAdd className="mr-2 w-5 h-5" />
              {loading
                ? t.createCategory.creating
                : t.createCategory.createNewCategory}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
