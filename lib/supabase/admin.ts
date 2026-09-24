import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/config";

export function createAdminClient() {
  const url = getSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase service role belum dikonfigurasi.");
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
