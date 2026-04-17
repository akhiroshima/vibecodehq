"use client";

import { useState, useTransition } from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/app/onboarding/actions";
import type { Studio } from "@/lib/mock-data";

const JOB_LEVELS = [
  "Analyst",
  "Consultant",
  "Senior Consultant",
  "Manager",
  "Senior Manager",
  "Director",
  "Partner",
] as const;

export function OnboardingForm({ studios }: { studios: Studio[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [studioId, setStudioId] = useState(studios[0]?.id ?? "");
  const [jobLevel, setJobLevel] = useState<string>(JOB_LEVELS[2] ?? "Consultant");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await completeOnboarding({
        username,
        password,
        displayName,
        studioId,
        jobLevel,
      });
      if (!r.ok) setError(r.message);
    });
  };

  return (
    <AuroraBackground>
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <section className="rounded-2xl border border-white/15 bg-black/60 p-6 backdrop-blur">
          <h1 className="text-2xl font-semibold text-neutral-100">Finish setup</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Choose a username and password, then your studio and level.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                placeholder="Aditi Rao"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                autoComplete="username"
                placeholder="aditi.rao"
                required
              />
              <p className="text-xs text-neutral-500">Lowercase, 3–32 characters. Used to sign in.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studio">Studio</Label>
              <select
                id="studio"
                className="flex h-9 w-full rounded-md border border-white/15 bg-black/40 px-3 py-1 text-sm text-neutral-100"
                value={studioId}
                onChange={(e) => setStudioId(e.target.value)}
              >
                {studios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.city} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job">Job level</Label>
              <select
                id="job"
                className="flex h-9 w-full rounded-md border border-white/15 bg-black/40 px-3 py-1 text-sm text-neutral-100"
                value={jobLevel}
                onChange={(e) => setJobLevel(e.target.value)}
              >
                {JOB_LEVELS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
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
              {pending ? "Saving…" : "Continue to Asra"}
            </button>
          </form>
        </section>
      </main>
    </AuroraBackground>
  );
}
