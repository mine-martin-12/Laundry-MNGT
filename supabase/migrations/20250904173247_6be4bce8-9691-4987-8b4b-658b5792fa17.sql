-- Create payment method enum
CREATE TYPE payment_method AS ENUM ('cash', 'mpesa', 'bank_cheque', 'credit');

-- Create enhanced payment status enum  
CREATE TYPE payment_status_new AS ENUM ('not_paid', 'partially_paid', 'fully_paid');

-- Add new columns to services table
ALTER TABLE public.services 
ADD COLUMN payment_method payment_method DEFAULT 'cash',
ADD COLUMN deposit_amount NUMERIC DEFAULT 0,
ADD COLUMN due_date DATE;

-- Create a temporary column for the new payment status
ALTER TABLE public.services 
ADD COLUMN payment_status_new payment_status_new;

-- Migrate existing payment status data
UPDATE public.services 
SET payment_status_new = 
  CASE 
    WHEN payment_status = 'paid' THEN 'fully_paid'::payment_status_new
    ELSE 'not_paid'::payment_status_new
  END;

-- Drop the old payment_status column and rename the new one
ALTER TABLE public.services DROP COLUMN payment_status;
ALTER TABLE public.services RENAME COLUMN payment_status_new TO payment_status;

-- Set the new payment_status column to NOT NULL with default
ALTER TABLE public.services ALTER COLUMN payment_status SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN payment_status SET DEFAULT 'not_paid';

-- Create credits table for tracking credit customers
CREATE TABLE public.credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  customer_name TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id),
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on credits table
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for credits table
CREATE POLICY "Users can view credits in their business" 
ON public.credits 
FOR SELECT 
USING (business_id = get_user_business(auth.uid()));

CREATE POLICY "Users can insert credits in their business" 
ON public.credits 
FOR INSERT 
WITH CHECK (business_id = get_user_business(auth.uid()));

CREATE POLICY "Users can update credits in their business" 
ON public.credits 
FOR UPDATE 
USING (business_id = get_user_business(auth.uid()));

CREATE POLICY "Admins can delete credits in their business" 
ON public.credits 
FOR DELETE 
USING ((business_id = get_user_business(auth.uid())) AND (get_user_role(auth.uid()) = 'admin'::user_role));

-- Add trigger for credits table timestamps
CREATE TRIGGER update_credits_updated_at
BEFORE UPDATE ON public.credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();