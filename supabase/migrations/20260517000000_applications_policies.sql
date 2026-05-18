-- Slice 5: Applications.
--
-- RLS policies for `applications`:
--   - SELECT: the ambassador who applied; any agency member of the job's
--     agency (to review applicants).
--   - INSERT: the authenticated ambassador inserting a row for themselves
--     against an `open` job (one row per (job, ambassador) via the existing
--     unique index).
--   - UPDATE: the ambassador (limited to status transitions: withdrawn,
--     confirmed, declined) or any agency owner/admin (full status control).
--
-- Status enforcement (which transitions are allowed) is handled in the app
-- layer; RLS gates *who* can touch a row.

create policy "applications_select_self_or_agency_member"
  on public.applications for select
  using (
    exists (
      select 1 from public.ambassadors a
      where a.id = applications.ambassador_id
        and a.user_id = auth.uid()
    )
    or exists (
      select 1 from public.jobs j
      join public.agency_members m on m.agency_id = j.agency_id
      where j.id = applications.job_id
        and m.user_id = auth.uid()
    )
  );

create policy "applications_insert_self_ambassador"
  on public.applications for insert
  with check (
    exists (
      select 1 from public.ambassadors a
      where a.id = applications.ambassador_id
        and a.user_id = auth.uid()
    )
    and exists (
      select 1 from public.jobs j
      where j.id = applications.job_id
        and j.status = 'open'
    )
  );

create policy "applications_update_self_or_agency_owner_admin"
  on public.applications for update
  using (
    exists (
      select 1 from public.ambassadors a
      where a.id = applications.ambassador_id
        and a.user_id = auth.uid()
    )
    or exists (
      select 1 from public.jobs j
      join public.agency_members m on m.agency_id = j.agency_id
      where j.id = applications.job_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.ambassadors a
      where a.id = applications.ambassador_id
        and a.user_id = auth.uid()
    )
    or exists (
      select 1 from public.jobs j
      join public.agency_members m on m.agency_id = j.agency_id
      where j.id = applications.job_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );
