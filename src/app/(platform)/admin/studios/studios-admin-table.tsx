"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Studio } from "@/lib/mock-data";
import {
  createStudio,
  deleteStudio,
  updateStudio,
} from "@/app/(platform)/admin/studios/actions";

export function StudiosAdminTable({ initial }: { initial: Studio[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftCity, setDraftCity] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await createStudio({ name: newName, city: newCity });
      if (!r.ok) return setError(r.message);
      setNewName("");
      setNewCity("");
      router.refresh();
    });
  };

  const startEdit = (s: Studio) => {
    setEditingId(s.id);
    setDraftName(s.name);
    setDraftCity(s.city);
  };

  const save = () => {
    if (!editingId) return;
    setError(null);
    startTransition(async () => {
      const r = await updateStudio(editingId, { name: draftName, city: draftCity });
      if (!r.ok) return setError(r.message);
      setEditingId(null);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!confirm("Delete this studio?")) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteStudio(id);
      if (!r.ok) return setError(r.message);
      if (editingId === id) setEditingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={add}
        className="space-y-4 rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6"
      >
        <h2 className="text-lg font-medium text-neutral-100">New studio</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-neutral-300">
            Name
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Bangalore"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
            />
          </label>
          <label className="block text-sm text-neutral-300">
            City
            <input
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="Bangalore"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
            />
          </label>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add studio"}
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {initial.map((s) => {
          const isEditing = editingId === s.id;
          return (
            <div key={s.id} className="rounded-xl border border-white/10 bg-black/35 p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <label className="block text-sm text-neutral-300">
                    Name
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block text-sm text-neutral-300">
                    City
                    <input
                      value={draftCity}
                      onChange={(e) => setDraftCity(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={save} disabled={pending}>
                      {pending ? "…" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-neutral-100">{s.name}</p>
                  <p className="mt-1 font-mono text-xs text-neutral-500">{s.id}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {s.city} · {s.designerCount} member{s.designerCount === 1 ? "" : "s"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(s)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pending}
                      onClick={() => remove(s.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
