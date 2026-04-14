# Supabase integration and auth flows

This document is a phased plan to replace mock user data and the mock magic-link UI with Supabase (Postgres, Auth, optional Realtime) and align with Next.js App Router patterns.

## Current state (baseline)

- **User / roles**: `currentUser` and catalog data live in [`src/lib/mock-data.ts`](../src/lib/mock-data.ts). Admin nav is gated by `role === "prime_mover"` in [`src/components/app-shell.tsx`](../src/components/app-shell.tsx).
- **Login**: [`src/app/login/page.tsx`](../src/app/login/page.tsx) is a static form; “Send magic link” links straight to [`src/app/auth/callback/page.tsx`](../src/app/auth/callback/page.tsx) with no server exchange.
- **No session**: No cookies, no middleware protection of `/admin` or `/profile`.

## Phase 1 — Project and environment

1. Create a Supabase project (production + optional staging).
2. In the repo, add dependencies: `@supabase/supabase-js`, `@supabase/ssr` (recommended for Next.js App Router cookie handling).
3. Env vars (local + Netlify):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Server-only: `SUPABASE_SERVICE_ROLE_KEY` (only for migrations/admin scripts, never in client).
4. Add [`src/lib/supabase/server.ts`](../src/lib/supabase/server.ts) and [`src/lib/supabase/client.ts`](../src/lib/supabase/client.ts) following Supabase’s Next.js SSR guide (createServerClient / createBrowserClient, cookie adapter for Route Handlers and Server Components).

## Phase 2 — Auth flows (replace mock magic link)

**Recommended flow: magic link (OTP) or OAuth, consistent with current UI copy.**

1. **Login page** (`/login`):
   - Call `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` } })` from a Server Action or Route Handler (avoid exposing service role; use anon key only on client if acceptable, or proxy through Server Action).
   - Show “Check your email” state; remove the fake link to callback.

2. **Callback** (`/auth/callback`):
   - Implement as a **Route Handler** `src/app/auth/callback/route.ts` that exchanges `code` for a session (PKCE) and sets cookies via `@supabase/ssr`, then redirects to `/`.
   - Alternatively keep a client page that calls `getSession()` after `detectSessionInUrl` — SSR cookie pattern is preferred for App Router.

3. **Sign out**:
   - Server Action or Route Handler: `supabase.auth.signOut()` + redirect.

4. **Session refresh**:
   - Use middleware (`src/middleware.ts`) with `createServerClient` + `getSession()` / `getUser()` to refresh tokens on protected routes (Supabase middleware pattern).

## Phase 3 — Map identity to app roles (prime_mover vs designer)

1. **Schema** (Supabase SQL migration):
   - `profiles` table: `id uuid primary key references auth.users(id)`, `display_name`, `avatar_url`, `studio_id` (nullable FK), `role text check (role in ('designer','prime_mover')) default 'designer'`.
   - Trigger: on `auth.users` insert → insert `profiles` row (default role designer).
2. **RLS**: Enable RLS on `profiles`; policies so users read/update own row; admins (service role or custom claim) manage others if needed.
3. **App wiring**:
   - Replace imports of `currentUser` with a server helper `getCurrentUser()` that reads `auth.getUser()` + joins `profiles` for `role`, `studio_id`, names.
   - Gate `/admin` routes in middleware: `profile.role === 'prime_mover'` or use a dedicated `admin` layout that checks server-side and returns 403/redirect.

## Phase 4 — Data migration (optional, parallel to mock)

1. **Studios**: Table `studios` matching [`studioRecords`](../src/lib/mock-data.ts) shape; seed seven rows.
2. **Catalog** (later): `tools`, `skills`, `categories`, `announcements` — migrate from mock to tables with RLS (read published for members; write for admins via service role or elevated policies).
3. Keep `mock-data.ts` behind a feature flag `NEXT_PUBLIC_USE_MOCK_CATALOG=true` until cutover.

## Phase 5 — Netlify-specific notes

- Set the same Supabase env vars in Netlify → Site configuration → Environment variables.
- Set **Supabase Auth → URL configuration**: Site URL = Netlify production URL; redirect URLs include `https://<site>.netlify.app/auth/callback` (and preview URLs if using Deploy Previews).
- For preview deploys, either use a separate Supabase project or add wildcard `*.netlify.app` redirect URLs (careful with security).

## Security checklist

- Never ship `SUPABASE_SERVICE_ROLE_KEY` to the browser or Netlify “public” env.
- Validate `role` on the server for every admin mutation (not only in UI).
- Use RLS for all tables holding user or tenant data.

## Suggested order of work

1. Env + Supabase clients + middleware session refresh.  
2. OAuth or magic-link E2E on production URL.  
3. `profiles` + role + replace `currentUser` in shell/layout.  
4. Protect `/admin/*`.  
5. Migrate catalog and comments from mocks to tables.
