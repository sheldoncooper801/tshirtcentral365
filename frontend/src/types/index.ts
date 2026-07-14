export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  title: string;
  description: string | null;
  status: string;
  base_cost: number;
  retail_price: number;
  profit_margin: number;
  mockup_urls: Record<string, string> | null;
  design_file_url: string | null;
  tags: string[] | null;
  is_published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  provider_id: number;
  size: string;
  color: string;
  color_hex: string | null;
  base_cost: number;
  retail_price: number;
  in_stock: boolean;
  image_url: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  provider_status: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  printify_order_id: string | null;
  printify_status: string | null;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_address: Record<string, any>;
  notes: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  design_file_url: string | null;
  printify_blueprint_id: number | null;
  printify_variant_id: number | null;
  printify_provider_id: number | null;
  product_title: string | null;
  variant_title: string | null;
  product_image: string | null;
}

export interface PrintProvider {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  countries: string[] | null;
  product_types: string[] | null;
  fulfillment_time_days: number | null;
  is_active: boolean;
  rating: number | null;
  created_at: string;
}

export interface StoreConnection {
  id: number;
  platform: string;
  store_name: string;
  store_url: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
}
