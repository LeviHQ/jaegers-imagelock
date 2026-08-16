DELETE FROM public.profiles a USING public.profiles b WHERE a.ctid > b.ctid AND lower(a.email) = lower(b.email);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_key ON public.profiles (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username));

CREATE OR REPLACE FUNCTION public.imagelock_availability(_username text, _email text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'username_taken', EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(trim(COALESCE(_username, '')))),
    'email_taken', EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.email) = lower(trim(COALESCE(_email, ''))))
  );
$$;

REVOKE ALL ON FUNCTION public.imagelock_availability(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.imagelock_availability(text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_imagelock_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_username text := lower(trim(COALESCE(NEW.raw_user_meta_data ->> 'username', '')));
  recovery_email text := lower(trim(COALESCE(NEW.raw_user_meta_data ->> 'recovery_email', '')));
BEGIN
  IF new_username !~ '^[a-zA-Z0-9_]{3,32}$' THEN
    RAISE EXCEPTION 'Invalid username';
  END IF;

  IF recovery_email = '' OR length(recovery_email) > 255 THEN
    RAISE EXCEPTION 'Invalid recovery email';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = new_username) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.email) = recovery_email) THEN
    RAISE EXCEPTION 'email_taken';
  END IF;

  INSERT INTO public.profiles (id, username, email)
  VALUES (NEW.id, new_username, recovery_email);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_imagelock_user_created() FROM PUBLIC, anon, authenticated;