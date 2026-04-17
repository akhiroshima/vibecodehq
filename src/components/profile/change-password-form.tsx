"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/app/(platform)/profile/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function ChangePasswordForm() {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return null;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (next !== confirm) {
      setMessage("New passwords do not match.");
      return;
    }
    start(async () => {
      const r = await changePassword(current, next);
      if (r.ok) {
        setCurrent("");
        setNext("");
        setConfirm("");
        setMessage("Password updated.");
      } else {
        setMessage(r.message);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
      <h2 className="text-xl font-medium text-neutral-100">Account security</h2>
      <p className="mt-1 text-sm text-neutral-500">Change your password (requires current password).</p>
      <form onSubmit={submit} className="mt-4 max-w-md space-y-3">
        <div className="space-y-2">
          <Label htmlFor="cur-pw">Current password</Label>
          <Input
            id="cur-pw"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-pw">New password</Label>
          <Input
            id="new-pw"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conf-pw">Confirm new password</Label>
          <Input
            id="conf-pw"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {message ? (
          <p
            className={
              message === "Password updated." ? "text-sm text-emerald-400" : "text-sm text-red-400"
            }
            role="status"
          >
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
