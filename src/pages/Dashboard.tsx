import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Transaction, AIInsight, BankProfile } from '@/types/database';
import { StatCard } from '@/components/dashboard/StatCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { TrendLineChart } from '@/components/dashboard/TrendLineChart';
import { TopMerchants } from '@/components/dashboard/TopMerchants';
import { RecentInsights } from '@/components/dashboard/RecentInsights';
import { DollarSign, TrendingDown, CreditCard, RefreshCw } from 'lucide-react';

interface OutletContext {
  bankProfiles: BankProfile[];
  selectedProfileId: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedProfileId } = useOutletContext<OutletContext>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedProfileId]);

  const fetchData = async () => {
    setLoading(true);
    
    let transQuery = supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (selectedProfileId) {
      transQuery = transQuery.eq('bank_profile_id', selectedProfileId);
    }

    const [transResult, insightsResult] = await Promise.all([
      transQuery,
      supabase.from('ai_insights').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    if (transResult.data) setTransactions(transResult.data as Transaction[]);
    if (insightsResult.data) setInsights(insightsResult.data as AIInsight[]);
    
    setLoading(false);
  };

  // Calculate stats
  const totalIncome = transactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const recurringCount = transactions.filter(t => t.is_recurring).length;

  // Category data for pie chart
  const categoryData = transactions
    .filter(t => t.transaction_type === 'debit')
    .reduce((acc, t) => {
      const cat = t.user_override_category || t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value, color: '' }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Monthly chart data
  const monthlyData = [
    { month: 'Jan', income: 4500, expenses: 3200 },
    { month: 'Feb', income: 4800, expenses: 3400 },
    { month: 'Mar', income: 5200, expenses: 3800 },
    { month: 'Apr', income: 4900, expenses: 3500 },
    { month: 'May', income: 5500, expenses: 4100 },
    { month: 'Jun', income: 5100, expenses: 3700 },
  ];

  // Top merchants
  const merchantData = transactions
    .filter(t => t.transaction_type === 'debit' && t.merchant_name)
    .reduce((acc, t) => {
      const merchant = t.merchant_name!;
      if (!acc[merchant]) acc[merchant] = { amount: 0, count: 0 };
      acc[merchant].amount += Math.abs(t.amount);
      acc[merchant].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

  const topMerchants = Object.entries(merchantData)
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your financial health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={`$${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 8.2, positive: true }}
        />
        <StatCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<TrendingDown className="h-5 w-5" />}
          trend={{ value: 3.1, positive: false }}
        />
        <StatCard
          title="Transactions"
          value={transactions.length.toString()}
          subtitle="This period"
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Recurring"
          value={recurringCount.toString()}
          subtitle="Subscriptions detected"
          icon={<RefreshCw className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart data={monthlyData} />
        <CategoryPieChart data={pieData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendLineChart data={[
            { date: 'Week 1', balance: 5200 },
            { date: 'Week 2', balance: 4800 },
            { date: 'Week 3', balance: 5500 },
            { date: 'Week 4', balance: 6200 },
          ]} />
        </div>
        <TopMerchants data={topMerchants} />
      </div>

      <RecentInsights insights={insights} />
    </div>
  );
}
