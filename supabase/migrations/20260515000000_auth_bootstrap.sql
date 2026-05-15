-- Slice 1: Auth + profile bootstrap.
--
-- This migration:
--   1. Mirrors `auth.users` into `public.users` via trigger so app code can
--      foreign-key against a stable id without dipping into the auth schema.
--   2. Adds initial RLS policies for the tables touched at signup (users,
--      agencies, agency_members, ambassadors). Public-readable surfaces
--      (ambassador directory, agency directory) get a permissive SELECT so
--      anonymous visitors can browse profiles — full data exposure is
--      controlled per-column in the API layer, not RLS.
--   3. Auto-creates the role-appropriate profile row (agency + agency_members
--      OR ambassador) from metadata stamped at signup. This keeps the signup
--      server action a single supabase.auth.signUp() call.

-- ─── auth.users → public.users sync ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_display_name text;
  v_org_name text;
  v_slug text;
  v_agency_id uuid;
begin
  v_role := coalesce(
    nullif(new.raw_user_meta_data->>'role', ''),
    'ambassador'
  )::public.user_role;

  v_display_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.users (id, email, role)
  values (new.id, new.email, v_role);

  if v_role = 'agency_member' then
    v_org_name := coalesce(
      nullif(new.raw_user_meta_data->>'organization_name', ''),
      v_display_name || '''s agency'
    );
    v_slug := public.slugify_unique(v_org_name, 'agencies', 'slug');

    insert into public.agencies (name, slug, billing_email)
    values (v_org_name, v_slug, new.email)
    returning id into v_agency_id;

    insert into public.agency_members (agency_id, user_id, role)
    values (v_agency_id, new.id, 'owner');

  elsif v_role = 'ambassador' then
    v_slug := public.slugify_unique(v_display_name, 'ambassadors', 'slug');
    insert into public.ambassadors (user_id, display_name, slug)
    values (new.id, v_display_name, v_slug);
  end if;

  return new;
end;
$$;

-- Small helper: take a string, return a URL-safe slug that doesn't collide with
-- an existing row in (table, column). Appends -2, -3, ... until free.
create or replace function public.slugify_unique(
  in_input text,
  in_table text,
  in_column text
) returns text
language plpgsql
as $$
declare
  base text;
  candidate text;
  n int := 1;
  exists_count int;
begin
  base := lower(regexp_replace(coalesce(in_input, ''), '[^a-zA-Z0-9]+', '-', 'g'));
  base := trim(both '-' from base);
  if base = '' then
    base := 'user';
  end if;
  candidate := base;
  loop
    execute format(
      'select count(*) from public.%I where %I = $1',
      in_table, in_column
    ) into exists_count using candidate;
    exit when exists_count = 0;
    n := n + 1;
    candidate := base || '-' || n::text;
  end loop;
  return candidate;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── RLS policies (Slice 1 scope) ───────────────────────────────────────────

-- public.users: a user can read/update their own row. No insert (trigger does it).
create policy "users_select_self"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_self"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- public.agencies: agency members can read their agency. Anyone (including anon)
-- can SELECT — directory listings happen later, but agency names are public.
create policy "agencies_select_public"
  on public.agencies for select
  using (true);

create policy "agencies_update_owner_admin"
  on public.agencies for update
  using (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = agencies.id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = agencies.id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- public.agency_members: read your own memberships; agency owners read all members.
create policy "agency_members_select_self_or_owner"
  on public.agency_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.agency_members m
      where m.agency_id = agency_members.agency_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- public.ambassadors: public-readable (directory). Owner can update.
create policy "ambassadors_select_public"
  on public.ambassadors for select
  using (true);

create policy "ambassadors_update_self"
  on public.ambassadors for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
