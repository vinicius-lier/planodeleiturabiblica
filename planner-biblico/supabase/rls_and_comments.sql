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

-- 2b) HIGHLIGHTS (private per user)
-- Stores only metadata (book/chapter/verse/color). Never store the Bible text here.
create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book text not null,
  chapter integer not null,
  verse integer not null,
  color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint highlights_chapter_positive check (chapter > 0),
  constraint highlights_verse_positive check (verse > 0),
  constraint highlights_color_valid check (color in ('yellow', 'green', 'blue', 'red'))
);

-- Migration safety: if `highlights` already existed without these columns, add them.
alter table public.highlights add column if not exists created_at timestamptz;
alter table public.highlights add column if not exists updated_at timestamptz;
alter table public.highlights alter column created_at set default now();
alter table public.highlights alter column updated_at set default now();
update public.highlights set created_at = coalesce(created_at, now()) where created_at is null;
update public.highlights set updated_at = coalesce(updated_at, now()) where updated_at is null;
alter table public.highlights alter column created_at set not null;
alter table public.highlights alter column updated_at set not null;

create unique index if not exists highlights_unique_ref
on public.highlights (user_id, book, chapter, verse);

create index if not exists highlights_user_book_chapter_idx
on public.highlights (user_id, book, chapter);

alter table public.highlights enable row level security;

drop policy if exists "highlights_select_own" on public.highlights;
create policy "highlights_select_own"
on public.highlights
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "highlights_insert_own" on public.highlights;
create policy "highlights_insert_own"
on public.highlights
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "highlights_update_own" on public.highlights;
create policy "highlights_update_own"
on public.highlights
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "highlights_delete_own" on public.highlights;
create policy "highlights_delete_own"
on public.highlights
for delete
to authenticated
using (user_id = auth.uid());

-- If you added columns/policies and PostgREST still complains, reload schema cache:
-- notify pgrst, 'reload schema';

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
