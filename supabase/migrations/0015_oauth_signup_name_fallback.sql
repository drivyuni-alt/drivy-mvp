-- Fixes `handle_new_user()` (0008_rls_policies.sql) leaving first_name/last_name blank
-- for OAuth sign-ups. Email/password signup passes `first_name`/`last_name` explicitly
-- (see features/auth/api.ts), but Google/Apple OAuth populate `raw_user_meta_data` with
-- `name`/`full_name` (and sometimes `given_name`/`family_name`) instead — the original
-- trigger only looked for `first_name`, so OAuth users ended up with an empty name.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  );
  space_pos int := position(' ' in display_name);
begin
  insert into public.users (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'first_name', ''),
      nullif(new.raw_user_meta_data ->> 'given_name', ''),
      nullif(
        case when space_pos > 0 then substring(display_name from 1 for space_pos - 1) else display_name end,
        ''
      ),
      ''
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'last_name', ''),
      nullif(new.raw_user_meta_data ->> 'family_name', ''),
      nullif(
        case when space_pos > 0 then substring(display_name from space_pos + 1) else '' end,
        ''
      ),
      ''
    ),
    new.email
  );

  insert into public.user_statistics (user_id) values (new.id);

  return new;
end;
$$;
