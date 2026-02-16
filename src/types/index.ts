// Product types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number;
  friendly_id?: string;
  created_at: string;
  updated_at: string;
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
  friendly_id?: string;
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
  available_sizes?: string[];
  available_colors?: { name: string; hex: string }[];
  design_price_small?: number;
  design_price_medium?: number;
  design_price_large?: number;
  text_price_small?: number;
  text_price_large?: number;
  friendly_id?: string;
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
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  category?: string | null;
  stock?: number;
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
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shipping_address?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  price: number;
  custom_metadata?: any;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface OrderInsert {
  user_id: string;
  total: number;
  shipping_address?: string;
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

// Promotion types
export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: 'bogo' | 'second_unit_50' | 'percentage' | 'fixed' | 'gift' | 'loyalty_reward';
  target_type: 'all' | 'category' | 'product';
  target_id: string | null;
  value: number;
  min_quantity: number;
  min_orders_required: number;
  min_order_value_condition: number;
  reward_product_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
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
  hasHydrated: boolean;
  setSessionId: (id: string) => void;
  clearSessionId: () => void;
  setUserId: (id: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setAdmin: (isAdmin: boolean) => void;
  setHasHydrated: (val: boolean) => void;
  clearAuth: () => void;
}
