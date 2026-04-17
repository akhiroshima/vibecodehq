/**
 * Publishable (anon) key — prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase dashboard naming).
 * Falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` for older env files.
 */
export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabasePublishableKey();
  return Boolean(url && key && url.length > 0 && key.length > 0);
}
