
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AccountBalanceHistoryChartProps {
    data: {
        date: string;
        balance: number;
        income: number;
        expenses: number;
    }[];
    type?: 'all' | 'balance' | 'income' | 'expenses';
}

export function AccountBalanceHistoryChart({ data, type = 'all' }: AccountBalanceHistoryChartProps) {
    const getTitle = () => {
        switch (type) {
            case 'balance': return 'Balance History';
            case 'income': return 'Income History';
            case 'expenses': return 'Expense History';
            default: return 'Account History';
        }
    };

    const getDescription = () => {
        switch (type) {
            case 'balance': return 'Net balance over time';
            case 'income': return 'Income trends over time';
            case 'expenses': return 'Spending trends over time';
            default: return 'Balance, Income, and Expenses over time';
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{getTitle()}</CardTitle>
                <CardDescription>{getDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                            <XAxis
                                dataKey="date"
                                className="text-xs"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                className="text-xs"
                                tickFormatter={(value) => `Rs. ${value.toLocaleString()}`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, '']}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend iconType="circle" />
                            {/* Conditional Lines based on type */}
                            {(type === 'all' || type === 'income') && (
                                <Line type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            )}
                            {(type === 'all' || type === 'expenses') && (
                                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            )}
                            {(type === 'all' || type === 'balance') && (
                                <Line type="monotone" dataKey="balance" name="Balance" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
