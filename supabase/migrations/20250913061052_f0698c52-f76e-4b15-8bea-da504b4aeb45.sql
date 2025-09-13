-- Add user_reason field to pending_updates table
ALTER TABLE public.pending_updates 
ADD COLUMN user_reason TEXT;

-- Create more restrictive RLS policies for services table
DROP POLICY IF EXISTS "Users can view services in their business" ON public.services;
DROP POLICY IF EXISTS "Users can update services in their business" ON public.services;

-- Only allow viewing services created by the user or if they are admin/manager
CREATE POLICY "Users can view their own services or admins can view all" 
ON public.services 
FOR SELECT 
USING (
  business_id = get_user_business(auth.uid()) 
  AND (
    created_by = auth.uid() 
    OR get_user_role(auth.uid()) = 'admin'::user_role
  )
);

-- Only allow updating services created by the user (admin updates go through pending_updates)
CREATE POLICY "Users can update their own services" 
ON public.services 
FOR UPDATE 
USING (
  business_id = get_user_business(auth.uid()) 
  AND created_by = auth.uid()
);

-- Restrict pending_updates access to only show user's own requests and admin can see all
DROP POLICY IF EXISTS "Users can view their own pending updates" ON public.pending_updates;

CREATE POLICY "Users can view their own requests or admins can view all" 
ON public.pending_updates 
FOR SELECT 
USING (
  business_id = get_user_business(auth.uid()) 
  AND (
    user_id = auth.uid() 
    OR get_user_role(auth.uid()) = 'admin'::user_role
  )
);

-- Create notification history table for persistent notification storage
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notification_history
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_history
CREATE POLICY "Users can view their own notification history" 
ON public.notification_history 
FOR SELECT 
USING (user_id = auth.uid() AND business_id = get_user_business(auth.uid()));

CREATE POLICY "System can insert notification history" 
ON public.notification_history 
FOR INSERT 
WITH CHECK (business_id = get_user_business(auth.uid()));

CREATE POLICY "Users can update their own notification history" 
ON public.notification_history 
FOR UPDATE 
USING (user_id = auth.uid() AND business_id = get_user_business(auth.uid()));

-- Add trigger for notification_history updated_at
CREATE TRIGGER update_notification_history_updated_at
  BEFORE UPDATE ON public.notification_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();