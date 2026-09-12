-- "5 estrellas" prometía en su descripción "con al menos 10 viajes", pero el criterio real
-- era sólo `rating_avg >= 5`: con una única valoración de cinco estrellas ya se desbloqueaba.
-- Mismo fallo de fondo que `punctual_star` en la 0024 —premiar un dato que nadie se ha
-- ganado todavía—, y se arregla con el mismo campo genérico `min_trips` que interpreta
-- src/features/gamification/evaluate-achievements.ts.
--
-- Aquí el número no se elige: 10 es el que el propio logro lleva años prometiendo en su
-- descripción. El criterio pasa a decir lo que la tarjeta ya decía.
--
-- Igual que en la 0024, no se retira a quien ya lo tuviese.

update public.achievements
set criteria = criteria || '{"min_trips": 10}'::jsonb
where code = 'five_star';
