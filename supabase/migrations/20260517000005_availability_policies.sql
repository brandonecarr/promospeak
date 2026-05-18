-- Slice 10: Availability.
--
-- Ambassadors own their availability. Public read so AI matching (and a future
-- agency-facing calendar view) can use it without per-relationship grants.

create policy "availability_select_public"
  on public.availability for select
  using (true);

create policy "availability_insert_self"
  on public.availability for insert
  with check (
    exists (
      select 1 from public.ambassadors a
      where a.id = availability.ambassador_id and a.user_id = auth.uid()
    )
  );

create policy "availability_update_self"
  on public.availability for update
  using (
    exists (
      select 1 from public.ambassadors a
      where a.id = availability.ambassador_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ambassadors a
      where a.id = availability.ambassador_id and a.user_id = auth.uid()
    )
  );

create policy "availability_delete_self"
  on public.availability for delete
  using (
    exists (
      select 1 from public.ambassadors a
      where a.id = availability.ambassador_id and a.user_id = auth.uid()
    )
  );
