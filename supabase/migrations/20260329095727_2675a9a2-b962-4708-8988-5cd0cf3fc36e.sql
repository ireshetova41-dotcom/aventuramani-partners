
CREATE TABLE public.client_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_name text NOT NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  comment text,
  ref_agent_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can create client applications"
ON public.client_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view client applications"
ON public.client_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Agents can view their referral applications
CREATE POLICY "Agents can view own referral applications"
ON public.client_applications
FOR SELECT
TO authenticated
USING (auth.uid() = ref_agent_id);
