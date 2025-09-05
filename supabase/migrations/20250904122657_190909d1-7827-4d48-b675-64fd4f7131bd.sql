-- Create businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'user',
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'not_paid' CHECK (payment_status IN ('paid', 'not_paid')),
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = $1;
$$;

-- Create security definer function to get user business
CREATE OR REPLACE FUNCTION public.get_user_business(user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE profiles.user_id = $1;
$$;

-- RLS Policies for businesses
CREATE POLICY "Users can view their own business" ON public.businesses
  FOR SELECT USING (id = public.get_user_business(auth.uid()));

CREATE POLICY "Admins can insert businesses" ON public.businesses
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update their business" ON public.businesses
  FOR UPDATE USING (id = public.get_user_business(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their business" ON public.profiles
  FOR SELECT USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Admins can insert profiles in their business" ON public.profiles
  FOR INSERT WITH CHECK (business_id = public.get_user_business(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can update profiles in their business" ON public.profiles
  FOR UPDATE USING (business_id = public.get_user_business(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete profiles in their business" ON public.profiles
  FOR DELETE USING (business_id = public.get_user_business(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for services
CREATE POLICY "Users can view services in their business" ON public.services
  FOR SELECT USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Users can insert services in their business" ON public.services
  FOR INSERT WITH CHECK (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Users can update services in their business" ON public.services
  FOR UPDATE USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Admins can delete services in their business" ON public.services
  FOR DELETE USING (business_id = public.get_user_business(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses in their business" ON public.expenses
  FOR SELECT USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Users can insert expenses in their business" ON public.expenses
  FOR INSERT WITH CHECK (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Users can update expenses in their business" ON public.expenses
  FOR UPDATE USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Admins can delete expenses in their business" ON public.expenses
  FOR DELETE USING (business_id = public.get_user_business(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only create profile if user_metadata contains business_id
  IF NEW.raw_user_meta_data ? 'business_id' THEN
    INSERT INTO public.profiles (user_id, business_id, role, first_name, last_name)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'business_id')::UUID,
      COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'user'),
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();