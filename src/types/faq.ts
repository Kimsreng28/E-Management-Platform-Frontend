export interface FAQ {
  id: number;
  question_en: string;
  question_kh: string;
  answer_en: string;
  answer_kh: string;
  category_id: number | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: FAQCategory;
}

export interface FAQCategory {
  id: number;
  name_en: string;
  name_kh: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  faqs_count?: number;
}