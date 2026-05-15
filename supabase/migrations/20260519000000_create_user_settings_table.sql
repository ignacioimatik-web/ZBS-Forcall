-- Create user_settings table to persist per-user app configuration
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.user_settings enable row level security;

-- Users can read/update only their own settings
create policy "Users can read own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- Auto-update updated_at on changes
create extension if not exists moddatetime schema extensions;

create trigger handle_user_settings_updated_at
  before update on public.user_settings
  for each row
  execute function extensions.moddatetime(updated_at);
