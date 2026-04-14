import Link from "next/link";

export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950/70 p-8 text-center">
        <h1 className="text-2xl font-semibold text-neutral-100">Magic link verified (mock)</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Backend auth wiring is deferred. Continue to preview the full UI.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Enter Asra
        </Link>
      </section>
    </main>
  );
}
