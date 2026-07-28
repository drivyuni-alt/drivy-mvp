-- Enables Supabase Realtime (Postgres change feed) for the tables the Fase 4 chat and
-- "ruta inteligente" screens subscribe to, and adds the storage bucket for images
-- shared in chat. See docs/06-decisiones-fase-4.md.

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.passengers;

-- Chat images live under `<chat_id>/<filename>`. Unlike `avatars`, this bucket is NOT
-- public: only the chat's driver/passenger may read or write its files, enforced by
-- checking membership in `public.chats` from the storage policy itself.
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

create policy "chat participants read chat attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.chats
      where chats.id::text = (storage.foldername(name))[1]
        and (chats.driver_id = auth.uid() or chats.passenger_id = auth.uid())
    )
  );

create policy "chat participants upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.chats
      where chats.id::text = (storage.foldername(name))[1]
        and (chats.driver_id = auth.uid() or chats.passenger_id = auth.uid())
    )
  );
