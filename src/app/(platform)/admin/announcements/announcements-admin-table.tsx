"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  createAnnouncement,
  deleteAnnouncement,
  togglePinnedAnnouncement,
  updateAnnouncement,
} from "@/app/(platform)/admin/announcements/actions";
import type { Announcement, Skill, Tool } from "@/lib/mock-data";

type Props = {
  initial: Announcement[];
  tools: Pick<Tool, "id" | "name">[];
  skills: Pick<Skill, "id" | "name">[];
};

type Draft = {
  title: string;
  body: string;
  type: Announcement["type"];
  pinned: boolean;
  relatedKind: "none" | "tool" | "skill";
  relatedId: string;
};

const emptyDraft: Draft = {
  title: "",
  body: "",
  type: "tip",
  pinned: false,
  relatedKind: "none",
  relatedId: "",
};

export function AnnouncementsAdminTable({ initial, tools, skills }: Props) {
  const router = useRouter();
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const optionsByKind = useMemo(
    () => ({
      tool: tools,
      skill: skills,
    }),
    [tools, skills],
  );

  const toInput = (d: Draft) => ({
    title: d.title,
    body: d.body,
    type: d.type,
    pinned: d.pinned,
    relatedAssetKind: d.relatedKind === "none" ? null : d.relatedKind,
    relatedAssetId: d.relatedKind === "none" ? null : d.relatedId || null,
  });

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await createAnnouncement(toInput(newDraft));
      if (!r.ok) return setError(r.message);
      setNewDraft(emptyDraft);
      router.refresh();
    });
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setEditDraft({
      title: a.title,
      body: a.body,
      type: a.type,
      pinned: Boolean(a.pinned),
      relatedKind: a.relatedAssetKind ?? "none",
      relatedId: a.relatedAssetId ?? "",
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setError(null);
    start(async () => {
      const r = await updateAnnouncement(editingId, toInput(editDraft));
      if (!r.ok) return setError(r.message);
      setEditingId(null);
      router.refresh();
    });
  };

  const togglePin = (a: Announcement) => {
    start(async () => {
      const r = await togglePinnedAnnouncement(a.id, !a.pinned);
      if (!r.ok) return setError(r.message);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!confirm("Remove this announcement?")) return;
    start(async () => {
      const r = await deleteAnnouncement(id);
      if (!r.ok) return setError(r.message);
      if (editingId === id) setEditingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={onAdd}
        className="space-y-4 rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6"
      >
        <h2 className="text-lg font-medium text-neutral-100">New announcement</h2>
        <label className="block text-sm text-neutral-300">
          Title
          <input
            value={newDraft.title}
            onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
          />
        </label>
        <label className="block text-sm text-neutral-300">
          Body
          <textarea
            value={newDraft.body}
            onChange={(e) => setNewDraft({ ...newDraft, body: e.target.value })}
            className="mt-1 min-h-24 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={newDraft.pinned}
            onChange={(e) => setNewDraft({ ...newDraft, pinned: e.target.checked })}
            className="rounded border-white/20"
          />
          Pin this announcement
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-neutral-300">
            Type
            <select
              value={newDraft.type}
              onChange={(e) =>
                setNewDraft({ ...newDraft, type: e.target.value as Announcement["type"] })
              }
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
              value={newDraft.relatedKind}
              onChange={(e) =>
                setNewDraft({
                  ...newDraft,
                  relatedKind: e.target.value as Draft["relatedKind"],
                  relatedId: "",
                })
              }
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
            >
              <option value="none">No link</option>
              <option value="tool">Tool</option>
              <option value="skill">Skill</option>
            </select>
          </label>
        </div>
        {newDraft.relatedKind !== "none" ? (
          <label className="block text-sm text-neutral-300">
            {newDraft.relatedKind === "tool" ? "Tool" : "Skill"}
            <select
              value={newDraft.relatedId}
              onChange={(e) => setNewDraft({ ...newDraft, relatedId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
            >
              <option value="">Select…</option>
              {optionsByKind[newDraft.relatedKind].map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add announcement"}
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {initial.map((a) => {
          const isEditing = editingId === a.id;
          const draft = isEditing ? editDraft : null;
          return (
            <div key={a.id} className="rounded-xl border border-white/10 bg-black/35 p-4">
              {isEditing && draft ? (
                <div className="space-y-3">
                  <label className="block text-sm text-neutral-300">
                    Title
                    <input
                      value={draft.title}
                      onChange={(e) => setEditDraft({ ...draft, title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block text-sm text-neutral-300">
                    Body
                    <textarea
                      value={draft.body}
                      onChange={(e) => setEditDraft({ ...draft, body: e.target.value })}
                      className="mt-1 min-h-20 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block text-sm text-neutral-300">
                    Type
                    <select
                      value={draft.type}
                      onChange={(e) =>
                        setEditDraft({ ...draft, type: e.target.value as Announcement["type"] })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                    >
                      <option value="new_tool">New tool</option>
                      <option value="new_skill">New skill</option>
                      <option value="update">Update</option>
                      <option value="tip">Tip</option>
                    </select>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm text-neutral-300">
                      Link kind
                      <select
                        value={draft.relatedKind}
                        onChange={(e) =>
                          setEditDraft({
                            ...draft,
                            relatedKind: e.target.value as Draft["relatedKind"],
                            relatedId: "",
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                      >
                        <option value="none">No link</option>
                        <option value="tool">Tool</option>
                        <option value="skill">Skill</option>
                      </select>
                    </label>
                    {draft.relatedKind !== "none" ? (
                      <label className="block text-sm text-neutral-300">
                        Asset
                        <select
                          value={draft.relatedId}
                          onChange={(e) => setEditDraft({ ...draft, relatedId: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
                        >
                          <option value="">Select…</option>
                          {optionsByKind[draft.relatedKind].map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>
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
                  <p className="text-sm font-medium text-neutral-100">{a.title}</p>
                  <p className="mt-1 text-xs text-neutral-400">{a.body}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-neutral-400">
                      {a.type}
                    </span>
                    {a.pinned ? (
                      <span className="rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary">
                        pinned
                      </span>
                    ) : null}
                    {a.relatedAssetKind && a.relatedAssetId ? (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-neutral-500">
                        → {a.relatedAssetKind} {a.relatedAssetId}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(a)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => togglePin(a)}
                    >
                      {a.pinned ? "Unpin" : "Pin"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pending}
                      onClick={() => remove(a.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {initial.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-neutral-950/40 p-6 text-center text-sm text-neutral-500">
            No announcements yet. Create one above.
          </p>
        ) : null}
      </div>
    </div>
  );
}
