import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (((import.meta as any).env?.VITE_SUPABASE_URL) || "").trim();
const supabaseAnonKey = (((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || "").trim();

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== "https://your-project.supabase.co" && 
  !!supabaseAnonKey && 
  supabaseAnonKey !== "your-anon-key";

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
