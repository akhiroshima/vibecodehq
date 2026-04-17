"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendEmailOtp,
  verifyEmailOtp,
  signInWithUsernamePassword,
  requestPasswordReset,
  type ActionResult,
} from "@/app/login/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Tab = "first" | "returning" | "forgot";

function ErrorText({ r }: { r: ActionResult | null }) {
  if (!r || r.ok) return null;
  return (
    <p className="text-sm text-red-400" role="alert">
      {r.message}
    </p>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [tab, setTab] = useState<Tab>("first");
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <AuroraBackground>
        <main className="mx-auto w-full max-w-md px-4 py-12">
          <section className="rounded-2xl border border-white/15 bg-black/60 p-6 backdrop-blur">
            <h1 className="text-2xl font-semibold text-neutral-100">Sign in to Asra</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Set <code className="text-neutral-300">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-neutral-300">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (or{" "}
              <code className="text-neutral-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) to enable auth.
              Without them, the app uses mock data for the signed-in UI.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Continue with mock session
            </Link>
          </section>
        </main>
      </AuroraBackground>
    );
  }

  const submitOtpRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    start(async () => {
      const r = await sendEmailOtp(email);
      setResult(r);
      if (r.ok) setSent(true);
    });
  };

  const submitOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    start(async () => {
      const r = await verifyEmailOtp(email, code);
      if (!r.ok) setResult(r);
    });
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    start(async () => {
      const r = await signInWithUsernamePassword(username, password);
      if (!r.ok) setResult(r);
    });
  };

  const submitForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    start(async () => {
      const r = await requestPasswordReset(forgotEmail);
      setResult(r);
    });
  };

  return (
    <AuroraBackground>
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <section className="rounded-2xl border border-white/15 bg-black/60 p-6 backdrop-blur">
          <h1 className="text-2xl font-semibold text-neutral-100">Sign in to Asra</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Deloitte email first access, or username and password if you already set up your account.
          </p>

          {err === "auth_callback" ? (
            <p className="mt-3 text-sm text-amber-400" role="alert">
              Sign-in link expired or was invalid. Try again.
            </p>
          ) : null}

          <div className="mt-4 flex gap-2 border-b border-white/10 pb-2 text-sm">
            <button
              type="button"
              className={tab === "first" ? "font-semibold text-primary" : "text-neutral-500"}
              onClick={() => {
                setTab("first");
                setResult(null);
              }}
            >
              First access
            </button>
            <button
              type="button"
              className={tab === "returning" ? "font-semibold text-primary" : "text-neutral-500"}
              onClick={() => {
                setTab("returning");
                setResult(null);
              }}
            >
              Returning
            </button>
            <button
              type="button"
              className={tab === "forgot" ? "font-semibold text-primary" : "text-neutral-500"}
              onClick={() => {
                setTab("forgot");
                setResult(null);
              }}
            >
              Forgot password
            </button>
          </div>

          {tab === "first" ? (
            <div className="mt-5 space-y-4">
              {!sent ? (
                <form onSubmit={submitOtpRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Deloitte work email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@deloitte.com"
                      required
                    />
                  </div>
                  <ErrorText r={result} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {pending ? "Sending…" : "Send verification code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={submitOtpVerify} className="space-y-4">
                  <p className="text-sm text-neutral-400">
                    Enter the code from your email (configure the template in Supabase to send an
                    OTP).
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="code">6-digit code</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="000000"
                      required
                    />
                  </div>
                  <ErrorText r={result} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {pending ? "Verifying…" : "Verify and continue"}
                  </button>
                  <button
                    type="button"
                    className="w-full text-xs text-neutral-500 underline"
                    onClick={() => {
                      setSent(false);
                      setCode("");
                      setResult(null);
                    }}
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          ) : null}

          {tab === "returning" ? (
            <form onSubmit={submitPassword} className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <ErrorText r={result} />
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {pending ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : null}

          {tab === "forgot" ? (
            <form onSubmit={submitForgot} className="mt-5 space-y-4">
              <p className="text-sm text-neutral-500">
                We’ll email a reset link to your Deloitte address. Set{" "}
                <code className="text-neutral-400">NEXT_PUBLIC_SITE_URL</code> in production so the
                link points to this site.
              </p>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <ErrorText r={result} />
              {result?.ok ? (
                <p className="text-sm text-emerald-400">If that account exists, you will receive an email shortly.</p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          ) : null}
        </section>
      </main>
    </AuroraBackground>
  );
}
