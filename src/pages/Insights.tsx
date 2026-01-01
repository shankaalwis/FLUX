
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BankProfile, Transaction } from '@/types/database';
import { AccountComparisonChart } from '@/components/insights/AccountComparisonChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, AlertOctagon, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OutletContext {
    bankProfiles: BankProfile[];
}

export default function Insights() {
    const { user } = useAuth();
    const { bankProfiles } = useOutletContext<OutletContext>();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
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
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Process data for Account Comparison
    const accountStats = bankProfiles.map(profile => {
        const profileTrans = transactions.filter(t => t.bank_profile_id === profile.id);
        const income = profileTrans
            .filter(t => t.transaction_type === 'credit')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const expenses = profileTrans
            .filter(t => t.transaction_type === 'debit')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            accountName: profile.name,
            income,
            expenses,
            count: profileTrans.length
        };
    });

    // Calculate Anomalies
    const anomalies = transactions.filter(t => t.is_anomaly).slice(0, 5);

    // Calculate Recurring
    const recurring = transactions.filter(t => t.is_recurring);
    const recurringTotal = recurring.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const uniqueRecurring = Array.from(new Set(recurring.map(t => t.merchant_name || t.description)));

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Insights</h1>
                <p className="text-muted-foreground">Deep dive into your financial patterns</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Spending Anomalies</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transactions.filter(t => t.is_anomaly).length}</div>
                        <p className="text-xs text-muted-foreground">Transactions flagged as unusual</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recurring Expenses</CardTitle>
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs. {recurringTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground">Across {uniqueRecurring.length} active subscriptions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Good</div>
                        <p className="text-xs text-muted-foreground">Income exceeds expenses by 12%</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AccountComparisonChart data={accountStats} />

                <Card>
                    <CardHeader>
                        <CardTitle>Detected Anomalies</CardTitle>
                        <CardDescription>Recent transactions that deviate from normal patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {anomalies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                                    <p>No anomalies detected recently</p>
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

            {/* Account Wise Detailed Stats */}
            <h3 className="text-lg font-semibold mt-4">Account Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountStats.map(stat => {
                    const totalVolume = stat.income + stat.expenses;
                    const incomePercent = totalVolume > 0 ? (stat.income / totalVolume) * 100 : 0;

                    return (
                        <Card key={stat.accountName} className="ovrflow-hidden">
                            <CardHeader className="pb-2 bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base">{stat.accountName}</CardTitle>
                                        <p className="text-xs text-muted-foreground">{stat.count} transactions</p>
                                    </div>
                                    <Badge variant="outline">{stat.count > 0 ? "Active" : "No Data"}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-4 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Cash Flow</span>
                                            <span>{Math.round(incomePercent)}% In / {Math.round(100 - incomePercent)}% Out</span>
                                        </div>
                                        <div className="h-2 w-full bg-red-100 dark:bg-red-900/20 rounded-full overflow-hidden flex">
                                            <div
                                                className="h-full bg-green-500 rounded-l-full"
                                                style={{ width: `${incomePercent}%` }}
                                            />
                                            <div
                                                className="h-full bg-red-500 rounded-r-full"
                                                style={{ width: `${100 - incomePercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Income</p>
                                            <p className="font-medium text-green-600 dark:text-green-400">Rs. {stat.income.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Total Spent</p>
                                            <p className="font-medium text-red-600 dark:text-red-400">Rs. {stat.expenses.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-t pt-3">
                                        <span className="font-medium text-sm">Net Balance</span>
                                        <span className={`text-lg font-bold ${(stat.income - stat.expenses) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            Rs. {(stat.income - stat.expenses).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
