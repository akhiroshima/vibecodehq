"use client";

import { useMemo, useState } from "react";
import { categoryRecords as seedCategories, type ContentCategory } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "category"
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ContentCategory[]>(() => [...seedCategories]);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const editDraft = useMemo(() => {
    if (!editingId) return null;
    return categories.find((c) => c.id === editingId) ?? null;
  }, [categories, editingId]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const id = `cat_${Date.now()}`;
    const slug = slugify(name);
    setCategories((prev) => [
      ...prev,
      {
        id,
        name,
        slug,
        description: newDescription.trim() || undefined,
      },
    ]);
    setNewName("");
    setNewDescription("");
  };

  const saveEdit = () => {
    if (!editingId || !editDraft) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingId
          ? {
              ...c,
              name: editDraft.name.trim() || c.name,
              slug: slugify(editDraft.name.trim() || c.name),
              description: editDraft.description?.trim() || undefined,
            }
          : c,
      ),
    );
    setEditingId(null);
  };

  const remove = (id: string) => {
    if (!confirm("Remove this category from the session list?")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Manage categories</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Session-only create / edit / delete (mock — persist with backend later).
        </p>
      </header>

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
        <Button type="submit">Add category (session)</Button>
      </form>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const isEditing = editingId === category.id;
          const draft =
            isEditing && editDraft && editDraft.id === category.id ? editDraft : category;

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
                      value={draft.name}
                      onChange={(e) =>
                        setCategories((prev) =>
                          prev.map((c) =>
                            c.id === category.id ? { ...c, name: e.target.value } : c,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    />
                  </label>
                  <p className="text-xs text-neutral-500">
                    Slug:{" "}
                    <span className="font-mono text-neutral-400">{slugify(draft.name)}</span>
                  </p>
                  <label className="block text-sm text-neutral-300">
                    Description
                    <textarea
                      value={draft.description ?? ""}
                      onChange={(e) =>
                        setCategories((prev) =>
                          prev.map((c) =>
                            c.id === category.id ? { ...c, description: e.target.value } : c,
                          ),
                        )
                      }
                      className="mt-1 min-h-16 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={saveEdit}>
                      Save
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
                  <button
                    type="button"
                    className="text-left text-sm font-medium text-neutral-100 hover:text-primary"
                    onClick={() => setEditingId(category.id)}
                  >
                    {category.name}
                  </button>
                  <p className="mt-1 font-mono text-xs text-neutral-500">{category.slug}</p>
                  {category.description ? (
                    <p className="mt-2 text-xs text-neutral-400">{category.description}</p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(category.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
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
    </section>
  );
}
