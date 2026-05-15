-- Slice 4: Job posting + public job board.
--
-- RLS policies for the `jobs` table:
--   - SELECT: open jobs are public. Agency members can also see their own
--     draft/closed/cancelled/completed jobs.
--   - INSERT: only authenticated agency members of the referenced agency.
--   - UPDATE: only owners/admins of the referenced agency.

create policy "jobs_select_public_or_member"
  on public.jobs for select
  using (
    status = 'open'
    or exists (
      select 1 from public.agency_members m
      where m.agency_id = jobs.agency_id
        and m.user_id = auth.uid()
    )
  );

create policy "jobs_insert_agency_member"
  on public.jobs for insert
  with check (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = jobs.agency_id
        and m.user_id = auth.uid()
    )
  );

create policy "jobs_update_agency_owner_admin"
  on public.jobs for update
  using (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = jobs.agency_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = jobs.agency_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );
