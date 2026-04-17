"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ContentCategory } from "@/lib/mock-data";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/(platform)/admin/categories/actions";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "category"
  );
}

export function CategoriesAdminTable({ initial }: { initial: ContentCategory[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const startEdit = (c: ContentCategory) => {
    setEditingId(c.id);
    setDraftName(c.name);
    setDraftDescription(c.description ?? "");
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await createCategory({
        name: newName,
        description: newDescription,
      });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setNewName("");
      setNewDescription("");
      router.refresh();
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setError(null);
    startTransition(async () => {
      const r = await updateCategory(editingId, {
        name: draftName,
        description: draftDescription,
      });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!confirm("Remove this category?")) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteCategory(id);
      if (!r.ok) {
        setError(r.message);
        return;
      }
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
        <h2 className="text-lg font-medium text-neutral-100">New category</h2>
        <label className="block text-sm text-neutral-300">
          Name
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Research"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
          />
        </label>
        <p className="text-xs text-neutral-500">
          Slug: <span className="font-mono text-neutral-400">{slugify(newName || "name")}</span>
        </p>
        <label className="block text-sm text-neutral-300">
          Description (optional)
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="mt-1 min-h-20 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add category"}
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {initial.map((category) => {
          const isEditing = editingId === category.id;
          return (
            <div
              key={category.id}
              className="rounded-xl border border-white/10 bg-black/35 p-4"
            >
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
                  <p className="text-xs text-neutral-500">
                    Slug:{" "}
                    <span className="font-mono text-neutral-400">{slugify(draftName)}</span>
                  </p>
                  <label className="block text-sm text-neutral-300">
                    Description
                    <textarea
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      className="mt-1 min-h-16 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={saveEdit} disabled={pending}>
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
                  <p className="text-sm font-medium text-neutral-100">{category.name}</p>
                  <p className="mt-1 font-mono text-xs text-neutral-500">{category.slug}</p>
                  {category.description ? (
                    <p className="mt-2 text-xs text-neutral-400">{category.description}</p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(category)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pending}
                      onClick={() => remove(category.id)}
                    >
                      Remove
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
