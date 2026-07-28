-- Expansion to Sevilla. CEU is the priority launch university; the other three are
-- added now so the catalog is ready as coverage grows, per docs/07-decisiones-fase-5.md
-- style "documented assumption": email_domain values are best-effort and should be
-- corrected if wrong, since they drive automatic university-email verification.

insert into public.universities (name, short_name, email_domain, city) values
  ('CEU Fernando III', 'CEU', 'ceu.es', 'Sevilla'),
  ('Universidad de Sevilla', 'US', 'us.es', 'Sevilla'),
  ('Universidad Pablo de Olavide', 'UPO', 'upo.es', 'Sevilla'),
  ('Universidad Loyola Andalucía', 'Loyola', 'uloyola.es', 'Sevilla');
