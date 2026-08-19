import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://zkyhhoxcrjkhywblzehr.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bdi3BexAKWDBaUIh40hJ_A_8CNVdnM_";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "founder-dashboard-session",
  },
});
