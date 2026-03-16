import { createClient } from '@supabase/supabase-js';
import { config } from './index';

// Admin client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Public client with anon key (respects RLS)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
