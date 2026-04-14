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
