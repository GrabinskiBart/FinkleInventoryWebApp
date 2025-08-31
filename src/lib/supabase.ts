import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create Supabase client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface DatabaseItem {
  id: string;
  name: string;
  description: string;
  category: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  needs_reorder: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseStockReport {
  id: string;
  user_id: string;
  user_name: string;
  item_id: string;
  item_name: string;
  reported_stock: number;
  previous_stock: number;
  report_type: 'stock_update' | 'low_stock_alert' | 'out_of_stock';
  notes?: string;
  status: 'pending' | 'reviewed' | 'applied';
  created_at: string;
  updated_at: string;
}