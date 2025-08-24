export interface SearchProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image?: string;
  type: "product";
}

export interface SearchOrder {
  id: number;
  order_number: string;
  status: string;
  total: number;
  customer_name: string;
  created_at: string;
  type: "order";
}

export interface SearchCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  orders_count: number;
  type: "customer";
}

export interface SearchResult {
  products: SearchProduct[];
  orders: SearchOrder[];
  customers: SearchCustomer[];
}
