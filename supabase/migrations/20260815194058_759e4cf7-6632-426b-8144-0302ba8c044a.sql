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

  INSERT INTO public.profiles (id, username, email)
  VALUES (NEW.id, new_username, recovery_email);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_imagelock_user_created ON auth.users;
CREATE TRIGGER on_imagelock_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_imagelock_user_created();