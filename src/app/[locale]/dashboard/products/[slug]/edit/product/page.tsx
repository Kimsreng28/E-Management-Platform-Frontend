"use client";

import RichTextEditor from "@/components/ui/dashboard/RichTextEditor";
import { API_BASE_URL } from "@/lib/config";
import { useTranslations } from "@/utils/useTranslations";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { BiSolidImageAdd } from "react-icons/bi";
import { FaFileUpload } from "react-icons/fa";
import { GrUpdate } from "react-icons/gr";
import { IoIosArrowBack, IoIosArrowDown } from "react-icons/io";
import { MdAdd, MdDelete, MdOutlineViewInAr } from "react-icons/md";
import Swal from "sweetalert2";

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface ProductImage {
  id: number;
  path: string;
  is_primary: boolean;
}

interface ProductVideo {
  id: number;
  url: string;
}

interface EditProductPageProps {
  params: { locale: "en" | "kh"; slug: string };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProductPage({
  params,
  onClose,
  onSuccess,
}: EditProductPageProps) {
  const { locale, slug } = params;
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split("/")[1] || "en";
  const language = locale || "en";
  const t = useTranslations(language);

  // Form states
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [costPrice, setCostPrice] = useState<number | null>(null);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [warrantyMonths, setWarrantyMonths] = useState<number | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [specifications, setSpecifications] = useState<Record<string, string>>(
    {}
  );
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [existingVideos, setExistingVideos] = useState<ProductVideo[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [videosToDelete, setVideosToDelete] = useState<number[]>([]);

  // Fetch product data and categories/brands on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch product data
        const productRes = await fetch(`${API_BASE_URL}/api/products/${slug}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!productRes.ok) throw new Error("Failed to fetch product data");
        const productData = await productRes.json();

        // Set form data from product
        const product = productData.data || productData;
        setName(product.name);
        setModelCode(product.model_code);
        setStock(product.stock);
        setPrice(product.price);
        setDiscount(product.discount);
        setCostPrice(product.cost_price);
        setShortDescription(product.short_description);
        setDescription(product.description);
        setCategoryId(product.category_id);
        setBrandId(product.brand_id);
        setWarrantyMonths(product.warranty_months);
        setIsFeatured(product.is_featured);
        setIsActive(product.is_active);
        setLowStockThreshold(product.low_stock_threshold || 10);

        // Set specifications if they exist
        if (product.specifications) {
          try {
            const specs =
              typeof product.specifications === "string"
                ? JSON.parse(product.specifications)
                : product.specifications;
            setSpecifications(specs);
          } catch (e) {
            console.error("Error parsing specifications:", e);
          }
        }

        // Set existing media
        if (product.images) {
          setExistingImages(product.images);
          setImagePreviews(
            product.images.map((img: ProductImage) =>
              img.path.startsWith("http")
                ? img.path
                : `${API_BASE_URL}/${img.path}`
            )
          );
        }

        if (product.videos) {
          setExistingVideos(product.videos);
          setVideoPreviews(
            product.videos.map((vid: ProductVideo) =>
              vid.url.startsWith("http") ? vid.url : `${API_BASE_URL}${vid.url}`
            )
          );
        }

        // Fetch categories and brands
        const [categoriesRes, brandsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`),
          fetch(`${API_BASE_URL}/api/companies`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
        ]);

        if (!categoriesRes.ok) throw new Error("Failed to fetch categories");
        if (!brandsRes.ok) throw new Error("Failed to fetch brands");

        const categoriesData = await categoriesRes.json();
        const brandsData = await brandsRes.json();

        setCategories(categoriesData.data || categoriesData);
        setBrands(brandsData.data || brandsData);

        setFetching(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "Failed to load product data",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
        setFetching(false);
      }
    };

