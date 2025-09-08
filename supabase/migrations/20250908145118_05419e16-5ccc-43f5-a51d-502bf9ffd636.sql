-- Add phone_number column to services table for SMS/WhatsApp notifications
ALTER TABLE public.services 
ADD COLUMN phone_number TEXT;

-- Create activity_logs table for audit trail
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  table_name VARCHAR(50) NOT NULL CHECK (table_name IN ('services', 'expenses', 'users', 'profiles')),
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activity_logs
CREATE POLICY "Users can view activity logs in their business" 
ON public.activity_logs 
FOR SELECT 
USING (business_id = get_user_business(auth.uid()));

CREATE POLICY "Users can insert activity logs in their business" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (business_id = get_user_business(auth.uid()));

-- Create notifications table for SMS/WhatsApp system
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  service_id UUID REFERENCES public.services(id),
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('ready', 'payment_due', 'promotion')),
  message_content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view notifications in their business" 
ON public.notifications 
FOR SELECT 
USING (business_id = get_user_business(auth.uid()));

CREATE POLICY "Users can insert notifications in their business" 
ON public.notifications 
FOR INSERT 
WITH CHECK (business_id = get_user_business(auth.uid()));

CREATE POLICY "Users can update notifications in their business" 
ON public.notifications 
FOR UPDATE 
USING (business_id = get_user_business(auth.uid()));

-- Create message_templates table for customizable messages
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) NOT NULL,
  name VARCHAR(100) NOT NULL,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('ready', 'payment_due', 'promotion')),
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- Enable RLS on message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for message_templates
CREATE POLICY "Users can view message templates in their business" 
ON public.message_templates 
FOR SELECT 
USING (business_id = get_user_business(auth.uid()));

CREATE POLICY "Admins can manage message templates in their business" 
ON public.message_templates 
FOR ALL 
USING ((business_id = get_user_business(auth.uid())) AND (get_user_role(auth.uid()) = 'admin'::user_role));

-- Add triggers for updated_at columns
CREATE TRIGGER update_activity_logs_updated_at
BEFORE UPDATE ON public.activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default message templates for businesses
INSERT INTO public.message_templates (business_id, name, message_type, template_content, variables)
SELECT DISTINCT 
  b.id as business_id,
  'Service Ready',
  'ready',
  'Hello {{customer_name}}! Your laundry service is ready for pickup. Thank you for choosing us!',
  '["customer_name"]'::jsonb
FROM public.businesses b;

INSERT INTO public.message_templates (business_id, name, message_type, template_content, variables)
SELECT DISTINCT 
  b.id as business_id,
  'Payment Due',
  'payment_due',
  'Hello {{customer_name}}! This is a friendly reminder that you have an outstanding payment of {{amount}} due on {{due_date}}. Please contact us to settle your account.',
  '["customer_name", "amount", "due_date"]'::jsonb
FROM public.businesses b;

INSERT INTO public.message_templates (business_id, name, message_type, template_content, variables)
SELECT DISTINCT 
  b.id as business_id,
  'Promotion',
  'promotion',
  'Hello {{customer_name}}! We have a special offer just for you. Contact us to learn more about our current promotions!',
  '["customer_name"]'::jsonb
FROM public.businesses b;