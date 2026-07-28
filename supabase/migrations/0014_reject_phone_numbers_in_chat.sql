-- Blocks phone numbers in chat text messages, so drivers/passengers can't route
-- around the platform onto WhatsApp. Enforced here (not just client-side in
-- MessageComposer) because messages are inserted directly by the browser client via
-- RLS, not through a Server Action — a client-only check can be bypassed by calling
-- the Supabase API directly, a trigger cannot.
--
-- Heuristic: a run of 9+ digits, allowing a single space/dot/dash between individual
-- digits (catches "612 345 678", "612-345-678", "612345678", and spaced-out evasion
-- like "6 1 2 3 4 5 6 7 8"). 9 is a Spanish phone number's length; numbers with a
-- country code are longer and still caught. `/` and `:` are deliberately not treated
-- as separators so dates and times don't false-positive. Mirrored client-side in
-- src/lib/phone-detection.ts for instant feedback — keep both patterns in sync.

create or replace function public.reject_phone_numbers_in_messages()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'text' and new.content is not null
     and new.content ~ '\d(?:[ .-]?\d){8,}' then
    raise exception 'Por seguridad, no se pueden compartir números de teléfono en el chat.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger reject_phone_numbers_before_message_insert
  before insert on public.messages
  for each row execute function public.reject_phone_numbers_in_messages();
