-- Endurece el bloqueo de teléfonos de 0014, que sólo miraba dígitos literales y por tanto
-- se saltaba escribiendo el número con palabras ("seis uno dos tres...") o separando los
-- dígitos con símbolos que no estaban en la lista ("612#345#678").
--
-- Ahora se comprueba dos veces:
--   1. El texto tal cual, con la clase de separadores ampliada a . - _ # * · • y espacios.
--   2. El texto con las palabras-dígito en castellano reescritas a números, lo que además
--      cubre las formas mixtas tipo "612 tres cuatro cinco 678".
--
-- `/` y `:` siguen fuera de los separadores para no marcar fechas ("25/07/2026") ni horas
-- ("20:15") como falsos positivos.
--
-- Espejo exacto de src/lib/phone-detection.ts — si se cambia el umbral, cambiar en ambos.

create or replace function public.reject_phone_numbers_in_messages()
returns trigger
language plpgsql
as $$
declare
  digit_run constant text := '[0-9]([[:space:]._#*·•-]?[0-9]){8,}';
  normalized text;
begin
  if new.type <> 'text' or new.content is null then
    return new;
  end if;

  normalized := lower(new.content);
  normalized := regexp_replace(normalized, '\ycero\y',  '0', 'g');
  normalized := regexp_replace(normalized, '\yuno\y',   '1', 'g');
  normalized := regexp_replace(normalized, '\yuna\y',   '1', 'g');
  normalized := regexp_replace(normalized, '\ydos\y',   '2', 'g');
  normalized := regexp_replace(normalized, '\ytres\y',  '3', 'g');
  normalized := regexp_replace(normalized, '\ycuatro\y','4', 'g');
  normalized := regexp_replace(normalized, '\ycinco\y', '5', 'g');
  normalized := regexp_replace(normalized, '\yseis\y',  '6', 'g');
  normalized := regexp_replace(normalized, '\ysiete\y', '7', 'g');
  normalized := regexp_replace(normalized, '\yocho\y',  '8', 'g');
  normalized := regexp_replace(normalized, '\ynueve\y', '9', 'g');

  if new.content ~ digit_run or normalized ~ digit_run then
    raise exception 'Por seguridad, no se pueden compartir números de teléfono en el chat.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;
