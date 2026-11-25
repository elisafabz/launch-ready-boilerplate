import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { AUTH_STORAGE_KEY } from './auth-storage-key';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.\n' +
    'See .env.example for reference.'
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: AUTH_STORAGE_KEY,
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
