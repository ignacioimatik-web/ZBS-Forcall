-- Add transcription_records table for synchronized recording history

create table public.transcription_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  text text not null,
  created_at timestamptz default now()
);

alter table public.transcription_records enable row level security;

create policy "Transcription records are viewable and manageable by the user who created them"
  on public.transcription_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);