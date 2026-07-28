-- Extensions & shared helpers used across every table.

create extension if not exists "pgcrypto";

-- Generic trigger to keep `updated_at` current on every row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
