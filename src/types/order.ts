export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  subtotal: string;
  tax_amount: string;
  shipping_cost: string;
  discount_amount: string;
  total: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | string; // adjust as needed
  shipping_address_id: number | null;
  billing_address_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  items: OrderItem[];
  user: OrderUser;
  payments: Payment[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_model: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  options: any[]; // if you have a structure for options, replace 'any'
  created_at: string;
  updated_at: string;
}

export interface OrderUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  provider: string | null;
  provider_id: string | null;
  role_id: number;
  avatar: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  two_factor_recovery_codes: string | null;
  is_active: boolean;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method: "stripe" | "khqr" | string; // extend if you have more methods
  amount: string;
  transaction_id: string;
  status: "pending" | "completed" | "failed" | string; // adjust as needed
  notes: string | null;
  paid_at: string;
  created_at: string;
  updated_at: string;
}
