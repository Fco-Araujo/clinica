import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const hasSupabaseConfig =
  env.SUPABASE_URL &&
  env.SUPABASE_ANON_KEY &&
  env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = hasSupabaseConfig
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export const supabasePublic = hasSupabaseConfig
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;