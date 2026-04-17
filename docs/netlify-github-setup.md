# Netlify + GitHub continuous deployment

The app is linked to Netlify CLI locally as **`asra-vibecodehq`**. Production URL: **https://asra-vibecodehq.netlify.app**

Source repo: **https://github.com/akhiroshima/vibecodehq** (branch `main`).

## Enable deploys on every push (GitHub → Netlify)

1. Open the site in Netlify: [Project admin](https://app.netlify.com/projects/asra-vibecodehq).
2. Go to **Site configuration** → **Build & deploy** → **Continuous deployment**.
3. Under **Repository**, choose **Link repository** / **Configure** and connect **GitHub**.
4. Authorize the Netlify GitHub app if prompted, then select **`akhiroshima/vibecodehq`**.
5. Confirm build settings (read from repo root [`netlify.toml`](../netlify.toml)):
   - **Build command:** `npm run build`
   - **Plugin:** `@netlify/plugin-nextjs` (Next.js runtime)

After linking, each push to `main` triggers a production build. Pull requests can open **Deploy Previews** if enabled in Netlify.

## Environment variables

In **Site configuration** → **Environment variables**, add any secrets needed at build/runtime, for example:

- `OPENAI_API_KEY` — optional; AI draft assistant falls back to mock output if unset.

For future Supabase work, add the same `NEXT_PUBLIC_*` and server keys as in [`supabase-integration-plan.md`](./supabase-integration-plan.md).

## Manual CLI deploy (optional)

From the project directory (with Netlify linked):

```bash
netlify deploy --prod
```

The local `.netlify` folder is gitignored; linking is per-developer machine.

## Hosting roadmap: Netlify now, Vercel later

**Decision:** Use **Netlify** for the current phase (including Deloitte user testing on the free tier, which allows commercial use). Plan a **move to Vercel** (typically **Pro** for internal/commercial use) when you want tighter Next.js integration, team features, or a single long-term production host.

The app stays **standard Next.js + `@supabase/ssr`** — no Netlify-specific runtime code is required. [`netlify.toml`](../netlify.toml) is the only Netlify-specific artifact at the repo root.

### When you migrate to Vercel

1. **Create a Vercel project** from the same GitHub repo and branch (`main`). Build command: `npm run build` (default for Next.js). You do **not** need the Netlify plugin on Vercel.
2. **Copy environment variables** from Netlify → Vercel (all `NEXT_PUBLIC_*`, server keys, `ALLOWED_EMAIL_DOMAINS`, etc.). Use Vercel **Preview** envs for PRs if you use preview deployments.
3. **Supabase Auth → URL configuration:** set **Site URL** to the new production URL (`https://<project>.vercel.app` or your custom domain). Add **Redirect URLs** for `/auth/callback` on production **and** every preview host pattern you use (or a conservative wildcard strategy per Supabase docs).
4. **Custom domain:** Point DNS from Netlify to Vercel when ready, or assign the domain in Vercel and update Supabase redirect URLs to match.
5. **Cutover:** After smoke-testing login, session refresh, and admin routes on Vercel, pause or delete the Netlify site (or keep Netlify as a dormant backup with env vars removed).
6. **Optional repo cleanup:** Remove [`netlify.toml`](../netlify.toml) and the Netlify plugin from `package.json` once you are fully off Netlify, or keep the file for a possible future rollback (Vercel ignores it).

### Netlify-specific notes to keep until migration

- **Deploy Previews:** Add each preview URL pattern to Supabase redirect allowlist, or use a documented wildcard approach.
- **Auth + cookies:** Avoid caching auth responses; follow Supabase’s Next.js SSR guide (`force-dynamic` where needed, correct cookie handling in middleware). If you see intermittent PKCE issues on previews, compare with [Netlify community threads](https://answers.netlify.com/) and Supabase troubleshooting docs — same mitigations largely apply on Vercel after migration.
