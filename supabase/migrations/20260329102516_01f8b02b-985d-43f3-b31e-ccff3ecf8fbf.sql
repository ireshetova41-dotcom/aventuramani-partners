-- Add profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agency_name text,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS inn text,
  ADD COLUMN IF NOT EXISTS kpp text,
  ADD COLUMN IF NOT EXISTS ogrn text,
  ADD COLUMN IF NOT EXISTS legal_address text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bik text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS corr_account text,
  ADD COLUMN IF NOT EXISTS ref_code text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Unique index on ref_code
CREATE UNIQUE INDEX IF NOT EXISTS profiles_ref_code_unique ON public.profiles (ref_code);

-- Function to generate ref code
CREATE OR REPLACE FUNCTION public.generate_ref_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  code text;
  exists_already boolean;
BEGIN
  LOOP
    code := 'AM-' || upper(substr(md5(random()::text), 1, 4));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE ref_code = code) INTO exists_already;
    IF NOT exists_already THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Update handle_new_user to include ref_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, ref_code)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), generate_ref_code());
  RETURN NEW;
END;
$$;

-- Backfill ref_code for existing profiles
UPDATE public.profiles SET ref_code = generate_ref_code() WHERE ref_code IS NULL;

-- Allow anon to lookup profile by ref_code for catalog resolution
CREATE POLICY "Anyone can lookup profile by ref_code"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (ref_code IS NOT NULL);