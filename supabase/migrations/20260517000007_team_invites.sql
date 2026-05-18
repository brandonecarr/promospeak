-- Slice 12: Agency team seats.
--
-- Extend handle_new_user() to honor an `invited_agency_id` claim in
-- `raw_user_meta_data`. Server action `inviteAgencyMember` calls
-- supabase.auth.admin.inviteUserByEmail with this metadata, so when the invitee
-- accepts and the auth.users row is inserted, the trigger attaches them to the
-- existing agency instead of creating a new one.

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
  v_invited_agency uuid;
  v_invited_role public.agency_member_role;
begin
  v_role := coalesce(
    nullif(new.raw_user_meta_data->>'role', ''),
    'ambassador'
  )::public.user_role;

  v_display_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    split_part(new.email, '@', 1)
  );

  v_invited_agency := nullif(new.raw_user_meta_data->>'invited_agency_id', '')::uuid;
  v_invited_role := coalesce(
    nullif(new.raw_user_meta_data->>'invited_role', ''),
    'recruiter'
  )::public.agency_member_role;

  insert into public.users (id, email, role)
  values (new.id, new.email, v_role);

  if v_invited_agency is not null and v_role = 'agency_member' then
    -- Join the existing agency rather than creating a new one.
    insert into public.agency_members (agency_id, user_id, role)
    values (v_invited_agency, new.id, v_invited_role)
    on conflict do nothing;
  elsif v_role = 'agency_member' then
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

-- agency_members: owners can insert/update/delete memberships for their agency.
create policy "agency_members_insert_owner_admin"
  on public.agency_members for insert
  with check (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = agency_members.agency_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy "agency_members_update_owner_admin"
  on public.agency_members for update
  using (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = agency_members.agency_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = agency_members.agency_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy "agency_members_delete_owner_admin"
  on public.agency_members for delete
  using (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = agency_members.agency_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );
