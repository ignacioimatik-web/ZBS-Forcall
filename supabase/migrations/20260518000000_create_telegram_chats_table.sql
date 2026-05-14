create table if not exists public.telegram_chats (
  id uuid default gen_random_uuid() primary key,
  group_id text not null unique,
  group_name text not null,
  is_active boolean default true,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.telegram_chats enable row level security;

create policy "Authenticated users can view telegram chats"
  on public.telegram_chats for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert telegram chats"
  on public.telegram_chats for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update telegram chats"
  on public.telegram_chats for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete telegram chats"
  on public.telegram_chats for delete
  using (auth.role() = 'authenticated');

-- Trigger: updated_at auto-update
create or replace function public.set_telegram_chats_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_telegram_chats_updated on public.telegram_chats;
create trigger set_telegram_chats_updated
  before update on public.telegram_chats
  for each row execute function public.set_telegram_chats_updated_at();