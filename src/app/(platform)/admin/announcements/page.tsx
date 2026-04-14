"use client";

import { useMemo, useState } from "react";
import {
  announcements as seedAnnouncements,
  getPublishedSkills,
  getPublishedTools,
  type Announcement,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>(() => [...seedAnnouncements]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<Announcement["type"]>("tip");
  const [pinnedNew, setPinnedNew] = useState(false);
  const [relatedKind, setRelatedKind] = useState<"none" | "tool" | "skill">("none");
  const [relatedId, setRelatedId] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const toolOptions = useMemo(() => getPublishedTools(), []);
  const skillOptions = useMemo(() => getPublishedSkills(), []);

  const editing = editingId ? items.find((a) => a.id === editingId) : undefined;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `a_${Date.now()}`;
    const next: Announcement = {
      id,
      title: title.trim() || "Untitled",
      body: body.trim() || "…",
      type,
      createdAt: new Date().toISOString(),
      pinned: pinnedNew,
      ...(relatedKind !== "none" && relatedId
        ? { relatedAssetKind: relatedKind, relatedAssetId: relatedId }
        : {}),
    };
    setItems((prev) => [next, ...prev]);
    setTitle("");
    setBody("");
    setPinnedNew(false);
    setRelatedKind("none");
    setRelatedId("");
  };

  const saveEdit = () => {
    if (!editingId || !editing) return;
    setItems((prev) =>
      prev.map((a) =>
        a.id === editingId
          ? {
              ...a,
              title: editing.title.trim() || a.title,
              body: editing.body.trim() || a.body,
              type: editing.type,
              relatedAssetKind: editing.relatedAssetKind,
              relatedAssetId: editing.relatedAssetId,
            }
          : a,
      ),
    );
    setEditingId(null);
  };

  const remove = (id: string) => {
    if (!confirm("Remove this announcement?")) return;
    setItems((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const togglePinned = (id: string) => {
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)),
    );
  };

  return (
    <section className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Manage announcements</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Session-only create / edit / delete (mock). Refresh resets to seed data.
        </p>
      </header>

      <form
        onSubmit={add}
        className="space-y-4 rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6"
      >
        <h2 className="text-lg font-medium text-neutral-100">New announcement</h2>
        <label className="block text-sm text-neutral-300">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
          />
        </label>
        <label className="block text-sm text-neutral-300">
          Body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 min-h-24 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={pinnedNew}
            onChange={(e) => setPinnedNew(e.target.checked)}
            className="rounded border-white/20"
          />
          Pin this announcement
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-neutral-300">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Announcement["type"])}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
            >
              <option value="new_tool">New tool</option>
              <option value="new_skill">New skill</option>
              <option value="update">Update</option>
              <option value="tip">Tip</option>
            </select>
          </label>
          <label className="block text-sm text-neutral-300">
            Link to catalog (optional)
            <select
              value={relatedKind}
              onChange={(e) => {
                setRelatedKind(e.target.value as typeof relatedKind);
                setRelatedId("");
              }}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
            >
              <option value="none">No link</option>
              <option value="tool">Tool</option>
              <option value="skill">Skill</option>
            </select>
          </label>
        </div>
        {relatedKind === "tool" ? (
          <label className="block text-sm text-neutral-300">
            Tool
            <select
              value={relatedId}
              onChange={(e) => setRelatedId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
            >
              <option value="">Select…</option>
              {toolOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {relatedKind === "skill" ? (
          <label className="block text-sm text-neutral-300">
            Skill
            <select
              value={relatedId}
              onChange={(e) => setRelatedId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
            >
              <option value="">Select…</option>
              {skillOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Button type="submit">Add announcement (session)</Button>
      </form>

      <div className="space-y-3">
        {items.map((announcement) => {
          const isEditing = editingId === announcement.id;
          const draft = isEditing && editing && editing.id === announcement.id ? editing : announcement;

          return (
            <div
              key={announcement.id}
              className="rounded-xl border border-white/10 bg-black/35 p-4"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <label className="block text-sm text-neutral-300">
                    Title
                    <input
                      value={draft.title}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((a) =>
                            a.id === announcement.id ? { ...a, title: e.target.value } : a,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block text-sm text-neutral-300">
                    Body
                    <textarea
                      value={draft.body}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((a) =>
                            a.id === announcement.id ? { ...a, body: e.target.value } : a,
                          ),
                        )
                      }
                      className="mt-1 min-h-20 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block text-sm text-neutral-300">
                    Type
                    <select
                      value={draft.type}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((a) =>
                            a.id === announcement.id
                              ? { ...a, type: e.target.value as Announcement["type"] }
                              : a,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    >
                      <option value="new_tool">New tool</option>
                      <option value="new_skill">New skill</option>
                      <option value="update">Update</option>
                      <option value="tip">Tip</option>
                    </select>
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
                  <p className="text-sm font-medium text-neutral-100">{announcement.title}</p>
                  <p className="mt-1 text-xs text-neutral-400">{announcement.body}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-neutral-400">
                      {announcement.type}
                    </span>
                    {announcement.pinned ? (
                      <span className="rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary">
                        pinned
                      </span>
                    ) : null}
                    {announcement.relatedAssetKind && announcement.relatedAssetId ? (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-neutral-500">
                        → {announcement.relatedAssetKind} {announcement.relatedAssetId}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(announcement.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => togglePinned(announcement.id)}
                    >
                      {announcement.pinned ? "Unpin" : "Pin"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(announcement.id)}
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
    </section>
  );
}
