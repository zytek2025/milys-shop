// Product types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  category: string | null;
  stock: number;
  last_unit_cost?: number;
  additional_cost?: number;
  last_utility_percentage?: number;
  created_at: string;
  updated_at: string;
  product_variants?: ProductVariant[];
}

export interface Design {
  id: string;
  name: string;
  description?: string | null;
  image_url: string;
  price: number;
  price_small?: number;
  price_medium?: number;
  price_large?: number;
  category_id?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  has_variants?: boolean;
  is_customizable?: boolean;
  created_at?: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  model_type: string | null; // Franela, Suéter, etc.
  size: string | null;
  color: string | null;
  color_hex: string | null;
  stock: number;
  price_override: number | null;
  last_unit_cost?: number;
  additional_cost?: number;
  last_utility_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  category?: string | null;
  stock?: number;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'gift' | 'second_unit_50';
  value: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  target_type: 'all' | 'product' | 'category';
  target_id?: string;
  min_order_value_condition?: number;
  min_orders_required?: number;
  min_quantity?: number;
  reward_product_id?: string;
  image_url?: string;
  created_at?: string;
}

// Cart types
export interface Cart {
  id: string;
  session_id: string;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  on_request?: boolean;
  custom_metadata: any;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface CartWithItems extends Cart {
  items: CartItem[];
}

export interface CartItemInsert {
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
}

export interface CartItemUpdate {
  quantity: number;
}

// User/Auth types
export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'user' | 'admin';
  is_super_admin?: boolean;
  store_credit?: number;
  balance?: number;
  shipping_address?: string;
  marketing_consent?: boolean;
  whatsapp?: string;
  is_active?: boolean;
  deletion_requested_at?: string;
  permissions?: Permissions;
  created_at: string;
  updated_at: string;
}

export interface Permissions {
  can_manage_prices: boolean;
  can_view_metrics: boolean;
  can_manage_users: boolean;
  can_manage_designs: boolean;
  can_view_settings: boolean;
}

export interface StaffUser {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  permissions: Permissions;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

// Order types
export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'quote' | 'evaluating';
  shipping_address?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notion_synced?: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  price: number;
  on_request?: boolean;
  custom_metadata?: any;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface OrderInsert {
  user_id?: string | null;
  total: number;
  shipping_address?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  status?: string;
}

export interface OrderItemInsert {
  order_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  price: number;
}

// Search types
export interface SearchResult {
  products: Product[];
  query: string;
  total: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Cart state for Zustand
export interface CartState {
  sessionId: string | null;
  userId: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setSessionId: (id: string) => void;
  clearSessionId: () => void;
  setUserId: (id: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setAdmin: (isAdmin: boolean) => void;
  clearAuth: () => void;
  _hasHydrated?: boolean;
  setHasHydrated?: (state: boolean) => void;
}
