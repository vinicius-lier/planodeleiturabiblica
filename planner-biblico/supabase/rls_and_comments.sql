-- Run this in Supabase SQL Editor.
-- It creates the comments table for public outlines and (re)applies RLS policies.
--
-- IMPORTANT:
-- - This project relies on RLS for security. Do not skip these policies.
-- - Table/column names must match your schema (notes, esbocos, reading_progress).

-- 1) COMMENTS TABLE (esboco_comments)
create table if not exists public.esboco_comments (
  id uuid primary key default gen_random_uuid(),
  esboco_id uuid not null references public.esbocos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  ref_book text,
  ref_chapter integer,
  ref_verses text,
  created_at timestamptz not null default now()
);

create index if not exists esboco_comments_esboco_id_idx on public.esboco_comments (esboco_id);
create index if not exists esboco_comments_user_id_idx on public.esboco_comments (user_id);
create index if not exists esboco_comments_created_at_idx on public.esboco_comments (created_at);

alter table public.esboco_comments enable row level security;

drop policy if exists "esboco_comments_select_public" on public.esboco_comments;
create policy "esboco_comments_select_public"
on public.esboco_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.esbocos e
    where e.id = esboco_comments.esboco_id
      and e.visibility = 'public'
  )
);

drop policy if exists "esboco_comments_insert_public" on public.esboco_comments;
create policy "esboco_comments_insert_public"
on public.esboco_comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.esbocos e
    where e.id = esboco_comments.esboco_id
      and e.visibility = 'public'
  )
);

drop policy if exists "esboco_comments_update_own" on public.esboco_comments;
create policy "esboco_comments_update_own"
on public.esboco_comments
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "esboco_comments_delete_own" on public.esboco_comments;
create policy "esboco_comments_delete_own"
on public.esboco_comments
for delete
to authenticated
using (user_id = auth.uid());

-- 2) NOTES (private, never public)
alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
on public.notes
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
on public.notes
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
on public.notes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
on public.notes
for delete
to authenticated
using (user_id = auth.uid());

-- 3) READING PROGRESS (private per user)
alter table public.reading_progress enable row level security;

drop policy if exists "reading_progress_select_own" on public.reading_progress;
create policy "reading_progress_select_own"
on public.reading_progress
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "reading_progress_insert_own" on public.reading_progress;
create policy "reading_progress_insert_own"
on public.reading_progress
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "reading_progress_update_own" on public.reading_progress;
create policy "reading_progress_update_own"
on public.reading_progress
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "reading_progress_delete_own" on public.reading_progress;
create policy "reading_progress_delete_own"
on public.reading_progress
for delete
to authenticated
using (user_id = auth.uid());

-- 4) ESBOCOS (public read for everyone + private only for the owner)
alter table public.esbocos enable row level security;

drop policy if exists "esbocos_select_public_or_own" on public.esbocos;
create policy "esbocos_select_public_or_own"
on public.esbocos
for select
to authenticated
using (visibility = 'public' or user_id = auth.uid());

drop policy if exists "esbocos_insert_own" on public.esbocos;
create policy "esbocos_insert_own"
on public.esbocos
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "esbocos_update_own" on public.esbocos;
create policy "esbocos_update_own"
on public.esbocos
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "esbocos_delete_own" on public.esbocos;
create policy "esbocos_delete_own"
on public.esbocos
for delete
to authenticated
using (user_id = auth.uid());

