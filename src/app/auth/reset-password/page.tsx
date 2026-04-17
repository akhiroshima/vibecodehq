"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPasswordAfterRecovery } from "@/app/auth/reset-password/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ResetPasswordPage() {
  const [pending, start] = useTransition();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <AuroraBackground>
        <main className="mx-auto w-full max-w-md px-4 py-12">
          <p className="text-neutral-400">Supabase is not configured.</p>
          <Link href="/login" className="mt-4 inline-block text-primary">
            Back to login
          </Link>
        </main>
      </AuroraBackground>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    start(async () => {
      const r = await setPasswordAfterRecovery(password);
      if (!r.ok) setError(r.message);
    });
  };

  return (
    <AuroraBackground>
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <section className="rounded-2xl border border-white/15 bg-black/60 p-6 backdrop-blur">
          <h1 className="text-2xl font-semibold text-neutral-100">Set a new password</h1>
          <p className="mt-1 text-sm text-neutral-400">Use the link from your email to reach this page.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="np">New password</Label>
              <Input
                id="np"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="npc">Confirm</Label>
              <Input
                id="npc"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Update password"}
            </button>
            <Link href="/login" className="block text-center text-sm text-neutral-500 hover:text-neutral-300">
              Back to login
            </Link>
          </form>
        </section>
      </main>
    </AuroraBackground>
  );
}
