import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** @deprecated Prefer `import { createClient } from '@/utils/supabase/server'` — kept for existing call sites. */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL and PUBLISHABLE_KEY or ANON_KEY).",
    );
  }
  const cookieStore = await cookies();
  return createClient(cookieStore);
}
