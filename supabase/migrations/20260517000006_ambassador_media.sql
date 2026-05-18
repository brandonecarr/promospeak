-- Slice 11: Ambassador media portfolio.
--
-- For V1, ambassadors paste hosted URLs (CDN/Imgur/Cloudinary). Switching to
-- Supabase Storage uploads is a follow-up that drops in here without schema
-- changes — `url` already takes any URL.

create table if not exists public.ambassador_media (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  url text not null,
  thumbnail_url text,
  caption text,
  brand_tag text,
  role_tag text,
  year int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ambassador_media_ambassador_idx
  on public.ambassador_media(ambassador_id, sort_order);

alter table public.ambassador_media enable row level security;

create policy "ambassador_media_select_public"
  on public.ambassador_media for select
  using (true);

create policy "ambassador_media_insert_self"
  on public.ambassador_media for insert
  with check (
    exists (
      select 1 from public.ambassadors a
      where a.id = ambassador_media.ambassador_id and a.user_id = auth.uid()
    )
  );

create policy "ambassador_media_update_self"
  on public.ambassador_media for update
  using (
    exists (
      select 1 from public.ambassadors a
      where a.id = ambassador_media.ambassador_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ambassadors a
      where a.id = ambassador_media.ambassador_id and a.user_id = auth.uid()
    )
  );

create policy "ambassador_media_delete_self"
  on public.ambassador_media for delete
  using (
    exists (
      select 1 from public.ambassadors a
      where a.id = ambassador_media.ambassador_id and a.user_id = auth.uid()
    )
  );
