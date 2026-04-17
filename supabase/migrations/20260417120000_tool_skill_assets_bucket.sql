-- Public bucket for admin-uploaded tool/skill distribution assets.
-- 50 MB per file; admin-only writes happen through the service role in
-- src/app/(platform)/admin/assets/actions.ts so no storage.objects policies are required.

insert into storage.buckets (id, name, public, file_size_limit)
values ('tool-skill-assets', 'tool-skill-assets', true, 52428800)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;
