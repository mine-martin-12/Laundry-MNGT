-- Create app_notifications table for in-app notifications
CREATE TABLE public.app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own app notifications" 
ON public.app_notifications 
FOR SELECT 
USING (user_id = auth.uid() AND business_id = get_user_business(auth.uid()));

CREATE POLICY "Users can update their own app notifications" 
ON public.app_notifications 
FOR UPDATE 
USING (user_id = auth.uid() AND business_id = get_user_business(auth.uid()));

CREATE POLICY "System can insert app notifications" 
ON public.app_notifications 
FOR INSERT 
WITH CHECK (business_id = get_user_business(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_app_notifications_updated_at
BEFORE UPDATE ON public.app_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to create app notification
CREATE OR REPLACE FUNCTION public.create_app_notification(
  p_user_id UUID,
  p_business_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.app_notifications (user_id, business_id, type, title, message, data)
  VALUES (p_user_id, p_business_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark app notification as read
CREATE OR REPLACE FUNCTION public.mark_app_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.app_notifications 
  SET read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for app_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_notifications;