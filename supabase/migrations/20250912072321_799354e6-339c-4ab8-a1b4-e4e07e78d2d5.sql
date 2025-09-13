-- Fix security issues by setting search_path for functions
CREATE OR REPLACE FUNCTION public.create_app_notification(
  p_user_id UUID,
  p_business_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.app_notifications (user_id, business_id, type, title, message, data)
  VALUES (p_user_id, p_business_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Fix search_path for mark notification function
CREATE OR REPLACE FUNCTION public.mark_app_notification_read(notification_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.app_notifications 
  SET read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;