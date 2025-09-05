-- Create the missing business for the current user
INSERT INTO public.businesses (id, name) 
VALUES (gen_random_uuid(), 'Quick Wash Laundry');

-- Get the business ID and create profile for the existing user
WITH business AS (
  SELECT id as business_id FROM public.businesses WHERE name = 'Quick Wash Laundry'
)
INSERT INTO public.profiles (user_id, business_id, role, first_name, last_name)
SELECT 
  'a465bb13-47fa-495c-ba35-c5f5db1fa20c'::uuid,
  business.business_id,
  'admin'::user_role,
  'Martin',
  'Wangondu'
FROM business;

-- Update the trigger to handle business_name in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
  business_uuid UUID;
BEGIN
  -- Check if we have business_id directly
  IF NEW.raw_user_meta_data ? 'business_id' THEN
    INSERT INTO public.profiles (user_id, business_id, role, first_name, last_name)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'business_id')::UUID,
      COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'user'),
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name'
    );
  -- Check if we have business_name and create business + profile
  ELSIF NEW.raw_user_meta_data ? 'business_name' THEN
    -- Create business if it doesn't exist
    INSERT INTO public.businesses (name)
    VALUES (NEW.raw_user_meta_data ->> 'business_name')
    ON CONFLICT (name) DO NOTHING;
    
    -- Get business ID
    SELECT id INTO business_uuid 
    FROM public.businesses 
    WHERE name = NEW.raw_user_meta_data ->> 'business_name';
    
    -- Create profile
    INSERT INTO public.profiles (user_id, business_id, role, first_name, last_name)
    VALUES (
      NEW.id,
      business_uuid,
      COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'user'),
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure we have a unique constraint on business name
ALTER TABLE public.businesses ADD CONSTRAINT businesses_name_unique UNIQUE (name);