DROP POLICY IF EXISTS "public insert" ON public.shared_state;
DROP POLICY IF EXISTS "public read" ON public.shared_state;
DROP POLICY IF EXISTS "public update" ON public.shared_state;
REVOKE ALL ON public.shared_state FROM anon, authenticated;
GRANT ALL ON public.shared_state TO service_role;

CREATE TABLE public.club_settings (
  id text PRIMARY KEY,
  pin text NOT NULL
);
GRANT ALL ON public.club_settings TO service_role;
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.club_settings (id, pin) VALUES ('main', '2026');