    fetchData();
  }, [slug]);

  // Handle image selection - Updated version
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      if (existingImages.length + images.length + newImages.length > 5) {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "You can upload a maximum of 5 images",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
        return;
      }

      const newPreviews: string[] = [];

      newImages.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newPreviews.push(event.target.result as string);

            // Update state only after all images are processed
            if (newPreviews.length === newImages.length) {
              setImages((prev) => [...prev, ...newImages]);
              setImagePreviews((prev) => [...prev, ...newPreviews]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle video selection - Updated version
  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newVideos = Array.from(e.target.files);
      if (existingVideos.length + videos.length + newVideos.length > 2) {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "You can upload a maximum of 2 videos",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
        return;
      }

      const newPreviews: string[] = [];

      newVideos.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newPreviews.push(event.target.result as string);

            // Update state only after all videos are processed
            if (newPreviews.length === newVideos.length) {
              setVideos((prev) => [...prev, ...newVideos]);
              setVideoPreviews((prev) => [...prev, ...newPreviews]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove existing image
  const removeExistingImage = (id: number, index: number) => {
    setImagesToDelete([...imagesToDelete, id]);

    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  // Remove new image
  const removeNewImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    // Adjust index for previews (existing images come first)
    const previewIndex = existingImages.length + index;
    const newPreviews = [...imagePreviews];
    newPreviews.splice(previewIndex, 1);
    setImagePreviews(newPreviews);
  };

  // Remove existing video
  const removeExistingVideo = (id: number, index: number) => {
    setVideosToDelete([...videosToDelete, id]);

    const newExistingVideos = [...existingVideos];
    newExistingVideos.splice(index, 1);
    setExistingVideos(newExistingVideos);

    const newPreviews = [...videoPreviews];
    newPreviews.splice(index, 1);
    setVideoPreviews(newPreviews);
  };

  // Remove new video
  const removeNewVideo = (index: number) => {
    const newVideos = [...videos];
    newVideos.splice(index, 1);
    setVideos(newVideos);

    // Adjust index for previews (existing videos come first)
    const previewIndex = existingVideos.length + index;
    const newPreviews = [...videoPreviews];
    newPreviews.splice(previewIndex, 1);
    setVideoPreviews(newPreviews);
  };

  // Add specification
  const addSpecification = () => {
    if (specKey && specValue) {
      setSpecifications((prev) => ({
        ...prev,
        [specKey]: specValue,
      }));
      setSpecKey("");
      setSpecValue("");
    }
  };

  // Remove specification
  const removeSpecification = (key: string) => {
    const newSpecs = { ...specifications };
    delete newSpecs[key];
    setSpecifications(newSpecs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      // Append all required fields
      formData.append("name", name);
      formData.append("model_code", modelCode);
      formData.append("stock", stock.toString());
      formData.append("price", price.toString());
      formData.append("discount", discount.toString());
      formData.append("short_description", shortDescription);
      formData.append("description", description);
      formData.append("category_id", categoryId?.toString() || "");
      formData.append("brand_id", brandId?.toString() || "");
      formData.append("is_featured", isFeatured ? "1" : "0");
      formData.append("is_active", isActive ? "1" : "0");
      formData.append("low_stock_threshold", lowStockThreshold.toString());
      formData.append("_method", "PUT");

      // Append optional fields if they exist
      if (costPrice) formData.append("cost_price", costPrice.toString());
      if (warrantyMonths)
        formData.append("warranty_months", warrantyMonths.toString());

      // Append specifications as JSON string
      formData.append("specifications", JSON.stringify(specifications));

      // Add images and videos to delete
      imagesToDelete.forEach((id) =>
        formData.append("images_to_delete[]", id.toString())
      );
      videosToDelete.forEach((id) =>
        formData.append("videos_to_delete[]", id.toString())
      );

      // Add new images and videos
      images.forEach((image) => formData.append("images[]", image));
      videos.forEach((video) => formData.append("videos[]", video));

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/products/${slug}`, {
        method: "POST", // Using POST with _method=PUT for file uploads
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const responseText = await res.text();

      try {
        const data = JSON.parse(responseText);

        if (!res.ok) {
          let message = "Failed to update product";
          if (data?.errors) {
            message = Object.entries(data.errors)
              .map(
                ([field, errors]) =>
                  `${field}: ${(errors as string[]).join(", ")}`
              )
              .join("\n");
          } else if (data?.message) {
            message = data.message;
          }
          throw new Error(message);
        }

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Product updated successfully!",
          showConfirmButton: false,
          timer: 3000,
          toast: true,
        });

        onSuccess();
      } catch (err) {
        console.error("Failed to parse JSON:", responseText);
        throw new Error(responseText || "Failed to update product");
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: err.message || "Failed to update product",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-black border-gray-200 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-1 lg:py-1 py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="bg-gray-100 cursor-pointer border border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow px-2 py-2 transition flex-shrink-0"
        >
          <IoIosArrowBack className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">
            {t.createProduct.editProduct}
          </h1>
          <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
            {t.createProduct.editExistingProduct}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              router.push(`/${currentLocale}/dashboard/products/view/product`)
            }
            className="bg-gray-100 flex items-center border border-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg shadow px-4 py-2 text-sm sm:text-base transition"
          >
            <MdOutlineViewInAr className="mr-2 w-5 h-5" />
            {t.createProduct.viewProducts}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information form card*/}
        <div className="bg-white dark:bg-gray-700 shadow rounded-lg p-6 mt-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold  dark:text-white">
              {t.createProduct.basicInformation}
            </h2>
            <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
              {t.createProduct.enterBasicInformation}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="text-red-500">*</span>{" "}
                {t.createProduct.productName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Digital Multimeter"
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                required
              />
            </div>

            {/* Model Code */}
            <div>
              <label
                htmlFor="modelCode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="text-red-500">*</span>{" "}
                {t.createProduct.modelCode}
              </label>
              <input
                type="text"
                value={modelCode}
                onChange={(e) => setModelCode(e.target.value)}
                placeholder="e.g. DM-001"
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                required
              />
            </div>

            {/* Category Selection */}
            <div className="relative">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="text-red-500">*</span>{" "}
                {t.createProduct.categories}
              </label>
              <div className="relative">
                <select
                  value={categoryId || ""}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-600 appearance-none"
                  required
                >
                  <option value="">{t.createProduct.selectCategory}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {/* Custom arrow icon */}
                <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
              </div>
            </div>

            {/* Brand Selection */}
            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="text-red-500">*</span> {t.createProduct.brand}
              </label>
              <div className="relative">
                <select
                  value={brandId || ""}
                  onChange={(e) => setBrandId(Number(e.target.value))}
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-600 appearance-none"
                  required
                >
                  <option value="">{t.createProduct.selectBrand}</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>

                {/* Custom arrow icon */}
                <IoIosArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
              </div>
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="text-red-500">*</span> {t.createProduct.price}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="e.g. 1000"
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                required
              />
            </div>

            {/* Discount */}
            <div>
              <label
                htmlFor="discount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.createProduct.discount} (%) {/* or "Discount" */}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="e.g. 10"
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>

            {/* Cost Price */}
            <div>
              <label
                htmlFor="costPrice"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.createProduct.costPrice}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice || ""}
                onChange={(e) =>
                  setCostPrice(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="e.g. 1000"
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>

            {/* Warranty */}
            <div>
              <label
                htmlFor="warrantyMonths"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.createProduct.warranty}
              </label>
              <input
                type="number"
                min="0"
                value={warrantyMonths || ""}
                onChange={(e) =>
                  setWarrantyMonths(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="e.g. 12"
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>

            {/* Featured & Active */}
            <div className="flex items-center gap-6">
              {/* Featured Product Toggle */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="isFeatured"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  {t.createProduct.featuredProduct}
                </label>
                <button
                  type="button"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                    isFeatured
                      ? "bg-indigo-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
                      isFeatured ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="isActive"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  {t.createProduct.active}
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                    isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Management form */}
        <div className="bg-white dark:bg-gray-700 shadow rounded-lg p-6 mt-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold dark:text-white">
              {t.createProduct.inventoryManagement}
            </h2>
            <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
              {t.createProduct.manageInventory}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stock Quantity */}
            <div>
              <label
                htmlFor="stock"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="text-red-500">*</span>{" "}
                {t.createProduct.stockQuantity}
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                required
              />
            </div>

            {/* Low Stock Threshold */}
            <div>
              <label
                htmlFor="lowStockThreshold"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.createProduct.lowStockThreshold}
              </label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="Default: 10"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.createProduct.markLowStock}
              </p>
            </div>

            {/* Stock Status Preview */}
            <div className="md:col-span-2">
              <label
                htmlFor="stockStatus"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.createProduct.stockStatus}
              </label>
              <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                {stock <= 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {t.createProduct.outOfStock}
                  </span>
                ) : stock <= (lowStockThreshold || 10) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {t.createProduct.lowStock}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {t.createProduct.inStock}
                  </span>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stock <= 0
                    ? t.createProduct.markOutOfStock
                    : stock <= (lowStockThreshold || 10)
                    ? `${t.createProduct.markLowOfStock}: ${stock} ${t.createProduct.remaining}`
                    : `${t.createProduct.markInStock}: ${stock} ${t.createProduct.available}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description form */}
        <div className="bg-white dark:bg-gray-700 shadow rounded-lg p-6 mt-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold dark:text-white">
              {t.createProduct.productDescription}
            </h2>
            <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
              {t.createProduct.provideProductDescription}
            </p>
          </div>

          {/* Short Description */}
          <div className="mb-4">
            <label
              htmlFor="shortDescription"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              <span className="text-red-500">*</span>{" "}
              {t.createProduct.shortDescription}
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={3}
              className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              placeholder="Enter short product description..."
              required
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              <span className="text-red-500">*</span>{" "}
              {t.createProduct.detailedDescription}
            </label>
            <RichTextEditor
              content={description}
              onChange={(content) => setDescription(content)}
              placeholder="Enter detailed product description..."
            />
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white dark:bg-gray-700 shadow rounded-lg p-6 mt-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold dark:text-white">
              {t.createProduct.specifications}
            </h2>
            <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
              {t.createProduct.addSpecifications}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="specKey"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t.createProduct.key}
                </label>
                <input
                  type="text"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="e.g. Color, Size, Material, etc."
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
              </div>

              <div>
                <label
                  htmlFor="specValue"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t.createProduct.value}
                </label>
                <input
                  type="text"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  placeholder="e.g. Red, Blue, etc."
                  className="w-full text-sm sm:text-base border shadow focus:border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addSpecification}
                  className="w-full sm:w-auto bg-black flex items-center justify-center shadow text-white dark:bg-gray-200 dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <MdAdd className="mr-2" />
                  {t.createProduct.addSpecification}
                </button>
              </div>
            </div>

            {/* Specifications list */}
            {Object.keys(specifications).length > 0 && (
              <div className="border rounded-md divide-y dark:divide-gray-700 dark:border-gray-700">
                {Object.entries(specifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center p-3"
                  >
                    <div>
                      <span className="font-medium dark:text-white">
                        {key}:
                      </span>{" "}
                      <span className="text-gray-600 dark:text-gray-300">
                        {value}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSpecification(key)}
                      className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                    >
                      {t.createProduct.remove}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Image Upload form */}
        <div className="bg-white dark:bg-gray-700 shadow rounded-lg p-6 mt-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold dark:text-white">
              {t.createProduct.productMedia}
            </h2>
            <p className="text-muted-foreground text-gray-500 dark:text-gray-300 text-sm sm:text-base">
              {t.createProduct.uploadProductImages}
            </p>
          </div>

          {/* Product Images */}
          <div className="mb-6">
            <label
              htmlFor="images"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t.createProduct.productMaxImages}
            </label>

            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-1 py-1 rounded-md border border-gray-300 dark:border-gray-600">
                <span className="flex text-sm items-center text-gray-600 dark:text-gray-300">
                  {" "}
                  <BiSolidImageAdd className="mr-2" />{" "}
                  {t.createProduct.addImage}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                {existingImages.length + images.length} / 5{" "}
                {t.createProduct.imageSelected}
              </span>
            </div>

            {/* Image Previews */}
            {(existingImages.length > 0 || imagePreviews.length > 0) && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {/* Existing images */}
                {existingImages.map((image, index) => (
                  <div key={`existing-${image.id}`} className="relative group">
                    <img
                      src={imagePreviews[index]} // Use the preview URL from imagePreviews array
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id, index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                    {image.is_primary && (
                      <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {t.createProduct.primary}
                      </span>
                    )}
                  </div>
                ))}

                {/* New images */}
                {images.map((_, index) => {
                  const previewIndex = existingImages.length + index;
                  return (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={imagePreviews[previewIndex]}
                        alt={`New preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Videos */}
          <div>
            <label
              htmlFor="video"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t.createProduct.productMaxVideos}
            </label>

            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-1 py-1 rounded-md border border-gray-300 dark:border-gray-600">
                <span className="flex text-sm items-center text-gray-600 dark:text-gray-300">
                  <FaFileUpload className="mr-2" />{" "}
                  {t.createProduct.uploadVideo}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                {existingVideos.length + videos.length} / 2{" "}
                {t.createProduct.videoSelected}
              </span>
            </div>

            {/* Video Previews */}
            {(existingVideos.length > 0 || videoPreviews.length > 0) && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Existing videos */}
                {existingVideos.map((video, index) => (
                  <div key={`existing-${video.id}`} className="relative group">
                    <video
                      src={videoPreviews[index]}
                      controls
                      className="w-full h-40 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingVideo(video.id, index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* New videos */}
                {videos.map((_, index) => {
                  const previewIndex = existingVideos.length + index;
                  return (
                    <div key={`new-${index}`} className="relative group">
                      <video
                        src={videoPreviews[previewIndex]}
                        controls
                        className="w-full h-40 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewVideo(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-black flex items-center justify-center shadow text-white dark:bg-gray-200 dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <GrUpdate className="w-4 h-4 mr-2" />
            {loading ? t.createProduct.updating : t.createProduct.updateProduct}
          </button>
        </div>
      </form>
    </div>
  );
}
