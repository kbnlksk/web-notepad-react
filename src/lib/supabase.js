import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";

export const isSupabaseConfigured =
  supabaseUrl.startsWith("https://") &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes("여기에_") &&
  !supabaseAnonKey.includes("your-anon");

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
