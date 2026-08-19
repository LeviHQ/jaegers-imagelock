CREATE OR REPLACE FUNCTION public.delete_own_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  DELETE FROM public.profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$function$;

DROP TABLE IF EXISTS public.reset_codes;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS failed_attempts;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS locked_until;