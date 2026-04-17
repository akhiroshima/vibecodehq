-- Studios (public catalog for onboarding + app)
create table if not exists public.studios (
  id text primary key,
  name text not null,
  city text not null,
  designer_count integer not null default 0
);

insert into public.studios (id, name, city, designer_count) values
  ('studio_bangalore', 'Bangalore', 'Bangalore', 38),
  ('studio_delhi', 'Delhi', 'Delhi', 37),
  ('studio_chennai', 'Chennai', 'Chennai', 36),
  ('studio_mumbai', 'Mumbai', 'Mumbai', 36),
  ('studio_pune', 'Pune', 'Pune', 36),
  ('studio_hyderabad', 'Hyderabad', 'Hyderabad', 34),
  ('studio_kolkata', 'Kolkata', 'Kolkata', 33)
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  designer_count = excluded.designer_count;

-- Member profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text unique,
  display_name text,
  avatar_url text,
  role text not null default 'designer' check (role in ('designer', 'prime_mover')),
  studio_id text references public.studios (id),
  job_level text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_lower_idx on public.profiles (lower(username));

alter table public.studios enable row level security;
alter table public.profiles enable row level security;

-- Studios: readable when logged in
drop policy if exists "Studios select authenticated" on public.studios;
create policy "Studios select authenticated"
  on public.studios for select
  to authenticated
  using (true);

-- Profiles: own row
drop policy if exists "Profiles select own" on public.profiles;
create policy "Profiles select own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Profiles insert own" on public.profiles;
create policy "Profiles insert own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Service role bypasses RLS (used only on server for username lookup).
