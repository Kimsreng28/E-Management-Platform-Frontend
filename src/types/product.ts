export interface Product {
  id: number;
  name: string;
  model_code: string;
  slug: string;
  stock: number;
  price: string;
  cost_price: string;
  short_description: string;
  description: string;
  category_id: number;
  brand_id: number;
  warranty_months: number;
  is_featured: boolean;
  is_active: boolean;
  specifications: Record<string, string>;
  created_by: number;
  low_stock_threshold: number;
  stock_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  discount: number;
  discount_price: number;
  is_new: boolean;
  average_rating: number;
  total_ratings: number;
  category: Category;
  brand: Brand;
  images: Image[];
  videos: Video[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  parent_id: number | null;
  order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string;
  website: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Image {
  id: number;
  product_id: number;
  path: string;
  alt_text: string | null;
  order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Video {
  id: number;
  product_id: number;
  url: string;
  thumbnail: string | null;
  title: string;
  duration: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
