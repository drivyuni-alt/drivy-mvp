-- Arregla que universidad, carrera, correo universitario y teléfono se perdieran en cada
-- registro con email/contraseña.
--
-- Causa: `signUpWithEmail` (src/features/auth/api.ts) creaba la cuenta y a continuación
-- lanzaba un UPDATE sobre `public.users` desde el navegador. Con la confirmación de correo
-- activada, `supabase.auth.signUp` devuelve `user` pero NO `session`, así que ese UPDATE
-- viajaba como rol `anon`, RLS lo filtraba y afectaba a cero filas. PostgREST no considera
-- error actualizar cero filas, de modo que el fallo era completamente silencioso: la cuenta
-- se creaba y el perfil quedaba a nulos. Afectaba al 100% de los registros reales.
--
-- Solución: los datos viajan ahora en `raw_user_meta_data` del propio signUp y los escribe
-- este trigger, que es `security definer` y corre en la misma transacción que la creación
-- de la cuenta. No depende de que exista sesión, así que funciona igual con la confirmación
-- de correo activada o desactivada.
--
-- Mantiene el reparto de nombre para OAuth que introdujo 0015 (Google manda `full_name` o
-- `name` en vez de `first_name`/`last_name`).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  display_name text := coalesce(meta ->> 'full_name', meta ->> 'name', '');
  space_pos int := position(' ' in display_name);
  uni_id uuid;
begin
  -- La universidad llega como texto desde el cliente. Un valor corrupto no debe tumbar el
  -- alta entera: si no es un uuid válido o no existe en el catálogo, se guarda nulo y el
  -- usuario podrá corregirlo luego desde su perfil.
  begin
    uni_id := nullif(meta ->> 'university_id', '')::uuid;
  exception when others then
    uni_id := null;
  end;

  if uni_id is not null
     and not exists (select 1 from public.universities where id = uni_id) then
    uni_id := null;
  end if;

  insert into public.users (
    id, first_name, last_name, email,
    university_id, university_email, degree, phone
  )
  values (
    new.id,
    coalesce(
      nullif(meta ->> 'first_name', ''),
      nullif(meta ->> 'given_name', ''),
      nullif(
        case when space_pos > 0 then substring(display_name from 1 for space_pos - 1) else display_name end,
        ''
      ),
      ''
    ),
    coalesce(
      nullif(meta ->> 'last_name', ''),
      nullif(meta ->> 'family_name', ''),
      nullif(
        case when space_pos > 0 then substring(display_name from space_pos + 1) else '' end,
        ''
      ),
      ''
    ),
    new.email,
    uni_id,
    nullif(meta ->> 'university_email', ''),
    nullif(meta ->> 'degree', ''),
    nullif(meta ->> 'phone', '')
  );

  insert into public.user_statistics (user_id) values (new.id);

  return new;
end;
$$;
