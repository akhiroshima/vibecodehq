# Supabase integration and auth flows

This document is a phased plan to replace mock user data and the mock magic-link UI with Supabase (Postgres, Auth, optional Realtime) and align with Next.js App Router patterns.

**Implemented flows** (OTP first access, onboarding, username/password, reset, change password) are summarized in [`auth-deloitte-flow.md`](./auth-deloitte-flow.md).

## Current state (baseline)

- **User / roles**: `currentUser` and catalog data live in `[src/lib/mock-data.ts](../src/lib/mock-data.ts)`. Admin nav is gated by `role === "prime_mover"` in `[src/components/app-shell.tsx](../src/components/app-shell.tsx)`.
- **Login**: `[src/app/login/page.tsx](../src/app/login/page.tsx)` is a static form; “Send magic link” links straight to `[src/app/auth/callback/page.tsx](../src/app/auth/callback/page.tsx)` with no server exchange.
- **No session**: No cookies, no middleware protection of `/admin` or `/profile`.

## Phase 1 — Project and environment

1. Create a Supabase project (production + optional staging).
2. In the repo, add dependencies: `@supabase/supabase-js`, `@supabase/ssr` (recommended for Next.js App Router cookie handling).
3. Env vars (local + Netlify):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - Server-only: `SUPABASE_SERVICE_ROLE_KEY` (only for migrations/admin scripts, never in client).
4. Supabase client helpers live under [`src/utils/supabase/`](../src/utils/supabase/) (`server.ts`, `client.ts`, `middleware.ts`) per the official SSR pattern; [`src/lib/supabase/server.ts`](../src/lib/supabase/server.ts) re-exports for existing imports.

## Phase 2 — Auth flows (replace mock magic link)

**Deloitte / first access: email OTP (6-digit code), not a click-through magic link** — reduces breakage from corporate email link scanners. Flow: `signInWithOtp` (send) → user enters code → `verifyOtp({ email, token, type: 'email' })` on the server with `@supabase/ssr` cookies. Configure Supabase Auth email templates so users receive a **code** (see Supabase “Email OTP” docs). **Callback route** (`/auth/callback`) remains for **password recovery** and optional **OAuth** later (PKCE `code` exchange); first-time login does not depend on that redirect.

1. **Login page** (`/login`):
  - Server Action: validate `ALLOWED_EMAIL_DOMAINS`, then `signInWithOtp` for email OTP.
  - Second step: UI for **6-digit code** → Server Action `verifyOtp` → session cookies.
2. **Callback** (`/auth/callback`):
  - Route Handler `src/app/auth/callback/route.ts` exchanges `code` for session (PKCE) for **reset-password links** (and OAuth if added). Register production + preview URLs in Supabase Redirect URLs.
3. **Sign out**:
  - Server Action or Route Handler: `supabase.auth.signOut()` + redirect.
4. **Session refresh**:
  - Middleware (`src/middleware.ts`) with `createServerClient` + cookie `getAll` / `setAll` per Supabase Next.js SSR docs. Avoid caching responses that set auth cookies (`force-dynamic` / `no-store` where needed; on Netlify see cookie/cache guidance).

**Deployment risks (summary):** wrong redirect URL per environment, CDN caching auth responses, shared server client singleton — see the Deloitte auth onboarding plan in Cursor for the full risk table and mitigations.

## Phase 3 — Map identity to app roles (prime_mover vs designer)

1. **Schema** (Supabase SQL migration):
  - `profiles` table: `id uuid primary key references auth.users(id)`, `display_name`, `avatar_url`, `studio_id` (nullable FK), `role text check (role in ('designer','prime_mover')) default 'designer'`.
  - **Profile row creation:** prefer a **Supabase Auth Hook** (after sign-up) calling a server endpoint with the **service role** to insert `profiles` idempotently. A DB trigger on `auth.users` is possible but easier to get wrong (permissions/timing); align with the Deloitte auth onboarding plan.
2. **RLS**: Enable RLS on `profiles`; policies so users read/update own row; admins (service role or custom claim) manage others if needed.
3. **App wiring**:
  - Replace imports of `currentUser` with a server helper `getCurrentUser()` that reads `auth.getUser()` + joins `profiles` for `role`, `studio_id`, names.
  - Gate `/admin` routes in middleware: `profile.role === 'prime_mover'` or use a dedicated `admin` layout that checks server-side and returns 403/redirect.

## Phase 4 — Data migration (optional, parallel to mock)

1. **Studios**: Table `studios` matching `[studioRecords](../src/lib/mock-data.ts)` shape; seed seven rows.
2. **Catalog** (later): `tools`, `skills`, `categories`, `announcements` — migrate from mock to tables with RLS (read published for members; write for admins via service role or elevated policies).
3. Keep `mock-data.ts` behind a feature flag `NEXT_PUBLIC_USE_MOCK_CATALOG=true` until cutover.

## Phase 5 — Hosting (Netlify first, Vercel later)

**Current choice:** Deploy on **Netlify** (see [`netlify-github-setup.md`](./netlify-github-setup.md)). Supabase does **not** host the frontend; it only provides Auth, Postgres, etc.

**Later:** Migrate to **Vercel** (usually **Pro** for internal/commercial use). The app code stays the same; you swap the host, copy env vars, and update Supabase **Site URL** and **Redirect URLs** to the new domain. Step-by-step migration is in [`netlify-github-setup.md`](./netlify-github-setup.md#hosting-roadmap-netlify-now-vercel-later).

### Netlify (now)

- Set the same Supabase env vars in Netlify → Site configuration → Environment variables.
- Set **Supabase Auth → URL configuration**: Site URL = Netlify production URL; redirect URLs include `https://<site>.netlify.app/auth/callback` (and preview URLs if using Deploy Previews).
- For preview deploys, either use a separate Supabase project or add wildcard `*.netlify.app` redirect URLs (careful with security).

### After moving to Vercel

- Repeat env var setup on Vercel; point Supabase Site URL and redirect URLs to `https://<project>.vercel.app` (and preview hosts as needed).
- No Supabase schema change required for the host switch — only URLs and deployment config.

## Security checklist

- Never ship `SUPABASE_SERVICE_ROLE_KEY` to the browser or Netlify “public” env.
- Validate `role` on the server for every admin mutation (not only in UI).
- Use RLS for all tables holding user or tenant data.
- Throttle OTP send and `verifyOtp` attempts (abuse / brute force); respect Supabase rate limits.

## Suggested order of work

1. Env + Supabase clients + middleware session refresh.
2. Email OTP + password-recovery callback E2E on production URL (and preview URLs in Supabase allowlist).
3. `profiles` + role + replace `currentUser` in shell/layout.
4. Protect `/admin/`*.
5. Migrate catalog and comments from mocks to tables.