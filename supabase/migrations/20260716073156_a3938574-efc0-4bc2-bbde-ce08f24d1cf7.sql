CREATE TABLE public.shared_state (
  id text PRIMARY KEY,
  state jsonb NOT NULL DEFAULT '{"events":[],"activeEventId":null}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.shared_state TO anon;
GRANT SELECT, INSERT, UPDATE ON public.shared_state TO authenticated;
GRANT ALL ON public.shared_state TO service_role;

ALTER TABLE public.shared_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON public.shared_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert" ON public.shared_state FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update" ON public.shared_state FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_state;

INSERT INTO public.shared_state (id, state) VALUES ('main', '{"events":[],"activeEventId":null}'::jsonb)
ON CONFLICT (id) DO NOTHING;