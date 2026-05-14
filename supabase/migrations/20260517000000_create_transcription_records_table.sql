-- Add transcription_records table for synchronized recording history

create table public.transcription_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  text text not null,
  created_at timestamptz default now()
);

-- Enable RLS (standard, WITHOUT force — allows Supabase internal access)
alter table public.transcription_records enable row level security;

-- SELECT: users can only see their own records
create policy "Users can view their own transcription records"
  on public.transcription_records
  for select
  using (auth.uid() = user_id);

-- INSERT: users can only insert records with their own user_id
create policy "Users can insert their own transcription records"
  on public.transcription_records
  for insert
  with check (auth.uid() = user_id);

-- UPDATE: users can only update their own records
create policy "Users can update their own transcription records"
  on public.transcription_records
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: users can only delete their own records
create policy "Users can delete their own transcription records"
  on public.transcription_records
  for delete
  using (auth.uid() = user_id);