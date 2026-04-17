-- Tools + Skills catalog tables, RLS, and helper function.
-- Published rows are readable by any authenticated user; full CRUD is admin-only
-- (prime_mover). Service role bypasses RLS. Timestamps auto-update on write.

create table if not exists public.tools (
  id text primary key,
  slug text unique not null,
  name text not null,
  category_id text not null,
  tagline text not null default '',
  description text not null default '',
  body_markdown text not null default '',
  install_steps jsonb not null default '[]'::jsonb,
  commands jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  resources jsonb not null default '[]'::jsonb,
  adoption_count integer not null default 0,
  cover_image text,
  adoption_stages jsonb,
  content_status text not null default 'draft' check (content_status in ('draft','published','archived')),
  download_url text,
  repo_url text,
  external boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id text primary key,
  slug text unique not null,
  name text not null,
  category_id text not null,
  tagline text not null default '',
  description text not null default '',
  documentation text not null default '',
  body_markdown text not null default '',
  author text not null default '',
  status text not null default 'active' check (status in ('active','beta')),
  download_url text not null default '',
  adoption_count integer not null default 0,
  cover_image text,
  adoption_stages jsonb,
  content_status text not null default 'draft' check (content_status in ('draft','published','archived')),
  repo_url text,
  external boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists tools_touch_updated_at on public.tools;
create trigger tools_touch_updated_at before update on public.tools
  for each row execute function public.touch_updated_at();

drop trigger if exists skills_touch_updated_at on public.skills;
create trigger skills_touch_updated_at before update on public.skills
  for each row execute function public.touch_updated_at();

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'prime_mover'
  );
$$;

alter table public.tools enable row level security;
alter table public.skills enable row level security;

drop policy if exists tools_read_published on public.tools;
create policy tools_read_published on public.tools
  for select to authenticated
  using (content_status = 'published');

drop policy if exists tools_admin_all on public.tools;
create policy tools_admin_all on public.tools
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists skills_read_published on public.skills;
create policy skills_read_published on public.skills
  for select to authenticated
  using (content_status = 'published');

drop policy if exists skills_admin_all on public.skills;
create policy skills_admin_all on public.skills
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create index if not exists tools_content_status_idx on public.tools (content_status);
create index if not exists skills_content_status_idx on public.skills (content_status);
