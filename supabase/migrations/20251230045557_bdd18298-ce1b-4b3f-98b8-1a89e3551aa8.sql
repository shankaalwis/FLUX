-- Bank Profiles table
CREATE TABLE public.bank_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'checking',
  parser_type TEXT DEFAULT 'generic',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_profiles
CREATE POLICY "Users can view their own bank profiles" 
ON public.bank_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bank profiles" 
ON public.bank_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank profiles" 
ON public.bank_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank profiles" 
ON public.bank_profiles FOR DELETE USING (auth.uid() = user_id);

-- Statements table
CREATE TABLE public.statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_profile_id UUID NOT NULL REFERENCES public.bank_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  statement_start_date DATE,
  statement_end_date DATE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own statements" 
ON public.statements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own statements" 
ON public.statements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statements" 
ON public.statements FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statements" 
ON public.statements FOR DELETE USING (auth.uid() = user_id);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_profile_id UUID NOT NULL REFERENCES public.bank_profiles(id) ON DELETE CASCADE,
  statement_id UUID REFERENCES public.statements(id) ON DELETE SET NULL,
  transaction_hash TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  original_description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
  balance DECIMAL(15,2),
  category TEXT,
  category_confidence DECIMAL(3,2),
  merchant_name TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  next_expected_date DATE,
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_reason TEXT,
  anomaly_score DECIMAL(3,2),
  user_override_category TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, transaction_hash)
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- AI Insights table
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_profile_id UUID REFERENCES public.bank_profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('monthly_summary', 'spending_spike', 'category_change', 'anomaly_alert', 'recurring_detected', 'general')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  period_start DATE,
  period_end DATE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" 
ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insights" 
ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" 
ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" 
ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

-- Transaction Audit Log
CREATE TABLE public.transaction_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transaction_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" 
ON public.transaction_audit_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audit logs" 
ON public.transaction_audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_bank_profiles_updated_at
  BEFORE UPDATE ON public.bank_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_bank_profile ON public.transactions(bank_profile_id);
CREATE INDEX idx_transactions_category ON public.transactions(category);
CREATE INDEX idx_transactions_hash ON public.transactions(transaction_hash);
CREATE INDEX idx_statements_bank_profile ON public.statements(bank_profile_id);
CREATE INDEX idx_ai_insights_user ON public.ai_insights(user_id, created_at DESC);

-- Storage bucket for statements
INSERT INTO storage.buckets (id, name, public) VALUES ('statements', 'statements', false);

-- Storage policies
CREATE POLICY "Users can upload their own statements"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own statements"
ON storage.objects FOR SELECT
USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own statements"
ON storage.objects FOR DELETE
USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);