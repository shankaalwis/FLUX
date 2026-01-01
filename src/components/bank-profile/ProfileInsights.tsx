
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertOctagon, RefreshCw, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import { AccountBalanceHistoryChart } from '@/components/bank-profile/AccountBalanceHistoryChart';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ProfileInsightsProps {
    profileId: string;
}

export function ProfileInsights({ profileId }: ProfileInsightsProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRecurringDialog, setShowRecurringDialog] = useState(false);
    const [showAnomaliesDialog, setShowAnomaliesDialog] = useState(false);

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
    const anomaliesList = transactions.filter(t => t.is_anomaly);
    // Use anomaliesList for display in dialog, top 5 for card if needed (but we show count now)
    const anomalies = anomaliesList.slice(0, 5);
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
            {/* Dialogs for details */}
            <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Recurring Expenses</DialogTitle>
                        <DialogDescription>Detected subscriptions and regular payments</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {recurring.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No recurring expenses detected.</p>
                        ) : (
                            recurring.map(t => (
                                <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{t.merchant_name || t.description}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">Rs. {Math.abs(t.amount).toLocaleString()}</p>
                                        <Badge variant="secondary" className="text-xs">Recurring</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAnomaliesDialog} onOpenChange={setShowAnomaliesDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Spending Anomalies</DialogTitle>
                        <DialogDescription>Unusual high-value transactions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {anomaliesList.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No anomalies detected.</p>
                        ) : (
                            anomaliesList.map(t => (
                                <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium text-destructive">{t.merchant_name || t.description}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-destructive">Rs. {Math.abs(t.amount).toLocaleString()}</p>
                                        <Badge variant="destructive" className="text-xs">Anomaly</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowAnomaliesDialog(true)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Spending Anomalies</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{anomaliesList.length}</div>
                        <p className="text-xs text-muted-foreground">Unusual patterns detected</p>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowRecurringDialog(true)}
                >
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
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Account Performance</CardTitle>
                        <CardDescription>Balance history vs Income/Expense flow</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AccountBalanceHistoryChart data={
                            Object.values(transactions
                                .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
                                .reduce((acc: any, t) => {
                                    const date = new Date(t.transaction_date).toLocaleDateString();
                                    if (!acc[date]) {
                                        // Initialize day with previous balance or 0 (simplified)
                                        // Note: True running balance requires scanning from start. 
                                        // Here we assume sorted array logic holds.
                                        acc[date] = { date, income: 0, expenses: 0, balance: 0 };
                                    }

                                    const amount = Math.abs(t.amount);
                                    if (t.transaction_type === 'credit') {
                                        acc[date].income += amount;
                                    } else {
                                        acc[date].expenses += amount;
                                    }

                                    // Balance logic: Use t.balance if available, else calc ? 
                                    // For graph continuity, we prefer t.balance if exists on the LAST transaction of the day
                                    if (t.balance !== null) {
                                        acc[date].balance = t.balance;
                                    }

                                    return acc;
                                }, {}))
                            // Post-process to fill balance gaps if needed, but for now simple mapping
                            // We might want to ensure balance carries over if missing
                        } />
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
