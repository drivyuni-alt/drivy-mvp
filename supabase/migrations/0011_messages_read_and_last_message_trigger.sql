-- 0008 only gave `messages` select/insert policies; read receipts need participants to
-- be able to flip `read_at` on messages they received (never on their own). Also keeps
-- `chats.last_message_at` in sync via trigger so the chat inbox can sort/preview without
-- a second query per chat.

create policy "participants can mark received messages as read"
  on public.messages for update
  to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and (chats.driver_id = auth.uid() or chats.passenger_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and (chats.driver_id = auth.uid() or chats.passenger_id = auth.uid())
    )
  );

create or replace function public.touch_chat_last_message_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chats set last_message_at = new.created_at where id = new.chat_id;
  return new;
end;
$$;

create trigger on_message_created_touch_chat
  after insert on public.messages
  for each row execute function public.touch_chat_last_message_at();
