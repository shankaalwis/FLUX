import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { TrendLineChart } from '@/components/dashboard/TrendLineChart';
import { TopMerchants } from '@/components/dashboard/TopMerchants';
import { DollarSign, TrendingDown, CreditCard, RefreshCw, Loader2 } from 'lucide-react';

interface ProfileOverviewProps {
    profileId: string;
}

export function ProfileOverview({ profileId }: ProfileOverviewProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, [profileId]);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('bank_profile_id', profileId)
            .order('transaction_date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
        } else {
            setTransactions(data as Transaction[]);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Calculate stats
    const totalIncome = transactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const recurringCount = transactions.filter(t => t.is_recurring).length;
    const netCashflow = totalIncome - totalExpenses;

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

    // Monthly chart data (placeholder - would need real aggregation)
    const monthlyData = [
        { month: 'Jan', income: 0, expenses: 0 },
        { month: 'Feb', income: 0, expenses: 0 },
        { month: 'Mar', income: 0, expenses: 0 },
        { month: 'Apr', income: 0, expenses: 0 },
        { month: 'May', income: 0, expenses: 0 },
        { month: 'Jun', income: 0, expenses: 0 },
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

    if (transactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Data Yet</CardTitle>
                    <CardDescription>
                        Upload statements to see insights and visualizations for this account.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Income"
                    value={`$${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="h-5 w-5" />}
                />
                <StatCard
                    title="Total Expenses"
                    value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={<TrendingDown className="h-5 w-5" />}
                />
                <StatCard
                    title="Net Cashflow"
                    value={`$${netCashflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    subtitle={netCashflow >= 0 ? 'Positive' : 'Negative'}
                    icon={<CreditCard className="h-5 w-5" />}
                />
                <StatCard
                    title="Recurring"
                    value={recurringCount.toString()}
                    subtitle="Subscriptions detected"
                    icon={<RefreshCw className="h-5 w-5" />}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SpendingChart data={monthlyData} />
                <CategoryPieChart data={pieData} />
            </div>

            {/* Bottom section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TrendLineChart data={[
                        { date: 'Week 1', balance: 0 },
                        { date: 'Week 2', balance: 0 },
                        { date: 'Week 3', balance: 0 },
                        { date: 'Week 4', balance: 0 },
                    ]} />
                </div>
                <TopMerchants data={topMerchants} />
            </div>
        </div>
    );
}
