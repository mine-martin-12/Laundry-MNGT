-- Create notification_triggers table for automated notification management
CREATE TABLE public.notification_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'payment_reminder', 'service_due', etc.
  conditions JSONB NOT NULL DEFAULT '{}', -- conditions like days_before, amount_threshold
  message_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_triggers
CREATE POLICY "Users can view notification triggers in their business" 
ON public.notification_triggers 
FOR SELECT 
USING (business_id = get_user_business(auth.uid()));

CREATE POLICY "Admins can manage notification triggers in their business" 
ON public.notification_triggers 
FOR ALL 
USING ((business_id = get_user_business(auth.uid())) AND (get_user_role(auth.uid()) = 'admin'::user_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notification_triggers_updated_at
BEFORE UPDATE ON public.notification_triggers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();