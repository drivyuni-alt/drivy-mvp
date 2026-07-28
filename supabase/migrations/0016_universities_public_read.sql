-- 0008_rls_policies.sql restricted `universities` reads to the `authenticated` role,
-- but the register form (features/auth/components, /register page) needs to populate
-- the university dropdown *before* the visitor has an account — at that point the
-- browser client is calling as `anon`, not `authenticated`, so every row was filtered
-- out and the select silently rendered with zero options. Universities are a public
-- reference catalog (name/city/email domain, nothing sensitive), so it's safe to open
-- read access to anonymous visitors too.

create policy "universities are readable by anonymous visitors"
  on public.universities for select
  to anon
  using (true);
