
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertOctagon, RefreshCw, TrendingUp, CheckCircle2 } from 'lucide-react';
import { TrendLineChart } from '@/components/dashboard/TrendLineChart';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ProfileInsightsProps {
    profileId: string;
}

export function ProfileInsights({ profileId }: ProfileInsightsProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [profileId]);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('bank_profile_id', profileId)
            .order('transaction_date', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setTransactions(data as Transaction[]);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No transactions found. Upload statements to generate insights.
            </div>
        );
    }

    // Calculations
    const anomalies = transactions.filter(t => t.is_anomaly).slice(0, 5);
    const recurring = transactions.filter(t => t.is_recurring);
    const recurringTotal = recurring.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const uniqueRecurring = Array.from(new Set(recurring.map(t => t.merchant_name || t.description)));

    // Monthly Average Spending (Estimate based on last 30 days vs total time, simplified here)
    const totalExpenses = transactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgTransaction = totalExpenses / (transactions.filter(t => t.transaction_type === 'debit').length || 1);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Spending Anomalies</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transactions.filter(t => t.is_anomaly).length}</div>
                        <p className="text-xs text-muted-foreground">Unusual patterns detected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recurring Expenses</CardTitle>
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs. {recurringTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground">{uniqueRecurring.length} active subscriptions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs. {avgTransaction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground">Per debit transaction</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Spending Trend</CardTitle>
                        <CardDescription>Running balance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <TrendLineChart title="" data={
                                transactions
                                    .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
                                    .reduce((acc, t) => {
                                        const date = new Date(t.transaction_date).toLocaleDateString();
                                        const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
                                        const change = t.transaction_type === 'credit' ? t.amount : -Math.abs(t.amount);
                                        const newBalance = (t.balance !== null) ? t.balance : lastBalance + change;
                                        acc.push({ date, balance: newBalance });
                                        return acc;
                                    }, [] as { date: string; balance: number }[])
                            } />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detected Anomalies</CardTitle>
                        <CardDescription>Transactions needing attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {anomalies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                                    <p>No anomalies detected</p>
                                </div>
                            ) : (
                                anomalies.map(t => (
                                    <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm">{t.merchant_name || t.description}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-destructive">Rs. {Math.abs(t.amount).toLocaleString()}</p>
                                            <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">Anomaly</Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
