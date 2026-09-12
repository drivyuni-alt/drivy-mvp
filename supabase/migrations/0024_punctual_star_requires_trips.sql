-- "Puntual estrella" exigía puntualidad > 95, pero `user_statistics.punctuality_score`
-- nace en 100 por defecto (0007), antes de que el usuario haya completado ningún viaje.
-- Resultado: el logro se desbloqueaba en el primerísimo viaje de cualquiera, sin un solo
-- dato real de puntualidad detrás. Se vio al simular un viaje completo de principio a fin.
--
-- El criterio pasa a llevar un `min_trips`, campo opcional que
-- src/features/gamification/evaluate-achievements.ts aplica a cualquier logro: hasta que no
-- hay ese número de viajes completados, el logro no está en juego. Se mantiene así la tabla
-- data-driven, sin necesidad de migración para el siguiente logro que lo necesite.
--
-- 3 viajes es el mínimo para que el número signifique algo sin volverse inalcanzable en un
-- producto que acaba de arrancar. La alternativa que se descartó era arrancar
-- `punctuality_score` en NULL: es más honesto, pero obliga a tocar el motor de matching
-- (features/matching/scoring.ts) y la pantalla de perfil, mucho más superficie para el
-- mismo resultado.
--
-- No se retira el logro a quien ya lo tuviese: los puntos están contados y gastados en su
-- nivel, y quitárselo sería un castigo por un fallo nuestro. Sólo deja de concederse mal a
-- partir de ahora.

update public.achievements
set criteria = criteria || '{"min_trips": 3}'::jsonb
where code = 'punctual_star';
