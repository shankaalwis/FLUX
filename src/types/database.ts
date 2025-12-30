export interface BankProfile {
  id: string;
  user_id: string;
  name: string;
  bank_name: string;
  account_type: string;
  parser_type: string;
  created_at: string;
  updated_at: string;
}

export interface Statement {
  id: string;
  bank_profile_id: string;
  user_id: string;
  filename: string;
  file_path: string;
  file_size: number | null;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  statement_start_date: string | null;
  statement_end_date: string | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  bank_profile_id: string;
  statement_id: string | null;
  transaction_hash: string;
  transaction_date: string;
  description: string;
  original_description: string;
  amount: number;
  transaction_type: 'debit' | 'credit';
  balance: number | null;
  category: string | null;
  category_confidence: number | null;
  merchant_name: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  next_expected_date: string | null;
  is_anomaly: boolean;
  anomaly_reason: string | null;
  anomaly_score: number | null;
  user_override_category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIInsight {
  id: string;
  user_id: string;
  bank_profile_id: string | null;
  insight_type: 'monthly_summary' | 'spending_spike' | 'category_change' | 'anomaly_alert' | 'recurring_detected' | 'general';
  title: string;
  description: string;
  data: Record<string, unknown> | null;
  period_start: string | null;
  period_end: string | null;
  is_read: boolean;
  created_at: string;
}

export interface TransactionAuditLog {
  id: string;
  user_id: string;
  transaction_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

export const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Income',
  'Transfer',
  'Investment',
  'Subscription',
  'Personal Care',
  'Home',
  'Insurance',
  'Taxes',
  'Gifts & Donations',
  'Other'
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number];
