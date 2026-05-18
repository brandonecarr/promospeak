-- Slice 7: Stripe subscriptions.
--
-- RLS on `subscriptions`. Only the agency's members can read; only the
-- service-role client (webhook handler) writes.

create policy "subscriptions_select_agency_member"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = subscriptions.agency_id
        and m.user_id = auth.uid()
    )
  );
