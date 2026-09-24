export function getSupabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co").replace(/\/rest\/v1\/?$/, "");
}
