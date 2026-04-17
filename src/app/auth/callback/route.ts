import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * PKCE / email link exchange (password recovery, optional magic links). Email OTP first login uses verifyOtp only.
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const fail = new URL("/login", request.url);
      fail.searchParams.set("error", "auth_callback");
      return NextResponse.redirect(fail);
    }
  }

  let nextPath = "/";
  try {
    const u = new URL(nextRaw, request.url);
    if (u.origin === new URL(request.url).origin) {
      nextPath = u.pathname + u.search;
    }
  } catch {
    nextPath = "/";
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
