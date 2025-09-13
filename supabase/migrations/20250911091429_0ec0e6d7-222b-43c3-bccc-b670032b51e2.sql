-- Create enum for update statuses
CREATE TYPE public.update_status AS ENUM ('pending', 'approved', 'sent_back_for_review', 'rejected');

-- Create pending_updates table
CREATE TABLE public.pending_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  old_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  status update_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_updates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own pending updates" 
ON public.pending_updates 
FOR SELECT 
USING (user_id = auth.uid() OR business_id = get_user_business(auth.uid()));

CREATE POLICY "Users can insert their own pending updates" 
ON public.pending_updates 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND business_id = get_user_business(auth.uid()));

CREATE POLICY "Admins can manage pending updates in their business" 
ON public.pending_updates 
FOR ALL 
USING (business_id = get_user_business(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Create trigger for timestamps
CREATE TRIGGER update_pending_updates_updated_at
BEFORE UPDATE ON public.pending_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to apply approved updates
CREATE OR REPLACE FUNCTION public.apply_pending_update(update_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_record pending_updates%ROWTYPE;
  sql_query TEXT;
BEGIN
  -- Get the pending update
  SELECT * INTO update_record FROM pending_updates WHERE id = update_id AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Apply the update based on table_name
  CASE update_record.table_name
    WHEN 'services' THEN
      UPDATE services 
      SET 
        customer_name = COALESCE((update_record.new_values->>'customer_name')::TEXT, customer_name),
        service_type = COALESCE((update_record.new_values->>'service_type')::TEXT, service_type),
        amount = COALESCE((update_record.new_values->>'amount')::NUMERIC, amount),
        service_date = COALESCE((update_record.new_values->>'service_date')::DATE, service_date),
        due_date = COALESCE((update_record.new_values->>'due_date')::DATE, due_date),
        description = COALESCE((update_record.new_values->>'description')::TEXT, description),
        phone_number = COALESCE((update_record.new_values->>'phone_number')::TEXT, phone_number),
        payment_method = COALESCE((update_record.new_values->>'payment_method')::payment_method, payment_method),
        deposit_amount = COALESCE((update_record.new_values->>'deposit_amount')::NUMERIC, deposit_amount),
        payment_status = COALESCE((update_record.new_values->>'payment_status')::payment_status_new, payment_status),
        updated_at = now()
      WHERE id = update_record.record_id AND business_id = update_record.business_id;
      
    WHEN 'expenses' THEN
      UPDATE expenses 
      SET 
        category = COALESCE((update_record.new_values->>'category')::TEXT, category),
        description = COALESCE((update_record.new_values->>'description')::TEXT, description),
        amount = COALESCE((update_record.new_values->>'amount')::NUMERIC, amount),
        expense_date = COALESCE((update_record.new_values->>'expense_date')::DATE, expense_date),
        updated_at = now()
      WHERE id = update_record.record_id AND business_id = update_record.business_id;
      
    WHEN 'profiles' THEN
      UPDATE profiles 
      SET 
        first_name = COALESCE((update_record.new_values->>'first_name')::TEXT, first_name),
        last_name = COALESCE((update_record.new_values->>'last_name')::TEXT, last_name),
        role = COALESCE((update_record.new_values->>'role')::user_role, role),
        updated_at = now()
      WHERE id = update_record.record_id AND business_id = update_record.business_id;
      
    ELSE
      RETURN FALSE;
  END CASE;
  
  RETURN TRUE;
END;
$$;