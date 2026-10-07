import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Privileged Supabase Admin Client using Service Role Key
// STRICTLY SERVER-SIDE ONLY. NEVER EXPOSED TO CLIENT.
let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
      logger.warn('Supabase URL or Service Role Key missing in backend environment');
    }
    supabaseAdminInstance = createClient(
      env.supabaseUrl || 'https://placeholder.supabase.co',
      env.supabaseServiceRoleKey || 'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return supabaseAdminInstance;
}

// Client for public / non-privileged verification
export function getSupabaseAnon(): SupabaseClient {
  return createClient(
    env.supabaseUrl || 'https://placeholder.supabase.co',
    env.supabaseAnonKey || 'placeholder-anon-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
