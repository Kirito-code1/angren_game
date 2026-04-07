create table if not exists public.disciplines (
  slug text primary key,
  title text not null,
  short_title text not null,
  icon text not null,
  description text not null,
  formats text[] not null default '{}',
  featured boolean not null default false
);

create table if not exists public.profiles (
  id text primary key,
  auth_user_id uuid unique,
  email text not null unique,
  password_hash text not null default '',
  nickname text not null unique,
  country text not null,
  role text not null check (role in ('player', 'captain', 'organizer')),
  disciplines text[] not null default '{}',
  team_id text,
  tournament_history text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.teams (
  id text primary key,
  name text not null unique,
  logo text not null,
  country text not null,
  captain_id text not null,
  member_ids text[] not null default '{}',
  rating integer not null default 1500,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tournaments (
  id text primary key,
  title text not null,
  discipline_slug text not null,
  starts_at timestamptz not null,
  prize_pool_usd integer not null default 0,
  format text not null,
  team_limit integer not null default 8,
  status text not null check (status in ('registration_open', 'ongoing', 'completed')),
  rules text[] not null default '{}',
  applied_team_ids text[] not null default '{}',
  approved_team_ids text[] not null default '{}',
  bracket jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index if not exists idx_tournaments_status on public.tournaments(status);
create index if not exists idx_tournaments_discipline_slug on public.tournaments(discipline_slug);

comment on table public.disciplines is 'The app keeps the live game catalog here.';
comment on table public.profiles is 'Profiles mirror the existing AppStore user model and can optionally link to Supabase Auth.';
