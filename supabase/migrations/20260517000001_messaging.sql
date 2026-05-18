-- Slice 6: In-app messaging.
--
-- Threads (`conversations`) are scoped to an (agency, ambassador) pair, optionally
-- tied to a specific application. Off-platform contact info is never exposed in
-- DMs by the UI until a booking is confirmed (enforced in the app layer).

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (agency_id, ambassador_id, application_id)
);

create index if not exists conversations_agency_idx on public.conversations(agency_id);
create index if not exists conversations_ambassador_idx on public.conversations(ambassador_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- conversations: either party can read; only those parties (or admin via service
-- key) can insert. last_message_at bumps via server-side update path.
create policy "conversations_select_party"
  on public.conversations for select
  using (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = conversations.agency_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.ambassadors a
      where a.id = conversations.ambassador_id and a.user_id = auth.uid()
    )
  );

create policy "conversations_insert_party"
  on public.conversations for insert
  with check (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = conversations.agency_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.ambassadors a
      where a.id = conversations.ambassador_id and a.user_id = auth.uid()
    )
  );

create policy "conversations_update_party"
  on public.conversations for update
  using (
    exists (
      select 1 from public.agency_members m
      where m.agency_id = conversations.agency_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.ambassadors a
      where a.id = conversations.ambassador_id and a.user_id = auth.uid()
    )
  );

-- messages: read if you can read the parent conversation. Insert if you're a
-- party AND you're inserting your own user id as sender.
create policy "messages_select_party"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (
          exists (
            select 1 from public.agency_members m
            where m.agency_id = c.agency_id and m.user_id = auth.uid()
          )
          or exists (
            select 1 from public.ambassadors a
            where a.id = c.ambassador_id and a.user_id = auth.uid()
          )
        )
    )
  );

create policy "messages_insert_party_as_self"
  on public.messages for insert
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (
          exists (
            select 1 from public.agency_members m
            where m.agency_id = c.agency_id and m.user_id = auth.uid()
          )
          or exists (
            select 1 from public.ambassadors a
            where a.id = c.ambassador_id and a.user_id = auth.uid()
          )
        )
    )
  );

create policy "messages_update_self"
  on public.messages for update
  using (sender_user_id = auth.uid())
  with check (sender_user_id = auth.uid());
