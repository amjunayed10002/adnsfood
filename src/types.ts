export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  status: 'active' | 'inactive' | 'admin';
}

export interface Food {
  id: number;
  name: string;
  category: string;
  description: string;
  photo: string;
  original_price: number;
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;
  final_price: number;
  prep_time?: string;
  availability: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  name: string;
  photo: string;
  category: string;
  price: number;
  original_price: number;
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;
  quantity: number;
}

export interface OrderItemSnapshot {
  id: number;
  name: string;
  quantity: number;
  original_price: number;
  price: number;
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;
  subtotal: number;
  photo?: string;
}

export interface Order {
  id: number;
  order_id: string;
  user_id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  instructions: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_method: 'COD' | 'bKash';
  bkash_txn?: string;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: number;
  restaurant_name: string;
  logo_url?: string;
  tagline?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  bkash_number: string;
  delivery_charge: number;
  restaurant_open: boolean;
  min_order: number;
  contact_phone: string;
  contact_email: string;
  address: string;
  announcement: string;
}

export interface AdminStats {
  total_orders: number;
  pending: number;
  confirmed: number;
  preparing: number;
  delivery: number;
  delivered: number;
  cancelled: number;
  customers: number;
  foods: number;
  today_orders: number;
  today_sales: number;
  total_sales: number;
}

export interface CustomerSummary {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  status: string;
  created_at: string;
  orders_count: number;
  total_spent: number;
  orders?: Order[];
}
