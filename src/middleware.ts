import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const PUBLIC_PREFIXES = ["/login", "/auth"];

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const nextParam = request.nextUrl.searchParams.get("next") || "/";
    try {
      const target = new URL(nextParam, request.nextUrl.origin);
      if (target.origin === request.nextUrl.origin) {
        return NextResponse.redirect(target);
      }
    } catch {
      /* ignore */
    }
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
