-- Add explicit policies to prevent UPDATE and DELETE operations on activity_logs
-- This ensures audit trail integrity and prevents tampering with logs

-- Policy to explicitly deny all UPDATE operations on activity_logs
-- Audit logs should never be modified after creation
CREATE POLICY "Audit logs cannot be updated" 
ON public.activity_logs 
FOR UPDATE 
USING (false);

-- Policy to explicitly deny all DELETE operations on activity_logs  
-- Audit logs should never be deleted to maintain compliance
CREATE POLICY "Audit logs cannot be deleted" 
ON public.activity_logs 
FOR DELETE 
USING (false);