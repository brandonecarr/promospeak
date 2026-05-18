-- Slice 8: Forum.
--
-- Reading is open to anyone (forum is the community front door). Writing
-- requires auth. Authors can edit/delete their own posts; admins can do
-- anything via the service-role client.

create policy "forum_categories_select_public"
  on public.forum_categories for select
  using (true);

create policy "forum_threads_select_public"
  on public.forum_threads for select
  using (true);

create policy "forum_threads_insert_auth"
  on public.forum_threads for insert
  with check (auth.uid() = author_user_id);

create policy "forum_threads_update_author"
  on public.forum_threads for update
  using (auth.uid() = author_user_id)
  with check (auth.uid() = author_user_id);

create policy "forum_threads_delete_author"
  on public.forum_threads for delete
  using (auth.uid() = author_user_id);

create policy "forum_posts_select_public"
  on public.forum_posts for select
  using (true);

create policy "forum_posts_insert_auth"
  on public.forum_posts for insert
  with check (auth.uid() = author_user_id);

create policy "forum_posts_update_author"
  on public.forum_posts for update
  using (auth.uid() = author_user_id)
  with check (auth.uid() = author_user_id);

create policy "forum_posts_delete_author"
  on public.forum_posts for delete
  using (auth.uid() = author_user_id);
