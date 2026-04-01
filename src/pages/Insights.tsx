
import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BankProfile, Transaction } from '@/types/database';
import { AccountComparisonChart } from '@/components/insights/AccountComparisonChart';
import { SpendingByCategoryChart, CategorySpendingItem } from '@/components/insights/SpendingByCategoryChart';
import { SpendingByAccountChart, AccountCategoryRow } from '@/components/insights/SpendingByAccountChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, AlertOctagon, RefreshCw, CheckCircle2, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface OutletContext {
    bankProfiles: BankProfile[];
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildCategoryData(txns: Transaction[]): CategorySpendingItem[] {
    const map: Record<string, { amount: number; count: number }> = {};
    const debits = txns.filter(t => t.transaction_type === 'debit');
    const total = debits.reduce((s, t) => s + Math.abs(t.amount), 0);

    for (const t of debits) {
        const cat = t.user_override_category || t.category || 'Other';
        if (!map[cat]) map[cat] = { amount: 0, count: 0 };
        map[cat].amount += Math.abs(t.amount);
        map[cat].count += 1;
    }

    return Object.entries(map)
        .map(([name, { amount, count }]) => ({
            name,
            amount,
            count,
            percentage: total > 0 ? (amount / total) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
}

function buildAccountCategoryData(
    profiles: BankProfile[],
    transactions: Transaction[]
): { rows: AccountCategoryRow[]; accountNames: string[] } {
    const accountNames = profiles.map(p => p.name);

    // collect all categories across all accounts
    const allCategories = new Set<string>();
    const accountCatMap: Record<string, Record<string, number>> = {};

    for (const profile of profiles) {
        accountCatMap[profile.name] = {};
        const profileTxns = transactions.filter(
            t => t.bank_profile_id === profile.id && t.transaction_type === 'debit'
        );
        for (const t of profileTxns) {
            const cat = t.user_override_category || t.category || 'Other';
            allCategories.add(cat);
            accountCatMap[profile.name][cat] =
                (accountCatMap[profile.name][cat] || 0) + Math.abs(t.amount);
        }
    }

    // figure out top categories by total spend across all accounts
    const catTotals: Record<string, number> = {};
    for (const cat of allCategories) {
        catTotals[cat] = profiles.reduce(
            (s, p) => s + (accountCatMap[p.name][cat] || 0),
            0
        );
    }
    const topCats = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cat]) => cat);

    const rows: AccountCategoryRow[] = topCats.map(cat => {
        const row: AccountCategoryRow = { category: cat };
        for (const name of accountNames) {
            row[name] = accountCatMap[name][cat] || 0;
        }
        return row;
    });

    return { rows, accountNames };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Insights() {
    const { user } = useAuth();
    const { bankProfiles } = useOutletContext<OutletContext>();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    // "all" | profile.id
    const [selectedAccount, setSelectedAccount] = useState<string>('all');

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

    // ── Derived data ──────────────────────────────────────────────────────────

    const filteredTxns = useMemo(() => {
        if (selectedAccount === 'all') return transactions;
        return transactions.filter(t => t.bank_profile_id === selectedAccount);
    }, [transactions, selectedAccount]);

    const accountStats = useMemo(() =>
        bankProfiles.map(profile => {
            const profileTrans = transactions.filter(t => t.bank_profile_id === profile.id);
            const income = profileTrans
                .filter(t => t.transaction_type === 'credit')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const expenses = profileTrans
                .filter(t => t.transaction_type === 'debit')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            return { accountName: profile.name, income, expenses, count: profileTrans.length };
        }),
        [transactions, bankProfiles]
    );

    const categoryData = useMemo(() => buildCategoryData(filteredTxns), [filteredTxns]);

    const { rows: accountCategoryRows, accountNames } = useMemo(
        () => buildAccountCategoryData(bankProfiles, transactions),
        [bankProfiles, transactions]
    );

    const anomalies = transactions.filter(t => t.is_anomaly).slice(0, 5);
    const recurring = transactions.filter(t => t.is_recurring);
    const recurringTotal = recurring.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const uniqueRecurring = Array.from(new Set(recurring.map(t => t.merchant_name || t.description)));

    const selectedProfile = bankProfiles.find(p => p.id === selectedAccount);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">

            {/* ── Header ── */}
            <div>
                <h1 className="text-2xl font-bold">Insights</h1>
                <p className="text-muted-foreground">Deep dive into your financial patterns</p>
            </div>

            {/* ── Summary Stats ── */}
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
                        <div className="text-2xl font-bold">Rs. {recurringTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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

            {/* ── Spending Analysis Section ── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Spending Analysis</h2>
                </div>

                {/* Account filter tabs */}
                <Tabs value={selectedAccount} onValueChange={setSelectedAccount}>
                    <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
                        <TabsTrigger value="all" className="text-xs">
                            All Accounts
                        </TabsTrigger>
                        {bankProfiles.map(p => (
                            <TabsTrigger key={p.id} value={p.id} className="text-xs">
                                {p.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* All-accounts view */}
                    <TabsContent value="all" className="mt-4 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SpendingByCategoryChart data={categoryData} />
                            <AccountComparisonChart data={accountStats} />
                        </div>
                        {/* Cross-account category breakdown */}
                        {accountNames.length > 1 && (
                            <SpendingByAccountChart
                                data={accountCategoryRows}
                                accountNames={accountNames}
                            />
                        )}
                    </TabsContent>

                    {/* Per-account view */}
                    {bankProfiles.map(profile => (
                        <TabsContent key={profile.id} value={profile.id} className="mt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <SpendingByCategoryChart
                                    data={categoryData}
                                    accountName={profile.name}
                                />
                                {/* Account summary card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{profile.name}</CardTitle>
                                        <CardDescription>{profile.bank_name} · {profile.account_type}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {(() => {
                                            const stat = accountStats.find(s => s.accountName === profile.name);
                                            if (!stat) return null;
                                            const total = stat.income + stat.expenses;
                                            const incomePercent = total > 0 ? (stat.income / total) * 100 : 0;
                                            return (
                                                <>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>Cash Flow</span>
                                                            <span>{Math.round(incomePercent)}% In / {Math.round(100 - incomePercent)}% Out</span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-red-100 dark:bg-red-900/20 rounded-full overflow-hidden flex">
                                                            <div className="h-full bg-green-500 rounded-l-full transition-all" style={{ width: `${incomePercent}%` }} />
                                                            <div className="h-full bg-red-500 rounded-r-full transition-all" style={{ width: `${100 - incomePercent}%` }} />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                                                            <p className="text-xs text-muted-foreground mb-1">Total Income</p>
                                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                                Rs. {stat.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                                                            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                                                            <p className="font-bold text-red-600 dark:text-red-400">
                                                                Rs. {stat.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center border-t pt-4">
                                                        <span className="font-medium text-sm">Net Balance</span>
                                                        <span className={`text-xl font-bold ${(stat.income - stat.expenses) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            Rs. {(stat.income - stat.expenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>

                                                    <div className="border-t pt-4 space-y-1">
                                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Top Categories</p>
                                                        {categoryData.slice(0, 5).map((cat, i) => {
                                                            const COLORS = ['#6366f1','#8b5cf6','#a855f7','#ec4899','#ef4444'];
                                                            return (
                                                                <div key={cat.name} className="flex items-center gap-2 text-xs">
                                                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                                                                    <span className="flex-1 truncate text-muted-foreground">{cat.name}</span>
                                                                    <span className="font-medium">Rs. {cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                    <span className="text-muted-foreground w-8 text-right">{cat.percentage.toFixed(0)}%</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* ── Account Comparison & Anomalies ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                            <p className="font-bold text-sm text-destructive">Rs. {Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">Anomaly</Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Account Breakdown cards */}
                <div className="space-y-4">
                    <h3 className="text-base font-semibold">Account Summary</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {accountStats.map(stat => {
                            const totalVolume = stat.income + stat.expenses;
                            const incomePercent = totalVolume > 0 ? (stat.income / totalVolume) * 100 : 0;
                            return (
                                <Card key={stat.accountName} className="overflow-hidden">
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="font-semibold text-sm">{stat.accountName}</p>
                                            <Badge variant="outline" className="text-xs">{stat.count} txns</Badge>
                                        </div>
                                        <div className="h-2 w-full bg-red-100 dark:bg-red-900/20 rounded-full overflow-hidden flex mb-3">
                                            <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${incomePercent}%` }} />
                                            <div className="h-full bg-red-500 rounded-r-full" style={{ width: `${100 - incomePercent}%` }} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <p className="text-muted-foreground">Income</p>
                                                <p className="font-medium text-green-600 dark:text-green-400">Rs. {stat.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Spent</p>
                                                <p className="font-medium text-red-600 dark:text-red-400">Rs. {stat.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground">Net</p>
                                                <p className={`font-bold ${(stat.income - stat.expenses) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    Rs. {(stat.income - stat.expenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
}
