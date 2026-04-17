"use client";

import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** @deprecated Prefer `import { createClient } from '@/utils/supabase/client'` — kept for existing call sites. */
export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createClient();
}
