-- Slice 9: Verifications (Stripe Identity + Checkr).
--
-- An ambassador sees their own verification rows. An agency can see verification
-- records they paid for (paid_by_agency_id). Webhook handlers write via service
-- role and bypass RLS.

create policy "verifications_select_self"
  on public.verifications for select
  using (user_id = auth.uid());

create policy "verifications_select_paying_agency"
  on public.verifications for select
  using (
    paid_by_agency_id is not null
    and exists (
      select 1 from public.agency_members m
      where m.agency_id = verifications.paid_by_agency_id
        and m.user_id = auth.uid()
    )
  );
