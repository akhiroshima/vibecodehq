"use client";

import { useMemo, useState, useTransition } from "react";
import {
  deleteUser,
  inviteUser,
  updateUserField,
  type AdminUser,
} from "@/app/(platform)/admin/users/actions";
import type { Role, Studio } from "@/lib/mock-data";

const JOB_LEVELS = [
  "Analyst",
  "Consultant",
  "Senior Consultant",
  "Manager",
  "Senior Manager",
  "Director",
  "Partner",
] as const;

const ROLES: Role[] = ["designer", "prime_mover"];

type Props = {
  users: AdminUser[];
  currentUserId: string;
  studios: Studio[];
};

export function UsersAdminTable({ users, currentUserId, studios }: Props) {
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const [flash, setFlash] = useState<{
    kind: "ok" | "err";
    message: string;
  } | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("designer");
  const [inviteStudio, setInviteStudio] = useState(studios[0]?.id ?? "");
  const [inviteLevel, setInviteLevel] = useState<string>("Consultant");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.username, u.displayName, u.jobLevel, u.studioId]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q)),
    );
  }, [users, query]);

  const runUpdate = (userId: string, patch: Parameters<typeof updateUserField>[1]) => {
    setFlash(null);
    start(async () => {
      const r = await updateUserField(userId, patch);
      setFlash(r.ok ? { kind: "ok", message: "Saved." } : { kind: "err", message: r.message });
    });
  };

  const runDelete = (userId: string, label: string) => {
    if (!window.confirm(`Delete ${label}? This removes the auth user and their profile.`)) return;
    setFlash(null);
    start(async () => {
      const r = await deleteUser(userId);
      setFlash(r.ok ? { kind: "ok", message: "User deleted." } : { kind: "err", message: r.message });
    });
  };

  const runInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setFlash(null);
    start(async () => {
      const r = await inviteUser({
        email: inviteEmail,
        role: inviteRole,
        studioId: inviteStudio,
        jobLevel: inviteLevel,
      });
      if (r.ok) {
        setInviteEmail("");
        setFlash({
          kind: "ok",
          message: "Invited. They can sign in at /login with email OTP to finish onboarding.",
        });
      } else {
        setFlash({ kind: "err", message: r.message });
      }
    });
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Users</h1>
        <p className="text-sm text-neutral-500">
          Invite new members, adjust their role / studio / level, or remove them entirely. Changes take
          effect on their next page load.
        </p>
      </header>

      <form
        onSubmit={runInvite}
        className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-5"
      >
        <h2 className="text-sm font-semibold text-neutral-200">Invite a member</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Creates an auth user and a pending profile row. They sign in at /login with email OTP and
          complete onboarding (username + password).
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <input
            type="email"
            required
            placeholder="name@deloitte.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="h-9 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-neutral-100"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            className="h-9 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-neutral-100"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r === "prime_mover" ? "Admin (prime_mover)" : "Designer"}
              </option>
            ))}
          </select>
          <select
            value={inviteStudio}
            onChange={(e) => setInviteStudio(e.target.value)}
            className="h-9 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-neutral-100"
          >
            {studios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.city}
              </option>
            ))}
          </select>
          <select
            value={inviteLevel}
            onChange={(e) => setInviteLevel(e.target.value)}
            className="h-9 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-neutral-100"
          >
            {JOB_LEVELS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Working…" : "Invite"}
          </button>
        </div>
      </form>

      {flash ? (
        <p
          role="status"
          className={
            flash.kind === "ok" ? "text-sm text-emerald-400" : "text-sm text-red-400"
          }
        >
          {flash.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, username, name…"
          className="h-9 w-full max-w-sm rounded-md border border-white/15 bg-black/40 px-3 text-sm text-neutral-100"
        />
        <span className="text-xs text-neutral-500">{filtered.length} users</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-neutral-950/60">
        <table className="min-w-full text-sm">
          <thead className="bg-black/30 text-left text-[11px] uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Studio</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {filtered.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 align-top">
                    <div className="text-neutral-100">{u.displayName || u.username || "—"}</div>
                    <div className="text-xs text-neutral-500">{u.email}</div>
                    {u.username ? (
                      <div className="text-xs text-neutral-600">@{u.username}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={u.role}
                      disabled={pending || (isSelf && u.role === "prime_mover")}
                      onChange={(e) => runUpdate(u.id, { role: e.target.value as Role })}
                      className="h-8 rounded-md border border-white/15 bg-black/40 px-2 text-xs text-neutral-100 disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r === "prime_mover" ? "Admin" : "Designer"}
                        </option>
                      ))}
                    </select>
                    {isSelf ? (
                      <div className="mt-1 text-[10px] text-neutral-600">
                        Can’t demote yourself
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={u.studioId ?? ""}
                      disabled={pending}
                      onChange={(e) =>
                        runUpdate(u.id, { studio_id: e.target.value || null })
                      }
                      className="h-8 rounded-md border border-white/15 bg-black/40 px-2 text-xs text-neutral-100"
                    >
                      <option value="">—</option>
                      {studios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.city}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={u.jobLevel ?? ""}
                      disabled={pending}
                      onChange={(e) =>
                        runUpdate(u.id, { job_level: e.target.value || null })
                      }
                      className="h-8 rounded-md border border-white/15 bg-black/40 px-2 text-xs text-neutral-100"
                    >
                      <option value="">—</option>
                      {JOB_LEVELS.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    {u.onboardingCompleted ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                        Pending onboarding
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <button
                      type="button"
                      disabled={pending || isSelf}
                      onClick={() => runDelete(u.id, u.email ?? u.id)}
                      className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                  No users match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
