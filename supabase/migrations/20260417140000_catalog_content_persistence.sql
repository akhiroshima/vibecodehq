-- Categories, announcements, comments, user memberships + admin write policy for studios.

-- Categories
create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.categories (id, name, slug, description, sort_order) values
  ('cat_ai', 'AI Tools', 'ai-tools', 'LLM-assisted workflows and packs', 1),
  ('cat_design', 'Design Tools', 'design-tools', 'Design ↔ engineering handoff', 2),
  ('cat_docs', 'Documentation', 'documentation', 'Docs, playbooks, and knowledge', 3),
  ('cat_review', 'Review', 'review', 'Critique and quality skills', 4)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  sort_order = excluded.sort_order;

drop trigger if exists categories_touch_updated_at on public.categories;
create trigger categories_touch_updated_at before update on public.categories
  for each row execute function public.touch_updated_at();

alter table public.categories enable row level security;

drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
  for select to authenticated using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  type text not null default 'update' check (type in ('new_tool','new_skill','update','tip')),
  pinned boolean not null default false,
  related_asset_kind text check (related_asset_kind in ('tool','skill')),
  related_asset_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists announcements_touch_updated_at on public.announcements;
create trigger announcements_touch_updated_at before update on public.announcements
  for each row execute function public.touch_updated_at();

create index if not exists announcements_created_at_idx on public.announcements (created_at desc);
create index if not exists announcements_pinned_idx on public.announcements (pinned) where pinned = true;

alter table public.announcements enable row level security;

drop policy if exists announcements_select on public.announcements;
create policy announcements_select on public.announcements
  for select to authenticated using (true);

drop policy if exists announcements_admin_write on public.announcements;
create policy announcements_admin_write on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Comments (polymorphic entity_kind + entity_id, 1-level nesting via parent_id)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  entity_kind text not null check (entity_kind in ('tool','skill')),
  entity_id text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists comments_touch_updated_at on public.comments;
create trigger comments_touch_updated_at before update on public.comments
  for each row execute function public.touch_updated_at();

create index if not exists comments_entity_idx on public.comments (entity_kind, entity_id, created_at desc);
create index if not exists comments_parent_idx on public.comments (parent_id);

alter table public.comments enable row level security;

drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select to authenticated using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
  for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists comments_delete_own_or_admin on public.comments;
create policy comments_delete_own_or_admin on public.comments
  for delete to authenticated using (auth.uid() = author_id or public.is_admin());

-- User memberships (per-user depth stage + tracked list)
create table if not exists public.user_memberships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  asset_kind text not null check (asset_kind in ('tool','skill')),
  asset_id text not null,
  stage text not null default 'aware' check (stage in ('aware','exploring','using','expert')),
  tracked boolean not null default false,
  install_steps_completed jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, asset_kind, asset_id)
);

drop trigger if exists user_memberships_touch_updated_at on public.user_memberships;
create trigger user_memberships_touch_updated_at before update on public.user_memberships
  for each row execute function public.touch_updated_at();

create index if not exists user_memberships_asset_idx on public.user_memberships (asset_kind, asset_id, stage);
create index if not exists user_memberships_user_idx on public.user_memberships (user_id, asset_kind);

alter table public.user_memberships enable row level security;

drop policy if exists user_memberships_select_own on public.user_memberships;
create policy user_memberships_select_own on public.user_memberships
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_memberships_insert_own on public.user_memberships;
create policy user_memberships_insert_own on public.user_memberships
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists user_memberships_update_own on public.user_memberships;
create policy user_memberships_update_own on public.user_memberships
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_memberships_delete_own on public.user_memberships;
create policy user_memberships_delete_own on public.user_memberships
  for delete to authenticated using (auth.uid() = user_id);

-- Admin write for studios (prior migration only allowed select)
drop policy if exists studios_admin_write on public.studios;
create policy studios_admin_write on public.studios
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
