import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://nnipkxasgufwjbsyzivo.supabase.co';
const supabaseAnonKey = 'sb_publishable_6QZGOxM_bofX4XRkAaWkqw_9ZbY3n-G';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);