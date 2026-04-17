"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey } from "@/lib/supabase/env";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function createClient() {
  const supabaseKey = getSupabasePublishableKey();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY).",
    );
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
}
