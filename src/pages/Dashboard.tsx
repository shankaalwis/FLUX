import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { aggregateMonthlyData, calculateWeeklyBalance } from '@/utils/transaction-aggregator';
import { BankProfile, AIInsight } from '@/types/database';
import { StatCard } from '@/components/dashboard/StatCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { TrendLineChart } from '@/components/dashboard/TrendLineChart';
import { TopMerchants } from '@/components/dashboard/TopMerchants';
import { RecentInsights } from '@/components/dashboard/RecentInsights';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';

import { DollarSign, TrendingDown, CreditCard, RefreshCw, Calendar as CalendarIcon, Download } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';

interface OutletContext {
  bankProfiles: BankProfile[];
  selectedProfileId: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedProfileId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  // Use React Query for transactions
  const { data: transactions = [], isLoading } = useTransactions(selectedProfileId);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  // Keep manual simplified fetch for insights for now
  useEffect(() => {
    if (user) {
      supabase.from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) setInsights(data as AIInsight[]);
        });
    }
  }, [user]);

  // Memoized Calculations
  const { totalIncome, totalExpenses, recurringCount } = useMemo(() => {
    const income = transactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const recurring = transactions.filter(t => t.is_recurring).length;

    return { totalIncome: income, totalExpenses: expenses, recurringCount: recurring };
  }, [transactions]);

  const monthlyData = useMemo(() => aggregateMonthlyData(transactions), [transactions]);

  const trendData = useMemo(() =>
    calculateWeeklyBalance(transactions, totalIncome - totalExpenses),
    [transactions, totalIncome, totalExpenses]
  );

  const { pieData, topMerchants } = useMemo(() => {
    const categoryMap = transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((acc, t) => {
        const cat = t.user_override_category || t.category || 'Other';
        acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const pData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value, color: '' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const merchantMap = transactions
      .filter(t => t.transaction_type === 'debit' && t.merchant_name)
      .reduce((acc, t) => {
        const merchant = t.merchant_name!;
        if (!acc[merchant]) acc[merchant] = { amount: 0, count: 0 };
        acc[merchant].amount += Math.abs(t.amount);
        acc[merchant].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

    const tMerchants = Object.entries(merchantMap)
      .map(([merchant, data]) => ({ merchant, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { pieData: pData, topMerchants: tMerchants };
  }, [transactions]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="p-6 space-y-6 animate-in fade-in duration-500">

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your financial trends and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 hidden sm:flex">
            <CalendarIcon className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="default" onClick={() => navigate('/statements')} className="gap-2 shadow-lg shadow-primary/20">
            <Download className="h-4 w-4" />
            New Statement
          </Button>
        </div>
      </header>

      {transactions.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <>
          <section aria-label="Key Statistics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Income"
              value={formatCurrency(totalIncome)}
              rawValue={totalIncome}
              prefix="Rs. "
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
              trend={{ value: 12, positive: true }}
              className="bg-card hover:bg-accent/5 transition-colors duration-200 shadow-sm"
            />
            <StatCard
              title="Total Expenses"
              value={formatCurrency(totalExpenses)}
              rawValue={totalExpenses}
              prefix="Rs. "
              icon={<TrendingDown className="h-5 w-5 text-rose-500" />}
              trend={{ value: 4, positive: false }}
              className="bg-card hover:bg-accent/5 transition-colors duration-200 shadow-sm"
            />
            <StatCard
              title="Transactions"
              value={transactions.length.toString()}

              subtitle="Tracked this period"
              icon={<CreditCard className="h-5 w-5 text-blue-500" />}
              className="bg-card hover:bg-accent/5 transition-colors duration-200 shadow-sm"
            />
            <StatCard
              title="Recurring"
              value={recurringCount.toString()}
              rawValue={recurringCount}
              subtitle="Active subscriptions"
              icon={<RefreshCw className="h-5 w-5 text-purple-500" />}
              className="bg-card hover:bg-accent/5 transition-colors duration-200 shadow-sm"
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section aria-label="Monthly Spending Chart">
              <SpendingChart data={monthlyData} className="shadow-sm border-muted/20" />
            </section>
            <section aria-label="Category Breakdown">
              <CategoryPieChart data={pieData} className="shadow-sm border-muted/20" />
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section aria-label="Weekly Balance Trend" className="lg:col-span-2">
              <TrendLineChart
                data={trendData}
                className="h-full shadow-sm border-muted/20"
              />
            </section>
            <section aria-label="Top Merchants">
              <TopMerchants data={topMerchants} className="shadow-sm border-muted/20" />
            </section>
          </div>

          <section aria-label="Recent AI Insights">
            <RecentInsights insights={insights} />
          </section>
        </>
      )}
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}
