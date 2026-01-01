
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
    const [showMerchantsDialog, setShowMerchantsDialog] = useState(false);
    const [showCategoriesDialog, setShowCategoriesDialog] = useState(false);

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

    // Monthly Average Spending
    const totalExpenses = transactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgTransaction = totalExpenses / (transactions.filter(t => t.transaction_type === 'debit').length || 1);

    // Top Merchants
    const merchantSpending = transactions
        .filter(t => t.transaction_type === 'debit' && (t.merchant_name || t.description))
        .reduce((acc, t) => {
            const name = t.merchant_name || t.description;
            acc[name] = (acc[name] || 0) + Math.abs(t.amount);
            return acc;
        }, {} as Record<string, number>);

    const topMerchants = Object.entries(merchantSpending)
        .sort(([, a], [, b]) => b - a)
        .map(([name, amount]) => ({ name, amount }));

    // Top Categories
    const categorySpending = transactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((acc, t) => {
            const cat = t.user_override_category || t.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
            return acc;
        }, {} as Record<string, number>);

    const topCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .map(([name, amount]) => ({ name, amount }));

    // calculations logic moved here... wait, I need to DELETE the old location or empty it.
    // The instruction is to replace. I should remove them from here and add them at the top.
    // But replace_file_content replaces a block.
    // I will do this in two steps or one multi_replace if possible.
    // Actually, I can use replace_file_content to remove them (replace with empty string) and then another call to add them at the top.
    // OR, I can use multi_replace.

    // Strategy: 
    // 1. Add them at the top (lines 26-27).
    // 2. Remove them from middle (lines 103-104).

    // Wait, let's verify exact line numbers from previous view.
    // Step 1215:
    // Line 22: const [transactions...
    // Line 23: const [loading...
    // ...
    // Line 31: fetch logic...
    // ...
    // Line 47: if (loading) return...
    // ...
    // Line 103: const [showMerchantsDialog...

    // I need to move line 103 and 104 to be around line 26. Note that I did edits in step 1363 which added lines? 
    // In step 1363 I replaced chart logic at the bottom. The hooks were still at line 103?
    // Wait, step 1363 diff showed:
    // @@ -103,6 +103,31 @@
    // const [showMerchantsDialog...
    // + const chartData = ...

    // so lines 103/104 are still there.

    // I will use multi_replace_file_content to move them.

    // Chart Data Calculation
    const chartData = Object.values(transactions
        .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
        .reduce((acc: any, t) => {
            const dateObj = new Date(t.transaction_date);
            const date = isNaN(dateObj.getTime()) ? 'Invalid Date' : dateObj.toLocaleDateString();

            if (date === 'Invalid Date') return acc; // Skip invalid dates

            if (!acc[date]) {
                acc[date] = { date, income: 0, expenses: 0, balance: 0 };
            }
            const amount = Math.abs(t.amount);
            if (t.transaction_type === 'credit') {
                acc[date].income += amount;
            } else {
                acc[date].expenses += amount;
            }
            if (t.balance !== null) {
                acc[date].balance = t.balance;
            }
            return acc;
        }, {}))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-6">
            {/* ... Existing Dialogs ... */}
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
                {/* ... existing anomalies content ... */}
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

            <Dialog open={showMerchantsDialog} onOpenChange={setShowMerchantsDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Top Merchants</DialogTitle>
                        <DialogDescription>Your highest spending by merchant</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {topMerchants.map((m, i) => (
                            <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                                <span className="font-medium">{m.name}</span>
                                <span className="font-bold">Rs. {m.amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showCategoriesDialog} onOpenChange={setShowCategoriesDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Top Categories</DialogTitle>
                        <DialogDescription>Your highest spending by category</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {topCategories.map((c, i) => (
                            <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                                <span className="font-medium">{c.name}</span>
                                <span className="font-bold">Rs. {c.amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowAnomaliesDialog(true)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Spending Anomalies</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{anomaliesList.length}</div>
                        <p className="text-xs text-muted-foreground">Unusual patterns detected</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowRecurringDialog(true)}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowMerchantsDialog(true)}>
                    <CardHeader>
                        <CardTitle>Top Merchants</CardTitle>
                        <CardDescription>Click to view all</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {topMerchants.slice(0, 3).map((m, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="truncate max-w-[150px]">{m.name}</span>
                                    <span className="font-semibold">Rs. {m.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCategoriesDialog(true)}>
                    <CardHeader>
                        <CardTitle>Top Categories</CardTitle>
                        <CardDescription>Click to view all</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {topCategories.slice(0, 3).map((c, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="truncate max-w-[150px]">{c.name}</span>
                                    <span className="font-semibold">Rs. {c.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                    <AccountBalanceHistoryChart data={chartData} type="income" />
                </div>
                <div className="col-span-1">
                    <AccountBalanceHistoryChart data={chartData} type="expenses" />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <AccountBalanceHistoryChart data={chartData} type="balance" />
                </div>
            </div>
        </div>
    );
}
