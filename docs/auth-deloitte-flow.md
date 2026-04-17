# Deloitte auth flow (implementation)

This matches the Cursor plan **Deloitte auth onboarding**: email OTP for first access, onboarding (username, password, studio, job level), then username + password for returning users, plus forgot/reset and in-app password change.

## Routes

| Route | Purpose |
| ----- | ------- |
| `/login` | First access: send email OTP → verify code. Returning: username + password. Forgot password. |
| `/auth/callback` | PKCE exchange for **password recovery** (and OAuth later). Query: `code`, optional `next`. |
| `/auth/reset-password` | Set new password after recovery email (session from callback). |
| `/onboarding` | One-time profile + password (outside the main shell layout). |

## Environment

See [`.env.example`](../.env.example). Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Production: set `NEXT_PUBLIC_SITE_URL` to your Netlify or Vercel URL so reset links resolve correctly.

## Database

Apply [`supabase/migrations/20260415120000_profiles_and_studios.sql`](../supabase/migrations/20260415120000_profiles_and_studios.sql) in the Supabase SQL editor (or CLI). This creates `studios`, `profiles`, and RLS policies.

## Supabase dashboard

1. **Auth → URL configuration:** Site URL = your deployed origin. Redirect URLs must include `https://<host>/auth/callback` and preview URLs if used.
2. **Email templates:** Configure **email OTP** so first-time sign-in sends a **6-digit code** (not only a magic link), per Supabase docs.
3. **Service role:** Required server-side for username → email at password sign-in and for global username uniqueness checks. Never expose to the client.

## Optional: Auth Hook

The plan allows a Supabase **Auth Hook** to insert `profiles` on sign-up. This app instead relies on **RLS** (`insert` own row) and the **onboarding** upsert so a row is created when the member completes setup. You can add a hook later to pre-insert empty profile rows for analytics.

## Hosting

Netlify first, Vercel later — see [`netlify-github-setup.md`](./netlify-github-setup.md#hosting-roadmap-netlify-now-vercel-later).
